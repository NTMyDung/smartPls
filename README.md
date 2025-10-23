# CSV Reader Web App (React + Flask)

Ứng dụng web đơn giản cho phép tải lên tệp CSV, tự động phát hiện delimiter, và hiển thị thông tin tổng quan: số dòng, số cột, kiểu dữ liệu từng cột, số lượng null, và 5 dòng đầu.

## Cấu trúc thư mục

```
/workspace
├─ backend
│  ├─ app
│  │  ├─ __init__.py
│  │  └─ main.py
│  └─ requirements.txt
├─ frontend
│  ├─ index.html
│  ├─ package.json
│  ├─ tsconfig.json
│  ├─ vite.config.ts
│  └─ src
│     ├─ main.tsx
│     ├─ styles.css
│     └─ ui
│        └─ App.tsx
├─ docker
│  ├─ backend
│  │  └─ Dockerfile
│  ├─ frontend
│  │  └─ Dockerfile
│  └─ nginx
│     └─ default.conf
└─ docker-compose.yml
```

## Backend (Flask)
- Framework: Flask + Gunicorn
- Phân tích CSV dùng `pandas`
- CORS bật cho đường dẫn `/api/*`

### API
- `GET /api/health`: kiểm tra tình trạng server
- `POST /api/upload` (multipart/form-data, key `file`): trả về
  ```json
  {
    "filename": "...",
    "sizeBytes": 123,
    "sizeHuman": "123.00 KB",
    "delimiter": ",",
    "numRows": 1000,
    "numColumns": 12,
    "columns": [
      { "name": "col1", "dtype": "int64", "nulls": 0, "sampleValues": ["1","2","3"] }
    ],
    "head": [ { "col1": 1, "col2": "a" } ]
  }
  ```

Chạy local (không docker):
```bash
# Tạo venv và cài đặt
python3 -m venv .venv && source .venv/bin/activate
pip install -r backend/requirements.txt
# Chạy dev (Flask built-in)
export FLASK_APP=app.main:app
flask --app backend/app/main.py --debug run -p 5000
```

## Frontend (React + Vite)
- React 18 + TypeScript, Axios để gọi API
- Proxy Vite chuyển `/api` tới `http://localhost:5000`

Chạy local (không docker):
```bash
cd frontend
npm install
npm run dev
# Mở http://localhost:5173
```

## Chạy bằng Docker
Yêu cầu: Docker và Docker Compose.

```bash
# Build images
docker compose build
# Run containers
docker compose up -d
# Frontend: http://localhost:8080
# Backend:  http://localhost:5000/api/health
```

Dừng và xóa containers:
```bash
docker compose down
```

## Ghi chú
- Giới hạn kích thước tệp mặc định: 50MB
- Tự động phát hiện delimiter; mặc định là `,` nếu không đoán được
- Hỗ trợ mã hóa UTF-8; fallback Latin-1 nếu lỗi
