FROM python:3.10-slim
WORKDIR /app
COPY requirements_assam.txt .
RUN pip install --no-cache-dir -r requirements_assam.txt
COPY . .
CMD ["uvicorn", "api.main_assam:app", "--host", "0.0.0.0", "--port", "8000"]
