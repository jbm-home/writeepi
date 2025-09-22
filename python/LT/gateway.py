from flask import Flask, request, jsonify
import requests

app = Flask(__name__)

LT_URL = "http://localhost:8001/v2/check"
STYLECHECK_URL = "http://localhost:8002/stylecheck"
REDUNDANCY_URL = "http://localhost:8003/redundancy"

@app.route("/check", methods=["POST"])
def check():
    payload = request.get_json()

    if isinstance(payload.get("text"), list):
        texts = payload["text"]
        lang = payload.get("language", "fr")
        results = []

        for text in texts:
            # --- LanguageTool ---
            lt_resp = requests.post(LT_URL, data={"text": text, "language": lang})
            lt_json = lt_resp.json()

            # --- StyleCheck ---
            sc_resp = requests.post(STYLECHECK_URL, json={"text": text})
            sc_json = sc_resp.json()

            # --- Redundancy ---
            rd_resp = requests.post(REDUNDANCY_URL, json={"text": text})
            rd_json = rd_resp.json()

            results.append({
                "text": text,
                "language": lang,
                "matches": lt_json.get("matches", []),
                "stylecheck": sc_json.get("issues", {}),
                "repetitions": rd_json.get("repetitions", {})
            })

        return jsonify({"results": results})

    else:
        return jsonify({"results": []})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000)
