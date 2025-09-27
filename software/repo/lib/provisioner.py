"""
Bot instance provisioner for creating directories and default configs.
"""

import os
import yaml
import uuid
import sys
from typing import List, Dict, Any
from sqlalchemy.orm import Session

# Add the API directory to the path to import models
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'services', 'api'))
from models import BotInstance, Entitlement
from owners import get_tenant_base_path


def provision_instances_for_entitlements(
    db: Session, 
    owner_type: str, 
    owner_id: str, 
    entitlements: List[Entitlement]
) -> List[BotInstance]:
    """
    Provision bot instances for entitlements.
    
    Args:
        db: Database session
        owner_type: 'user' or 'org'
        owner_id: Owner identifier
        entitlements: List of entitlements to provision for
        
    Returns:
        List of created bot instances
    """
    created_instances = []
    
    for entitlement in entitlements:
        # Check if owner already has an instance for this bot_code
        existing_instance = db.query(BotInstance).filter(
            BotInstance.owner_type == owner_type,
            BotInstance.owner_id == owner_id,
            BotInstance.bot_code == entitlement.bot_code
        ).first()
        
        if existing_instance:
            continue  # Skip if instance already exists
        
        # Create new bot instance
        instance_id = str(uuid.uuid4())
        instance = BotInstance(
            id=instance_id,
            owner_type=owner_type,
            owner_id=owner_id,
            bot_code=entitlement.bot_code,
            status='inactive',
            config_path=f"/data/tenants/{owner_type}-{owner_id}/bots/{instance_id}/config.yaml"
        )
        
        # Create directory structure
        tenant_base = get_tenant_base_path(owner_type, owner_id)
        instance_dir = f"{tenant_base}/bots/{instance_id}"
        
        directories = [
            f"{instance_dir}/secrets",
            f"{instance_dir}/inputs", 
            f"{instance_dir}/logs",
            f"{instance_dir}/state"
        ]
        
        for directory in directories:
            os.makedirs(directory, exist_ok=True)
        
        # Create default config.yaml
        config_path = f"{instance_dir}/config.yaml"
        default_config = create_default_config(entitlement.bot_code)
        
        with open(config_path, 'w') as f:
            yaml.dump(default_config, f, default_flow_style=False)
        
        # Save to database
        db.add(instance)
        db.commit()
        db.refresh(instance)
        
        created_instances.append(instance)
    
    return created_instances


def create_default_config(bot_code: str) -> Dict[str, Any]:
    """
    Create default configuration for a bot instance.
    
    Args:
        bot_code: Bot code (e.g., 'f2f_post', 'f2f_dm', 'of_post', etc.)
        
    Returns:
        Default configuration dictionary
    """
    return {
        "bot_code": bot_code,
        "headless": True,
        "timezone": "Europe/Amsterdam",
        "cookies_path": "./secrets/storageState.json",
        "inputs": {
            "captions_csv": "./inputs/captions.csv",
            "media_dir": "./inputs/media"
        },
        "phases": [],
        "params": {}
    }


def get_platform_to_bots_mapping() -> Dict[str, List[str]]:
    """
    Get mapping from platform codes to bot codes.
    
    Returns:
        Dict mapping platform to list of bot codes
    """
    return {
        "f2f": ["f2f_post", "f2f_dm"],
        "onlyfans": ["of_post", "of_dm"], 
        "fanvue": ["fanvue_post", "fanvue_dm"]
    }


def create_entitlements_for_creator(db: Session, owner_type: str, owner_id: str, bots: List[str]) -> List[Entitlement]:
    """
    Create entitlements for creator plan.
    
    Args:
        db: Database session
        owner_type: 'user' or 'org'
        owner_id: Owner identifier
        bots: List of bot codes to create entitlements for
        
    Returns:
        List of created entitlements
    """
    entitlements = []
    
    for bot_code in bots:
        entitlement = Entitlement(
            id=str(uuid.uuid4()),
            owner_type=owner_type,
            owner_id=owner_id,
            bot_code=bot_code,
            units=1,  # Creator gets 1 unit per bot
            status='active'
        )
        
        db.add(entitlement)
        entitlements.append(entitlement)
    
    db.commit()
    return entitlements


def create_entitlements_for_agency(db: Session, owner_type: str, owner_id: str, platforms: List[str], models: int) -> List[Entitlement]:
    """
    Create entitlements for agency plan.
    
    Args:
        db: Database session
        owner_type: 'user' or 'org'
        owner_id: Owner identifier
        platforms: List of platform codes
        models: Number of models per platform
        
    Returns:
        List of created entitlements
    """
    entitlements = []
    platform_to_bots = get_platform_to_bots_mapping()
    
    for platform in platforms:
        bot_codes = platform_to_bots.get(platform, [])
        
        for bot_code in bot_codes:
            entitlement = Entitlement(
                id=str(uuid.uuid4()),
                owner_type=owner_type,
                owner_id=owner_id,
                bot_code=bot_code,
                units=models,  # Agency gets models units per bot
                status='active'
            )
            
            db.add(entitlement)
            entitlements.append(entitlement)
    
    db.commit()
    return entitlements