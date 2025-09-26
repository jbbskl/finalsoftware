from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import uuid

from db import get_db
from models import BotConfig
from schemas import BotConfigCreate, BotConfigRead

router = APIRouter(prefix="/v1/configs", tags=["configs"])

# Hardcoded dev org for now
DEV_ORG_ID = "dev-org"

@router.post("/", response_model=BotConfigRead)
def create_config(config: BotConfigCreate, db: Session = Depends(get_db)):
    db_config = BotConfig(
        id=str(uuid.uuid4()),
        org_id=DEV_ORG_ID,
        bot_id=config.bot_id,
        name=config.name,
        config_json=config.config_json,
        is_default=config.is_default
    )
    db.add(db_config)
    db.commit()
    db.refresh(db_config)
    return db_config

@router.get("/", response_model=List[BotConfigRead])
def list_configs(db: Session = Depends(get_db)):
    configs = db.query(BotConfig).filter(BotConfig.org_id == DEV_ORG_ID).all()
    return configs
