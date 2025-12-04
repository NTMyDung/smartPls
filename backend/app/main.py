from fastapi import FastAPI, UploadFile, File
from pydantic import BaseModel
from typing import List, Optional
import pandas as pd
from fastapi.middleware.cors import CORSMiddleware
from app.service.csv_service import process_csv
from app.service.run_model import CreateModelRequest, create_model_logic
from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse
import math

def sanitize_floats(obj):
    if isinstance(obj, dict):
        return {k: sanitize_floats(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [sanitize_floats(v) for v in obj]
    elif isinstance(obj, float):
        if math.isnan(obj) or math.isinf(obj):
            return None
        return obj
    else:
        return obj


app = FastAPI()

origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,        # cho phép từ các domain trên
    allow_credentials=True,
    allow_methods=["*"],          # GET, POST, PUT, DELETE…
    allow_headers=["*"],          # header tùy ý
)

@app.get("/")
def root():
    return {"message": "Backend is running!"}

@app.post("/upload-csv")
async def upload_csv(file: UploadFile = File(...)):
    print(f"[main.py] /upload-csv called")
    print(f"[main.py] File name: {file.filename}")
    
    # Kiểm tra định dạng file
    if not file.filename.endswith(".csv"):
        print(f"[main.py] ✗ File không phải CSV")
        return {"error": "File phải là CSV"}

    # Gọi service xử lý CSV
    print(f"[main.py] Calling process_csv...")
    summary = process_csv(file.file)
    print(f"[main.py] ✓ process_csv returned: session_id={summary.get('session_id')}")

    return {"status": "success", "summary": summary}

@app.post("/create-model")
async def create_model(request: CreateModelRequest):
    # Gọi logic từ addpath.py để xử lý tạo mô hình với session_id
    # Convert NaN/inf -> null
    try:
        result = create_model_logic(request.pairs, request.session_id, request.action)
        safe_result = sanitize_floats(result)
        return JSONResponse(content=safe_result)
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)

