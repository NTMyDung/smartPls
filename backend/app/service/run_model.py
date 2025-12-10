import pandas as pd
import multiprocessing
from typing import List, Optional
from pydantic import BaseModel
from app.plspm.plspm import Plspm
from app.plspm.scheme import Scheme
from app.plspm.config import Structure, Config, Mode
from app.service.csv_service import get_csv_data
from collections import defaultdict, deque

# ========================== Helper Functions ==========================

def assign_layers(path_coefficients):
    """
    Tính layer cho LV dựa trên hướng mũi tên:
    - LV không có ai trỏ vào -> level 1
    - LV được level 1 trỏ vào -> level 2
    - LV được level 2 trỏ vào -> level 3
    - ...
    """
    lvs = list(path_coefficients.keys())

    indegree = {lv: sum(
        1 for src in lvs
        if src != lv and path_coefficients[src].get(lv, 0) != 0
    ) for lv in lvs}

    layers = defaultdict(list)
    queue = deque([lv for lv in lvs if indegree[lv] == 0])

    current_layer = 1
    while queue:
        next_queue = deque()
        for lv in queue:
            layers[current_layer].append(lv)
            for target, coef in path_coefficients[lv].items():
                if coef != 0 and target != lv:
                    if target not in indegree:
                        # target không có trong path_coefficients keys → bỏ qua
                        continue
                    indegree[target] -= 1
                    if indegree[target] == 0:
                        next_queue.append(target)
        queue = next_queue
        current_layer += 1

    # Chia layer 2 thành 2.1 và 2.2
    lv_levels = {}
    for layer, lv_list in layers.items():
        if layer == 2:
            for i, lv in enumerate(lv_list):
                lv_levels[lv] = 2.1 if i % 2 == 0 else 2.2
        else:
            for lv in lv_list:
                lv_levels[lv] = float(layer)
    return lv_levels

def round_floats(data, digits=3):
    """Recursively round all floats in dict/list."""
    if isinstance(data, float):
        return round(data, digits)
    if isinstance(data, dict):
        return {k: round_floats(v, digits) for k, v in data.items()}
    if isinstance(data, list):
        return [round_floats(item, digits) for item in data]
    return data

def sanitize_pairs(pairs):
    """Loại bỏ mũi tên hoặc ký tự lạ trong LV names."""
    sanitized = []
    for pair in pairs:
        indep_clean = [x.strip().split("->")[-1].strip() for x in pair.independent]
        dep_clean = pair.dependent.strip().split("->")[-1].strip()
        sanitized.append({
            "independent": indep_clean,
            "dependent": dep_clean
        })
    return sanitized

# ========================== Pydantic Models ==========================

class PairModel(BaseModel):
    independent: List[str]
    dependent: str

class CreateModelRequest(BaseModel):
    pairs: List[PairModel]
    session_id: Optional[str] = None
    action: str = "pls"

# ========================== PLS / Bootstrap Analysis ==========================

def run_pls_analysis(data_df: pd.DataFrame, config: Config, structure: Structure) -> dict:
    print("[run_pls_analysis] Starting PLS analysis...")
    pls = Plspm(data_df, config, Scheme.PATH, 300, 1e-7)

    path_coeffs = pls.path_coefficients().to_dict()
    lv_levels = assign_layers(path_coeffs)
    df = pls.unidimensionality()
    print("[DEBUG] DataFrame ca_cr:")
    print(df)  # Xem DataFrame thật
    print("[DEBUG] ca_cr.to_dict():")
    print(df.to_dict(orient="records"))  # Xem dạng list of dict dễ đọc


    # print_treated_data(config, data_df)
    
    result = {
        "status": "success",
        "action": "pls",
        "path_coefficients": path_coeffs,
        "latent_levels": lv_levels,
        "inner_summary": pls.inner_summary().to_dict(),
        "inner_model": pls.inner_model().to_dict(),
        "outer_model": pls.outer_model().to_dict(),
        "f2_effect_size": pls.f2().to_dict(),
        "htmt": pls.htmt().to_dict(),
        "fornell_larcker": pls.fornell_larcker().to_dict(),
        "outer_vif": pls.outer_vif().to_dict(),
        "inner_vif": pls.inner_vif().to_dict(),
        "ca_cr": pls.unidimensionality().to_dict(),
    }

    return round_floats(result)

