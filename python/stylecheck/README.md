## before
pip install --no-cache-dir fastapi requests uvicorn spacy python-json-logger \
    && python -m spacy download fr_core_news_lg

## Run
python3 -m uvicorn main:app --host 0.0.0.0 --port 8000
or
python3 -m fastapi dev main.py

## create image / dev run
docker build -t ghcr.io/jbm-home/writeepi-stylecheck:latest .
docker push ghcr.io/jbm-home/writeepi-stylecheck:latest
docker run -d --name writeepi-server -p 8000:8000 --network writeepi-dev ghcr.io/jbm-home/writeepi-stylecheck:latest