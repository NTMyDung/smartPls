from fastapi import FastAPI, UploadFile, File
import pandas as pd
from fastapi.middleware.cors import CORSMiddleware
from app.service.csv_service import process_csv

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/upload-csv")
async def upload_csv(file: UploadFile = File(...)):
    # Kiểm tra định dạng file
    if not file.filename.endswith(".csv"):
        return {"error": "File phải là CSV"}

    # Gọi service xử lý CSV
    summary = process_csv(file.file)

    return {"status": "success", "summary": summary}