# CSV Reader Web App (React + Flask)

Ứng dụng web đơn giản cho phép tải lên tệp CSV, tự động phát hiện delimiter, và hiển thị thông tin tổng quan: số dòng, số cột, kiểu dữ liệu từng cột, số lượng null, và 5 dòng đầu.
Chạy:
Backend: cd backend -> uvicorn app.main:app --reload
Frontend: cd frontend -> npm run dev

## Cấu trúc thư mục

```
/workspace
├─ backend
│  ├─ app
│  │  └─ main.py
│  └─ requirements.txt
├─ frontend
│  ├─ index.html
│  ├─ package.json
│  ├─ vite.config.js
│  └─ src
│     ├─ main.jsx
│     ├─ index.css
│     └─ App.jsx


## Backend (Flask)
- Framework: Flask + Gunicorn
- CORS bật cho đường dẫn `/api/*`


## Frontend (React + Vite)
- React 18 + TypeScript, Axios để gọi API
- Proxy Vite chuyển `/api` tới `http://localhost:3000`

## Điều kiện chọn các cặp biến:
1. Biến độc lập != biến phụ thuộc trong 1 đợt chọn.
2. Phải có ít nhất 1 biến độc lập & phụ thuộc trong 1 đợt chọn.
3.(cân nhắc): Không tạo vòng kép kín: AB ->CD và CD->AB.

