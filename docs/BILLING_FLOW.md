# Billing Flow Documentation

This document describes the payment → webhook → subscription → entitlements → bot provision flow.

## Overview

When a user purchases automations, the following flow occurs:

1. **Request** → User submits purchase request
2. **Invoice** → Server creates invoice with calculated pricing
3. **Webhook** → Payment provider sends confirmation webhook
4. **Subscription Active** → System activates subscription
5. **Entitlements** → Creates entitlement records for purchased bots
6. **Provision Instances** → Creates bot instance directories and default configs

## Pricing Rules

### Creator Plan
- **Rate**: €40 per automation
- **Example**: 3 automations = €120
- **Owner**: User (individual)

### Agency Plan
- **Base Rate**: €65 per platform per model
- **Tier Discounts**:
  - 50+ models: €60 per platform
  - 100+ models: €50 per platform
- **Custom Support**: Enabled if models ≥ 30
- **Example**: 2 platforms × 52 models = 2 × 52 × €60 = €6,240
- **Owner**: Organization

## Platform → Bot Mapping

Each platform maps to specific bot codes:

```
f2f → ['f2f_post', 'f2f_dm']
onlyfans → ['of_post', 'of_dm']
fanvue → ['fanvue_post', 'fanvue_dm']
```

## API Endpoints

### Invoice Creation
```
POST /api/billing/invoice

Creator Request:
{
  "kind": "creator",
  "bots": ["f2f_post", "f2f_dm", "of_post"]
}

Agency Request:
{
  "kind": "agency", 
  "platforms": ["f2f", "onlyfans"],
  "models": 52
}

Response:
{
  "invoice_id": "uuid",
  "invoice_url": "payment_url"
}
```

### Invoice Status
```
GET /api/billing/invoices/{invoice_id}

Response:
{
  "id": "uuid",
  "provider": "stripe|crypto",
  "status": "pending|paid|failed",
  "amount_eur": 6240,
  "url": "payment_url",
  "owner_type": "user|org",
  "owner_id": "uuid",
  "created_at": "timestamp",
  "paid_at": "timestamp"
}
```

### Webhooks
```
POST /api/billing/webhook/stripe
POST /api/billing/webhook/crypto

Body:
{
  "invoice_id": "uuid",
  "event": "paid|payment_succeeded"
}
```

## Database Schema

### Invoices
- `id`: Primary key
- `provider`: 'stripe' or 'crypto'
- `status`: 'pending', 'paid', 'failed'
- `amount_eur`: Amount in euros
- `owner_type`: 'user' or 'org'
- `owner_id`: Owner identifier
- `ext_id`: External provider ID

### Entitlements
- `owner_type`: 'user' or 'org'
- `owner_id`: Owner identifier
- `bot_code`: Bot identifier (e.g., 'f2f_post')
- `units`: Number of units (1 for creator, models for agency)
- `status`: 'active', 'inactive', 'expired'

### Bot Instances
- `owner_type`: 'user' or 'org'
- `owner_id`: Owner identifier
- `bot_code`: Bot identifier
- `status`: 'inactive', 'active', 'error'
- `config_path`: Path to config.yaml

## Provisioning

When entitlements are created, the system:

1. **Creates Directory Structure**:
   ```
   /data/tenants/{owner_type}-{owner_id}/bots/{instance_id}/
   ├── secrets/
   ├── inputs/
   ├── logs/
   └── state/
   ```

2. **Writes Default Config**:
   ```yaml
   bot_code: f2f_post
   headless: true
   timezone: Europe/Amsterdam
   cookies_path: ./secrets/storageState.json
   inputs:
     captions_csv: ./inputs/captions.csv
     media_dir: ./inputs/media
   phases: []
   params: {}
   ```

3. **Database Record**: Creates bot_instance record with status='inactive'

## Idempotent Behavior

- Webhook handlers are idempotent
- Calling webhook twice doesn't duplicate instances/rows
- Deduplication by external ID (ext_id)
- Invoice status prevents double-processing

## Environment Variables

- `USE_STRIPE`: Enable Stripe integration (default: false)
- `USE_CRYPTO`: Enable crypto integration (default: false)
- `BILLING_PROVIDER`: Default provider (default: 'stripe')
- `DEV_USER_ID`: Development user ID for testing

## Testing

### Manual Testing

1. **Create Invoice**:
   ```bash
   curl -X POST http://localhost:8000/api/billing/invoice \
     -H "Content-Type: application/json" \
     -d '{"kind":"creator","bots":["f2f_post","f2f_dm","of_post"]}'
   ```

2. **Simulate Payment**:
   ```bash
   curl -X POST http://localhost:8000/api/billing/webhook/stripe \
     -H "Content-Type: application/json" \
     -d '{"invoice_id":"your-invoice-id","event":"paid"}'
   ```

3. **Verify Results**:
   - Check invoice status: `GET /api/billing/invoices/{invoice_id}`
   - Check bot instances created
   - Check directories created under `/data/tenants/`