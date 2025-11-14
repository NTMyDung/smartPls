import pandas as pd
import re

def process_csv(file):
    df = pd.read_csv(file)

    # ======= TÁCH TÊN BIẾN =======
    variables = set()

    for col in df.columns:
        # Lấy chuỗi chữ cái ở đầu (VD: "VIA1" -> "VIA")
        match = re.match(r"[A-Za-z]+", col)
        if match:
            variables.add(match.group(0))

    variables = sorted(list(variables))  # chuyển thành list để trả ra JSON

    # ======= TẠO SUMMARY =======
    summary = {
        "columns": list(df.columns),
        "variables": variables,
        "row_count": len(df),
        "describe": df.describe(include="all").fillna("").to_dict(),
        "preview": df.head(10).fillna("").to_dict(orient="records")  # 👈 thêm preview
    }

    return summary
