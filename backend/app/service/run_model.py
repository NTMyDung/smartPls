import pandas as pd
import re
import multiprocessing
from typing import List, Optional
from pydantic import BaseModel
from app.plspm.plspm import Plspm
from app.plspm.scheme import Scheme
from app.plspm.config import Structure, Config, Mode
from app.service.csv_service import get_csv_data
from collections import defaultdict, deque

def assign_layers(path_coefficients):
    """
    Tính layer cho LV dựa trên hướng mũi tên:
    - LV không có ai trỏ vào -> level 1
    - LV được level 1 trỏ vào -> level 2
    - LV được level 2 trỏ vào -> level 3
    - ...
    """
    lvs = list(path_coefficients.keys())

    # 1️⃣ Tính số node TRỎ VÀO mỗi lv (indegree)
    indegree = {
        lv: sum(
            1 for src in lvs
            if src != lv and path_coefficients[src].get(lv, 0) != 0
        )
        for lv in lvs
    }

    # 2️⃣ Những node không ai trỏ vào là level 1
    from collections import defaultdict, deque
    layers = defaultdict(list)
    queue = deque([lv for lv in lvs if indegree[lv] == 0])

    current_layer = 1

    while queue:
        next_queue = deque()

        for lv in queue:
            layers[current_layer].append(lv)

            # giảm indegree của những node mà lv TRỎ TỚI
            for target, coef in path_coefficients[lv].items():
                if coef != 0 and target != lv:
                    indegree[target] -= 1
                    if indegree[target] == 0:
                        next_queue.append(target)

        queue = next_queue
        current_layer += 1

    # 3️⃣ Chia layer 2 thành 2.1 và 2.2
    lv_levels = {}
    for layer, lv_list in layers.items():
        if layer == 2:
            for i, lv in enumerate(lv_list):
                lv_levels[lv] = 2.1 if i % 2 == 0 else 2.2
        else:
            for lv in lv_list:
                lv_levels[lv] = float(layer)

    return lv_levels

#Làm tròn số trước khi trả về JSON
def round_floats(data, digits=3):
    """Recursively round all floats in dict/list."""
    if isinstance(data, float):
        return round(data, digits)

    if isinstance(data, dict):
        return {k: round_floats(v, digits) for k, v in data.items()}

    if isinstance(data, list):
        return [round_floats(item, digits) for item in data]

    return data



# Model cho request tạo mô hình
class PairModel(BaseModel):
    independent: List[str]
    dependent: str

class CreateModelRequest(BaseModel):
    pairs: List[PairModel]
    session_id: Optional[str] = None  # Session ID từ upload-csv
    action: str = "pls" 

def run_pls_analysis(data_df: pd.DataFrame, config: Config, structure: Structure) -> dict:
    """Chạy phân tích PLS-SEM."""
    print("[run_pls_analysis] Starting PLS analysis...")
    pls = Plspm(data_df, config, Scheme.PATH, 300, 1e-7)
    print("[run_pls_analysis] ✓ PLS analysis completed")

    path_coeffs = pls.path_coefficients().to_dict()
    lv_levels = assign_layers(path_coeffs)
    print(lv_levels)
    
    result = {
        "status": "success",
        "action": "pls",
        "path_coefficients": path_coeffs,
        "latent_levels": lv_levels,  # trả luôn level cho frontend
        "inner_summary": pls.inner_summary().to_dict(),
        "inner_model": pls.inner_model().to_dict(),
        "outer_model": pls.outer_model().to_dict(),
        "f2_effect_size": pls.f2().to_dict(),
        "htmt": pls.htmt().to_dict(),
        "fornell_larcker": pls.fornell_larcker().to_dict(),
        "outer_vif": pls.outer_vif().to_dict(),
        "inner_vif": pls.inner_vif().to_dict(),
        "goodness_of_fit": pls.goodness_of_fit()
    }

    return round_floats(result)


def run_bootstrap_analysis(data_df: pd.DataFrame, config: Config, structure: Structure) -> dict:
    """Chạy phân tích Bootstrap."""
    print("[run_bootstrap_analysis] Starting Bootstrap analysis...")
    num_proc = max(1, multiprocessing.cpu_count() - 1)
    pls_boot = Plspm(data_df, config, Scheme.PATH, 300, 1e-7, True, 5000, num_proc)
    boot = pls_boot.bootstrap()
    print("[run_bootstrap_analysis] ✓ Bootstrap analysis completed")

    path_coeffs = boot.paths().to_dict()
    lv_levels = assign_layers(path_coeffs)

    result = {
        "status": "success",
        "action": "bootstrap",
        "latent_levels": lv_levels,
        # "structure": structure.path().to_dict(),
        "bootstrap_paths": boot.paths().to_dict(),
        "bootstrap_loading": boot.loading().to_dict(),
    }

    return round_floats(result)

def create_model_logic(pairs: List[PairModel], session_id: Optional[str], action: str = "pls"):
    """
    Tạo mô hình PLS-SEM hoặc Bootstrap.
    Đơn giản: load data → build structure → config → run analysis
    """
    try:
        print("[create_model_logic] ==================== START ====================")
        print(f"[create_model_logic] Action: {action}")
        
        # ========== STEP 1: Load Data ==========
        print("[create_model_logic] Step 1: Loading data from session...")
        if not session_id:
            raise Exception("Session ID not provided")
        try:
            data_df = get_csv_data(session_id)
            print(f"  ✓ Loaded DataFrame, shape: {data_df.shape}")
        except Exception as e:
            print(f"  ✗ Failed to load session {session_id}: {e}")
            raise Exception(f"Failed to load session data: {e}")
        
        # ========== STEP 2: Build Structure ==========
        print("[create_model_logic] Step 2: Building structure from pairs...")
        structure = Structure()
        for i, pair in enumerate(pairs, 1):
            print(f"  Pair {i}: {pair.independent} → {pair.dependent}")
            structure.add_path(pair.independent, [pair.dependent])
        print("[create_model_logic] ✓ Structure built")
        
        # ========== STEP 3: Create Config ==========
        print("[create_model_logic] Step 3: Creating config...")
        config = Config(structure.path(), scaled=False)
        print("[create_model_logic] ✓ Config created")
        
        # ========== STEP 4: Add Latent Variables ==========
        print("[create_model_logic] Step 4: Adding latent variables...")
        all_variables = set()
        for pair in pairs:
            all_variables.update(pair.independent)
            all_variables.add(pair.dependent)
        
        for var in sorted(all_variables):
            try:
                config.add_lv_with_columns_named(var, Mode.A, data_df, var)
                print(f"  ✓ Added LV: {var}")
            except Exception as e:
                print(f"  ✗ Error adding LV {var}: {e}")
                raise Exception(f"Failed to add LV {var}: {e}")
        
        # ========== STEP 5: Run Analysis ==========
        print(f"[create_model_logic] Step 5: Running {action} analysis...")
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
        return {
            "status": "error",
            "error": str(e)
        }
