import pandas as pd
import re
from typing import Dict
import time

# Global dictionary để lưu trữ DataFrames trong session
# Key: session_id (timestamp), Value: DataFrame
csv_storage: Dict[str, pd.DataFrame] = {}

def process_csv(file):
    df = pd.read_csv(file)

    # ======= TÁCH TÊN BIẾN TỪ FILE=======
    variables = set()

    for col in df.columns:
        # Chỉ lấy các cột có dạng: CHỮ + SỐ  (VD: VIA1, PEE3, CUE4)
        match = re.match(r"^([A-Za-z]+)([^A-Za-z].*)$", col)
        if match:
            variables.add(match.group(1))  # group(1) là phần chữ cái

    variables = list(variables)

    # Tạo session ID duy nhất để lưu DataFrame
    session_id = str(int(time.time() * 1000))
    
    # Lưu vào RAM
    csv_storage[session_id] = df
    print(f"[csv_service] ✓ DataFrame stored with session_id: {session_id}, shape: {df.shape}")
    print(f"[csv_service] Current storage size: {len(csv_storage)} session(s)")

    # ======= TẠO SUMMARY =======
    summary = {
        "session_id": session_id,  # Trả về session_id để frontend dùng sau này
        "columns": list(df.columns),
        "variables": variables,
        "row_count": len(df),
        "describe": df.describe(include="all").fillna("").to_dict(),
        "preview": df.head(10).fillna("").to_dict(orient="records")
    }
    return summary

def get_csv_data(session_id: str) -> pd.DataFrame:
    """Lấy DataFrame từ storage bằng session_id"""
    if session_id not in csv_storage:
        raise ValueError(f"Session ID {session_id} not found")
    return csv_storage[session_id]


