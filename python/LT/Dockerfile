FROM openjdk:21-slim

ENV LANGUAGETOOL_VERSION=latest-snapshot
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 python3-pip curl unzip git build-essential supervisor wget ca-certificates \
 && rm -rf /var/lib/apt/lists/*

RUN git clone https://github.com/facebookresearch/fastText.git /opt/fastText \
 && cd /opt/fastText && make && ln -s /opt/fastText/fasttext /usr/local/bin/fasttext

RUN curl -L -o /app/lid.176.bin https://dl.fbaipublicfiles.com/fasttext/supervised-models/lid.176.bin

RUN curl -L -o /app/LanguageTool.zip \
    https://languagetool.org/download/snapshots/LanguageTool-${LANGUAGETOOL_VERSION}.zip \
 && unzip /app/LanguageTool.zip -d /app/ \
 && mv /app/LanguageTool-* /app/LanguageTool \
 && rm /app/LanguageTool.zip

COPY redundancy_check.py /app/redundancy_check.py
COPY gateway.py /app/gateway.py
COPY stylecheck.py /app/stylecheck.py
RUN pip3 install --no-cache-dir requests flask spacy --break-system-packages
RUN python3 -m spacy download fr_core_news_lg --break-system-packages

COPY server.properties /app/server.properties

COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

EXPOSE 8000 8001 8002 8003
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
