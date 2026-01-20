# Use official Python image as base
FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
  PYTHONUNBUFFERED=1

# Set working directory
WORKDIR /app

# Copy requirements files
COPY backend/app/requirements.txt backend/app/requirements.txt
COPY requirements-dev.txt requirements-dev.txt

# Install dependencies
RUN python -m venv /opt/venv && \
  . /opt/venv/bin/activate && \
  pip install --upgrade pip && \
  pip install -r backend/app/requirements.txt && \
  pip install -r requirements-dev.txt

# Ensure the venv is activated by default
ENV PATH="/opt/venv/bin:$PATH"

# Copy the rest of the application
COPY . .

# Expose the port Flask runs on
EXPOSE 5001

# Default command
CMD ["python", "backend/app/main.py"]