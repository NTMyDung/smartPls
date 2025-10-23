import csv
import io
from typing import Any, Dict, List

from flask import Flask, jsonify, request
from flask_cors import CORS
import pandas as pd


def create_app() -> Flask:
    app = Flask(__name__)
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    MAX_FILE_SIZE_MB = 50

    @app.get("/api/health")
    def health() -> Any:
        return {"status": "ok"}

    def _human_size(num_bytes: int) -> str:
        step = 1024.0
        size = float(num_bytes)
        for unit in ["B", "KB", "MB", "GB", "TB"]:
            if size < step:
                return f"{size:.2f} {unit}"
            size /= step
        return f"{size:.2f} PB"

    def _detect_delimiter(sample_text: str) -> str:
        try:
            dialect = csv.Sniffer().sniff(sample_text)
            return dialect.delimiter
        except Exception:
            # Default to comma
            return ","

    @app.post("/api/upload")
    def upload() -> Any:
        if "file" not in request.files:
            return jsonify({"error": "Thiếu trường file trong form-data (key 'file')"}), 400

        file = request.files["file"]
        if file.filename == "":
            return jsonify({"error": "Chưa chọn tệp"}), 400

        raw_bytes = file.read()
        size_bytes = len(raw_bytes)
        if size_bytes == 0:
            return jsonify({"error": "Tệp trống"}), 400

        if size_bytes > MAX_FILE_SIZE_MB * 1024 * 1024:
            return jsonify({
                "error": f"Kích thước tệp vượt quá {MAX_FILE_SIZE_MB}MB",
                "sizeBytes": size_bytes,
            }), 413

        # Try decode with UTF-8, fallback to Latin-1
        try:
            decoded = raw_bytes.decode("utf-8")
        except UnicodeDecodeError:
            decoded = raw_bytes.decode("latin-1", errors="replace")

        # Detect delimiter from a sample
        sample = decoded[:4096]
        delimiter = _detect_delimiter(sample)

        # Build dataframe
        try:
            df = pd.read_csv(io.StringIO(decoded), sep=delimiter, engine="python")
        except Exception as e:
            return jsonify({"error": f"Không thể đọc CSV: {str(e)}"}), 400

        num_rows = int(df.shape[0])
        num_columns = int(df.shape[1])

        # Prepare columns summary
        columns_info: List[Dict[str, Any]] = []
        null_counts = df.isna().sum()
        for col in df.columns:
            sample_values = (
                df[col].dropna().astype(str).head(3).tolist()
            )
            dtype_str = str(df[col].dtype)
            columns_info.append({
                "name": str(col),
                "dtype": dtype_str,
                "nulls": int(null_counts.get(col, 0)),
                "sampleValues": sample_values,
            })

        head_rows: List[Dict[str, Any]] = df.head(5).to_dict(orient="records")

        result: Dict[str, Any] = {
            "filename": file.filename,
            "sizeBytes": size_bytes,
            "sizeHuman": _human_size(size_bytes),
            "delimiter": delimiter,
            "numRows": num_rows,
            "numColumns": num_columns,
            "columns": columns_info,
            "head": head_rows,
        }
        return jsonify(result)

    return app


app = create_app()
