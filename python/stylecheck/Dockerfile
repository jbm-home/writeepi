FROM python:3.13-slim

RUN apt-get update && apt-get install -y \
    cmake \
    build-essential \
    git \
    && rm -rf /var/lib/apt/lists/*

RUN pip install --no-cache-dir fastapi requests uvicorn spacy python-json-logger
RUN python -m spacy download fr_core_news_lg

WORKDIR /app
COPY . /app

EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
