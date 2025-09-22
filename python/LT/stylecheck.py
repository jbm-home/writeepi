from flask import Flask, request, jsonify
from typing import List, Dict
import time
import spacy

MAX_SENTENCE_LENGTH = 30
MAX_SUBORDINATES = 2
SUITECASE_VECTOR_THRESHOLD = 0.7
SUITECASE_FREQ_THRESHOLD = 2
SEED_TERMS = [
    "chose", "truc", "machin", "bidule",
    "aspect", "élément", "facteur", "paramètre",
    "domaine", "secteur", "problématique", "sujet",
    "notion", "idée", "concept", "thème"
]

print("Loading spaCy model...")
try:
    nlp = spacy.load("fr_core_news_lg")
except OSError:
    print("⚠ spaCy model not found. Run: python -m spacy download fr_core_news_lg")
    raise
print("spaCy model loaded.")

# Seed words for suitcase/generic detection
SEEDS = [nlp(term)[0] for term in SEED_TERMS if nlp(term)]

def detect_long_sentences(doc, max_words: int = MAX_SENTENCE_LENGTH) -> List[str]:
    """Return sentences that are longer than max_words."""
    return [sent.text.strip() for sent in doc.sents if len(sent) > max_words]

def detect_suitcase_words(doc, sim_threshold: float = SUITECASE_VECTOR_THRESHOLD, freq_threshold: int = SUITECASE_FREQ_THRESHOLD) -> List[str]:
    """
    Hybrid suitcase-word detector
    """
    out = set()

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


app = Flask(__name__)

@app.get("/health")
def health():
    return jsonify({"status": "ok"})

@app.post("/stylecheck")
def analyze_style():
    try:
        text = request.json.get("text", "")
        doc = nlp(text)
        issues = {
            "long_sentences": detect_long_sentences(doc),
            "suitcase_words": detect_suitcase_words(doc),
            "passive_voice": detect_passive_voice(doc),
            "complex_subordination": detect_complex_subordination(doc)
        }
        return jsonify({"issues": issues})
    except Exception as e:
        print(f"stylecheck analysis error: {str(e)}")
        return jsonify({"issues": {}})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8002)
