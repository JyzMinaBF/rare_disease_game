import json, pathlib
from api.models import db, Drug, Story
from app import app    # 直接導入 Flask app

BASE = pathlib.Path(__file__).resolve().parent

with app.app_context():
    db.create_all()
    if not Drug.query.first():
        drugs = json.load(open(BASE/"data/drugs.json", encoding="utf-8"))
        stories = json.load(open(BASE/"data/stories.json", encoding="utf-8"))
        db.session.bulk_insert_mappings(Drug, drugs)
        db.session.bulk_insert_mappings(Story, stories)
        db.session.commit()
        print("Seeded DB ✔")