def run_bootstrap_analysis(data_df: pd.DataFrame, config: Config, structure: Structure) -> dict:
    pls = Plspm(data_df, config, Scheme.PATH, 300, 1e-7)

    path_coeffs = pls.path_coefficients().to_dict()
    lv_levels = assign_layers(path_coeffs)

    print("[run_bootstrap_analysis] Starting Bootstrap analysis...")
    num_proc = max(1, multiprocessing.cpu_count() - 1)
    while 5000 % num_proc != 0:
        num_proc -= 1
    pls_boot = Plspm(data_df, config, Scheme.PATH, 300, 1e-7, True, 5000, num_proc)
    boot = pls_boot.bootstrap()
    print("[run_bootstrap_analysis] ✓ Bootstrap analysis completed")

    result = {
        "status": "success",
        "action": "bootstrap",
        "path_coefficients": path_coeffs,
        "latent_levels": lv_levels,
        "outer_model": pls.outer_model().to_dict(),
        "inner_model": pls.inner_model().to_dict(),
        "bootstrap_path": boot.paths().to_dict(),
        "bootstrap_loading": boot.loading().to_dict(),
    }

    return round_floats(result)

# ========================== Main Logic ==========================

def create_model_logic(pairs: List[PairModel], session_id: Optional[str], action: str = "pls"):
    try:
        print("[create_model_logic] ==================== START ====================")
        print(f"[create_model_logic] Action: {action}")

        # ===== STEP 1: Load Data =====
        if not session_id:
            raise Exception("Session ID not provided")
        data_df = get_csv_data(session_id)
        print(f"  ✓ Loaded DataFrame, shape: {data_df.shape}")

        # ===== STEP 2: Sanitize Pairs =====
        print("[create_model_logic] Step 2: Sanitizing pairs...")
        sanitized = sanitize_pairs(pairs)

        # ===== STEP 3: Build Structure =====
        print("[create_model_logic] Step 3: Building structure...")
        structure = Structure()
        for i, pair in enumerate(sanitized, 1):
            print(f"  Pair {i}: {pair['independent']} → {pair['dependent']}")
            structure.add_path(pair['independent'], [pair['dependent']])
        print("  ✓ Structure built")

        # ===== STEP 4: Create Config =====
        print("[create_model_logic] Step 4: Creating config...")
        config = Config(structure.path(), scaled=False)
        print("  ✓ Config created")

        # ===== STEP 5: Add Latent Variables =====
        print("[create_model_logic] Step 5: Adding latent variables...")
        all_vars = set()
        for pair in sanitized:
            all_vars.update(pair['independent'])
            all_vars.add(pair['dependent'])
        for var in sorted(all_vars):
            config.add_lv_with_columns_named(var, Mode.A, data_df, var)
            print(f"  ✓ Added LV: {var}")

        # ===== STEP 6: Run Analysis =====
        print(f"[create_model_logic] Step 6: Running {action} analysis...")
        action = (action or "pls").lower()
        if action == "pls":
            result = run_pls_analysis(data_df, config, structure)
        elif action == "bootstrap":
            result = run_bootstrap_analysis(data_df, config, structure)
        else:
            raise ValueError(f"Unknown action: {action}")

        print("[create_model_logic] ==================== SUCCESS ====================")
        return result

    except Exception as e:
        print(f"[create_model_logic] ✗ Exception: {e}")
        import traceback
        traceback.print_exc()
        return {"status": "error", "error": str(e)}
    
def print_treated_data(config: Config, data_df: pd.DataFrame, max_rows=10):
    """
    In dữ liệu đã qua xử lý (treat) từ Config.

    Tham số:
        config: object Config
        data_df: DataFrame gốc
        max_rows: số dòng in ra để kiểm tra
    """
    treated = config.treat(data_df)
    print("=== Treated Data Summary ===")
    print(f"Shape: {treated.shape}")
    print(f"Columns: {list(treated.columns)}\n")
    
    # In một số dòng đầu
    print("Sample rows:")
    print(treated.head(max_rows))
    
    # Nếu có dummy matrix, in luôn shape và vài giá trị đầu
    if config._Config__dummies:
        print("\nDummy Matrices:")
        for mv, dummy in config._Config__dummies.items():
            print(f"  MV: {mv}, Dummy shape: {dummy.shape}")
            print(f"    Sample:\n{dummy[:min(3, len(dummy)), :]}")  # in 3 dòng đầu

