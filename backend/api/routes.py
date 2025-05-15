from flask import Blueprint, jsonify, request
from .models import db, Drug, Story, Score
import random

api_bp = Blueprint("api", __name__)

@api_bp.get("/drugs")
def list_drugs():
    return jsonify([d.to_dict() for d in Drug.query.all()])

@api_bp.get("/stories")
def list_stories():
    rnd = request.args.get("round", type=int, default=1)
    pool = Story.query.filter(Story.launch_round <= rnd).all()
    return jsonify([s.to_dict() for s in pool])

@api_bp.post("/score")
def save_score():
    data = request.json
    s = Score(**data)
    db.session.add(s); db.session.commit()
    return {"id": s.id}, 201

@api_bp.get("/new_story")
def new_story():
    rnd = request.args.get("round", type=int, default=1)
    # 只挑沒出現過 & launch_round <= rnd
    row  = Story.query.filter(Story.launch_round <= rnd).order_by(db.func.random())
    for r in row:
        # print(r.to_dict())
        pass
    return r.to_dict()
