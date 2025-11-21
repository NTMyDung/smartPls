import pandas as pd
import re
import multiprocessing
from typing import List, Optional
from pydantic import BaseModel
from app.plspm.plspm import Plspm
from app.plspm.scheme import Scheme
from app.plspm.config import Structure, Config, Mode
from app.service.csv_service import get_csv_data


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
    return {
        "status": "success",
        "action": "pls",
        # "structure": structure.path().to_dict(),
        "path_coefficients": pls.path_coefficients().to_dict(),
        "inner_model": pls.inner_model().to_dict(),
        "outer_model": pls.outer_model().to_dict(),
    }


def run_bootstrap_analysis(data_df: pd.DataFrame, config: Config, structure: Structure) -> dict:
    """Chạy phân tích Bootstrap."""
    print("[run_bootstrap_analysis] Starting Bootstrap analysis...")
    num_proc = max(1, multiprocessing.cpu_count() - 1)
    pls_boot = Plspm(data_df, config, Scheme.PATH, 300, 1e-7, True, 5000, num_proc)
    boot = pls_boot.bootstrap()
    print("[run_bootstrap_analysis] ✓ Bootstrap analysis completed")
    return {
        "status": "success",
        "action": "bootstrap",
        # "structure": structure.path().to_dict(),
        "bootstrap_paths": boot.paths().to_dict(),
        "bootstrap_loading": boot.loading().to_dict(),
    }


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
