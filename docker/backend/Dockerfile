# Backend - Flask + Gunicorn
FROM python:3.11-slim AS base

# Thiết lập biến môi trường (không tạo file .pyc đỡ rác/ in log ra console)
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 
    

# Cài các gói cần thiết để biên dịch (vd: pandas, numpy, psycopg2 cần gcc).
# Sau đó xóa cache APT (rm -rf /var/lib/apt/lists/*) để image nhỏ gọn hơn.
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*
# Đặt thư mục làm việc trong /app
WORKDIR /app
# Sao chép file requirements.txt từ project vào container.
# Cài đặt các dependency Python từ file này.

COPY backend/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

# Copy toàn bộ code của backend vào /app.
COPY backend /app

# Khai báo port mà container sẽ lắng nghe (Flask/Gunicorn chạy trên cổng 5000).
EXPOSE 5000

# Dòng khởi chạy container khi bắt đầu
CMD ["gunicorn", "-b", "0.0.0.0:5000", "app:app", "--workers=2", "--threads=4"]
