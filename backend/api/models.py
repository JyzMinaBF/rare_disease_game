from . import db
from datetime import datetime

class Drug(db.Model):
    id          = db.Column(db.String, primary_key=True)
    name        = db.Column(db.String)
    disease     = db.Column(db.String)
    cost        = db.Column(db.Integer)
    qaly        = db.Column(db.Integer)
    launch_round= db.Column(db.Integer)

    def to_dict(self):
        return {c.name: getattr(self, c.name) for c in self.__table__.columns}

class Story(db.Model):
    id          = db.Column(db.String, primary_key=True)
    drug_id     = db.Column(db.String, db.ForeignKey("drug.id"))
    text        = db.Column(db.String)
    penalty     = db.Column(db.Integer)
    launch_round= db.Column(db.Integer)
    death_chance  = db.Column(db.Float,  default=0.1)  # 每 defer 年疊加機率
    death_penalty = db.Column(db.Integer, default=10)  # 病逝扣 Trust
    trust_gain    = db.Column(db.Integer, default=5)   # 每年支付加 Trust

    def to_dict(self):
        return {c.name: getattr(self, c.name) for c in self.__table__.columns}

class Score(db.Model):
    id           = db.Column(db.Integer, primary_key=True)
    qaly         = db.Column(db.Integer)
    budget_left  = db.Column(db.Integer)
    trust        = db.Column(db.Integer)
    coverage     = db.Column(db.Integer)
    created_at   = db.Column(db.DateTime, default=datetime.utcnow)
