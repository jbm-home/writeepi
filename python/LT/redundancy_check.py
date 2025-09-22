from flask import Flask, request, jsonify
from collections import Counter

app = Flask(__name__)

@app.route("/redundancy", methods=["POST"])
def redundancy():
    text = request.json.get("text", "")
    words = [w.lower() for w in text.split()]
    counter = Counter(words)
    repeats = {w:c for w,c in counter.items() if c > 3}
    return jsonify({"repetitions": repeats})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8003)
