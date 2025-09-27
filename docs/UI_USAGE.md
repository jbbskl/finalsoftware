# UI Usage Guide

This document describes how to use the Creator, Agency, and Admin user interfaces.

## Creator UI

### Dashboard
- **Active Runs**: Shows currently running bot instances
- **Scheduled This Week**: Displays upcoming scheduled runs
- **Bots Enabled**: Shows active bot instances (hides failed ones)
- **Quick Actions**:
  - "Create Bot" → navigates to `/creator/bots`
  - "Upload Cookies" → opens first inactive bot detail page
  - "Schedule a run" → navigates to `/creator/schedule`

### Subscriptions (Automations)
- **Terminology**: "Scripts" renamed to "Automations"
- **Creator Bots**: Shows 6 creator bot codes (F2F Post/DM, OF Post/DM, Fanvue Post/DM)
- **Pricing**: €40 per automation (not multiplied by models)
- **Flow**:
  1. User selects automations → clicks "Save & Continue"
  2. Modal opens with Invoice (default) and Crypto tabs
  3. On confirm: calls `createInvoice`, shows `invoice_url` in new tab + pending state
  4. After payment (dev: "Mark as Paid (dev)" button calls webhook), polls `getInvoice` until paid
  5. On paid: toast "Access granted", redirects to Bots (bot instances appear inactive)
- **Billing History**: Lists invoices with Download links (opens `invoice.url`)

### Bots
- **List View**: Shows 6 creator bot codes, inactive first
- **Activate Button**: Disabled until `validation_status === 'ok'`
- **Status Chips**: `inactive` | `ready` | `running` | `error`
- **Navigation**: Clicking item → detail page

### Bot Detail
- **Tabs**: Setup, Run, Logs
- **Setup Tab**:
  - Upload Cookies → `uploadCookies` (accepts JSON/file)
  - Validate → `validateBot` (shows result & timestamp)
  - Readonly paths (shows where files live)
- **Run Tab**:
  - Start → `startRun` (disabled if already running)
  - Stop → `stopRun`
  - Latest runs table (status, started/finished, summary)
- **Logs Tab**:
  - SSE viewer: `streamLogsSSE(botId)`
  - Appends lines, auto-scrolls
  - Shows "completed" status when run finishes

### Schedule
- **Month Calendar**: Main view with right panel for bots/phases
- **Drag & Drop**: Drag item from panel to calendar day → creates schedule
- **Click Day**: Add full-run or select a phase
- **Copy Day**: Right-click menu: copy/paste day → `copyDay`
- **Rules Enforced**:
  - Cannot create if <1h from now
  - Cannot delete if within 10m
- **Timezone Hint**: Shows "Europe/Amsterdam"

### Monitoring
- **Runs Table**: Recent N runs with status and links to detail/logs
- **Overview Stats**: Via `/monitoring/overview` endpoint

### Settings
- **Profile Basics**: Name, email
- **Notification Toggle**: Stub value
- **Company Fields**: Company name, VAT ID (saved to profile; used in invoice metadata)

### Affiliate
- **Referral Link**: Shows user's affiliate code
- **Metrics**: Clicks count, signups count, paid total from `/api/affiliate`

## Agency UI

### Dashboard
- Similar to creator but may include both bot sets (creator + agency)

### Subscriptions
- **Bot Sets**: Shows creator bots + agency bots (12 total)
- **Pricing Calculator**:
  - Creator: €40 per automation (not multiplied by models)
  - Agency: €65 per platform per model
  - Tiers: 50+ models → €60; 100+ models → €50
- **Custom Support**: If models ≥ 30 → shows "Custom support & setup" badge
- **Payment Flow**: Same invoice/crypto UX as creator
- **On Paid**: Bot instances provisioned (agency + creator sets as chosen)

### Bots
- Shows both creator + agency bot codes
- Inactive first, Activate gated by Validate OK

### Schedule
- Same calendar as creator
- Platform filter/search on right panel

### Monitoring
- Runs table + overview (agency scope)

### Settings
- Profile basics + company fields

### Affiliate
- Referral link + metrics

## Admin UI

### Dashboard
- **Global Overview Metrics**: Active subscriptions, active bots, daily runs

### Subscriptions
- List with filters
- Links to invoices

### Invoices
- List with status, provider
- Links to open `invoice.url`

### Bots
- Global inventory table (owner, bot_code, status, created_at)

### Affiliates
- List affiliates with summary metrics

### Analytics
- Admin-only KPIs (active subs, active bots, daily runs)

## Important Notes

### Activation Gating
- **Activate button is disabled until validation passes**
- Must upload cookies and run validation first
- Only shows "Activate" when `validation_status === 'ok'`

### Error Handling
- All actions show toasts for success/error
- Buttons disabled while awaiting API responses
- Inline validation errors (e.g., invalid file upload)
- Empty states for lists (no runs, no bots, no invoices)
- Loading skeletons during data fetching

### UX Polish
- Consistent layout across all pages (no background gaps)
- Responsive design with proper spacing
- Clear visual feedback for all user actions
- Proper loading states and error messages