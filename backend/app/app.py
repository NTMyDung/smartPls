from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Cho phép React gọi API từ port khác (localhost:3000)

@app.route("/api/hello")
def hello():
    return jsonify(message="Hello from Flask!")

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
