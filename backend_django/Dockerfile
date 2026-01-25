FROM python:3.10-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    python3-dev \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install gunicorn

COPY . .

# Collect static files (if needed, though API mode usually doesn't need them served by Django)
RUN python manage.py collectstatic --noinput

EXPOSE 8000

CMD ["gunicorn", "dataviz_backend.wsgi:application", "--bind", "0.0.0.0:8000"]
