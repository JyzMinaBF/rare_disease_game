from pathlib import Path
from flask import Flask, send_from_directory
from api.routes import api_bp
from api.models import db

BASE_DIR = Path(__file__).resolve().parent
STATIC_DIR = BASE_DIR / "game"            # ← 前端 build 會放進來

app = Flask(__name__, static_folder=str(STATIC_DIR), static_url_path="")
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///rare.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
db.init_app(app)
app.register_blueprint(api_bp, url_prefix="/api")

@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def catch_all(path):
    file_path = STATIC_DIR / path
    if file_path.is_file():
        return app.send_static_file(path)     # 任何靜態檔（CSS/JS/png…）
    return app.send_static_file("index.html") # 其餘交給前端路由


if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    app.run(debug=True, port=5000)
