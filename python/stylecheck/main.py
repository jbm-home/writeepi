from fastapi import FastAPI, Request
from starlette.middleware.base import BaseHTTPMiddleware
from pydantic import BaseModel
from typing import List, Dict
import time
import logging
import sys
from pythonjsonlogger import jsonlogger
from datetime import datetime, timezone
import spacy

MAX_SENTENCE_LENGTH = 30
MAX_SUBORDINATES = 2
SUITECASE_VECTOR_THRESHOLD = 0.7
SUITECASE_FREQ_THRESHOLD = 2
SEED_TERMS = [
    # ultra génériques
    "chose", "truc", "machin", "bidule",

    # flous académiques
    "aspect", "élément", "facteur", "paramètre",

    # flous organisationnels
    "domaine", "secteur", "problématique", "sujet",

    # concepts passe-partout
    "notion", "idée", "concept", "thème"
]

# ==============================
# Logger JSON (Miscaf infra)
# ==============================
class MiscafJsonFormatter(jsonlogger.JsonFormatter):
    def add_fields(self, log_record, record, message_dict):
        super().add_fields(log_record, record, message_dict)
        log_record['level'] = record.levelname.lower()
        log_record['message'] = record.getMessage()
        log_record['context'] = getattr(record, 'context', 'unknown')
        log_record['ip'] = getattr(record, 'ip', '')
        log_record['@timestamp'] = datetime.fromtimestamp(record.created, tz=timezone.utc) \
            .isoformat(timespec="milliseconds").replace("+00:00", "Z")

logger = logging.getLogger("writeepi-stylecheck")
logger.setLevel(logging.DEBUG)

handler = logging.StreamHandler(sys.stdout)
formatter = MiscafJsonFormatter()
handler.setFormatter(formatter)
logger.handlers = [handler]

# Disable Uvicorn access logs
uvicorn_logger = logging.getLogger("uvicorn.access")
uvicorn_logger.setLevel(logging.WARNING)

logger.info("Starting...", extra={"context": "stylecheck"})

# ==============================
# Middleware for request logging
# ==============================
EXCLUDED_PATHS = {"/health"}

class LoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        path = request.url.path
        if path in EXCLUDED_PATHS:
            return await call_next(request)
        logger.info(f"↪ {request.method} {path} from {request.client.host}",
                    extra={"context": "stylecheck-service", "ip": request.client.host})
        response = await call_next(request)
        logger.info(f"↩ {request.method} {path} - {response.status_code}",
                    extra={"context": "stylecheck-service", "ip": request.client.host})
        return response

# ==============================
# Load spaCy model (French)
# ==============================
logger.info("Loading spaCy model...", extra={"context": "stylecheck"})
try:
    nlp = spacy.load("fr_core_news_lg")  # use 'lg' for more accurate vectors
except OSError:
    logger.error("⚠ spaCy model not found. Run: python -m spacy download fr_core_news_lg",
                 extra={"context": "stylecheck"})
    raise
logger.info("spaCy model loaded.", extra={"context": "stylecheck"})

# Seed words for suitcase/generic detection
SEEDS = [nlp(term)[0] for term in SEED_TERMS if nlp(term)]

# ==============================
# Detection heuristics
# ==============================
def detect_long_sentences(doc, max_words: int = MAX_SENTENCE_LENGTH) -> List[str]:
    """Return sentences that are longer than max_words."""
    return [sent.text.strip() for sent in doc.sents if len(sent) > max_words]

def detect_suitcase_words(doc, sim_threshold: float = SUITECASE_VECTOR_THRESHOLD, freq_threshold: int = SUITECASE_FREQ_THRESHOLD) -> List[str]:
    """
    Hybrid suitcase-word detector
    """
    out = set()

    # Local noun frequency map (per doc)
    counts = {}
    for tok in doc:
        if tok.pos_ == "NOUN" and not tok.is_stop:
            key = tok.lemma_.lower()
            counts[key] = counts.get(key, 0) + 1

    for tok in doc:
        if tok.pos_ != "NOUN" or tok.is_stop:
            continue
        low = tok.text.lower()

        # Vector similarity
        if tok.has_vector and SEEDS:
            if any(tok.similarity(seed) > sim_threshold for seed in SEEDS):
                out.add(tok.text)
                continue

        # Structural genericity
        if (counts.get(tok.lemma_.lower(), 0) >= freq_threshold and
            len(low) <= 7 and
            any(ch.dep_ == "det" for ch in tok.children) and
            not any(ch.pos_ in ("ADJ", "NOUN", "PROPN") for ch in tok.children if ch.dep_ != "det")):
            out.add(tok.text)
            continue

    return sorted(out)

def detect_passive_voice(doc) -> List[str]:
    """Detect sentences with passive voice using dependency labels."""
    passive_sentences = []
    for sent in doc.sents:
        if any(tok.dep_ == "aux:pass" for tok in sent):
            passive_sentences.append(sent.text.strip())
    return passive_sentences

def detect_complex_subordination(doc, max_subs: int = MAX_SUBORDINATES) -> List[str]:
    """Detect sentences with too many subordinate clauses."""
    complex_sentences = []
    for sent in doc.sents:
        subs = sum(1 for tok in sent if tok.dep_ in ("mark", "advcl", "ccomp"))
        if subs > max_subs:
            complex_sentences.append(sent.text.strip())
    return complex_sentences

# ==============================
# FastAPI app
# ==============================
app = FastAPI()
app.add_middleware(LoggingMiddleware)

logger.info("Server running on http://0.0.0.0:8000", extra={"context": "stylecheck"})

class StyleRequest(BaseModel):
    text: List[str]

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/stylecheck")
def analyze_style(req: StyleRequest) -> Dict:
    logger.info(f"Asking stylecheck analysis", extra={"context": "stylecheck"})
    start = time.time()

    try:
        results = []
        for paragraph in req.text:
            doc = nlp(paragraph)
            issues = {
                "long_sentences": detect_long_sentences(doc),
                "suitcase_words": detect_suitcase_words(doc),
                "passive_voice": detect_passive_voice(doc),
                "complex_subordination": detect_complex_subordination(doc)
            }
            results.append({"text": paragraph, "issues": issues})

        elapsed = time.time() - start
        logger.info(f"✔ stylecheck analysis done in {elapsed:.2f} seconds", extra={"context": "stylecheck"})

    except Exception as e:
        logger.error(f"stylecheck analysis error: {str(e)}", extra={"context": "stylecheck"})
        return {"error": str(e)}

    return {"results": results}
