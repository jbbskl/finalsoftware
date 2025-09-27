"""
Server-side pricing logic for creator and agency plans.

Pricing Rules:
- Creator: €40 per automation
- Agency base: €65 per platform per model (posting+massdm = 1 platform)
- Agency tiers: 50+ models → €60, 100+ models → €50 per platform
- Custom support: enabled if models ≥ 30
"""

from typing import Dict, Any


def price_for_creator(automations: int) -> Dict[str, Any]:
    """
    Calculate pricing for creator plan.
    
    Args:
        automations: Number of automations to purchase
        
    Returns:
        Dict with amountEUR and other pricing details
    """
    amount_eur = automations * 40
    
    return {
        "amountEUR": amount_eur,
        "automations": automations,
        "ratePerAutomation": 40,
        "plan": "creator"
    }


def price_for_agency(platforms: int, models: int) -> Dict[str, Any]:
    """
    Calculate pricing for agency plan.
    
    Args:
        platforms: Number of platforms (f2f, onlyfans, fanvue)
        models: Number of models per platform
        
    Returns:
        Dict with amountEUR and other pricing details
    """
    # Determine rate per platform based on model count
    if models >= 100:
        rate_per_platform = 50
    elif models >= 50:
        rate_per_platform = 60
    else:
        rate_per_platform = 65
    
    amount_eur = platforms * models * rate_per_platform
    
    return {
        "amountEUR": amount_eur,
        "platforms": platforms,
        "models": models,
        "ratePerPlatform": rate_per_platform,
        "customSupport": models >= 30,
        "plan": "agency"
    }


# Example pricing table for testing
"""
Example Pricing Calculations:

Creator:
- 1 automation: €40
- 3 automations: €120
- 10 automations: €400

Agency:
- 1 platform, 10 models: 1 * 10 * €65 = €650
- 2 platforms, 25 models: 2 * 25 * €65 = €3,250
- 2 platforms, 52 models: 2 * 52 * €60 = €6,240 (tier discount)
- 3 platforms, 100 models: 3 * 100 * €50 = €15,000 (max discount)
- 1 platform, 30 models: 1 * 30 * €65 = €1,950 (custom support enabled)
"""