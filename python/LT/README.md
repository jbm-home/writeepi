## create image / dev run
docker build -t ghcr.io/jbm-home/writeepi-lt:latest .
docker push ghcr.io/jbm-home/writeepi-lt:latest
docker run -d --name writeepi-lt -p 8000:8000 --network writeepi-dev ghcr.io/jbm-home/writeepi-lt:latest