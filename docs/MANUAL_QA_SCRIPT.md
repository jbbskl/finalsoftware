# Manual QA Script

This document provides step-by-step instructions for manually testing the application end-to-end.

## Prerequisites

1. Start the application:
   ```bash
   cd software/repo
   docker-compose up -d --build
   ./scripts/migrate.sh
   python scripts/seed.py
   ```

2. Start the frontend:
   ```bash
   cd software/bots-control-plane
   npm run dev
   ```

3. Access the application at `http://localhost:3000`

## Test Scenarios

### 1. Authentication Flow

#### Test User Signup
1. Navigate to `http://localhost:3000/signup`
2. Fill in the form:
   - Email: `testuser@example.com`
   - Role: Select "Creator"
3. Click "Create account"
4. **Expected**: Redirected to `/creator` dashboard

#### Test User Login
1. Navigate to `http://localhost:3000/login`
2. Use existing test credentials:
   - Admin: `admin@example.com` / `Admin123!`
   - Creator: `creator@example.com` / `Creator123!`
   - Agency: `agency@example.com` / `Agency123!`
3. **Expected**: Redirected to appropriate dashboard based on role

#### Test Role-based Routing
1. Login as Creator, try to access `/admin`
2. **Expected**: Redirected to `/creator`
3. Login as Admin, try to access `/creator`
4. **Expected**: Redirected to `/admin`

### 2. Creator Workflow

#### Subscriptions Flow
1. Login as Creator (`creator@example.com` / `Creator123!`)
2. Navigate to Subscriptions
3. Select 2 automations
4. Click "Save & Continue"
5. In the modal:
   - Select "Invoice" tab
   - Click "Confirm"
6. **Expected**: Invoice URL opens in new tab, shows pending state
7. Click "Mark as Paid (dev)" button
8. **Expected**: Toast shows "Access granted", redirects to Bots

#### Bot Management
1. Navigate to Bots
2. **Expected**: See 6 creator bot codes, inactive first
3. Click on first bot
4. In Bot Detail page:
   - **Setup Tab**: Upload a sample `storageState.json` file
   - Click "Validate"
   - **Expected**: Shows validation result and timestamp
   - **Run Tab**: Click "Start"
   - **Expected**: Bot starts running
   - **Logs Tab**: **Expected**: See real-time log stream
   - Click "Stop"
   - **Expected**: Bot stops running

#### Scheduling
1. Navigate to Schedule
2. **Expected**: See month calendar with right panel
3. Drag a bot from right panel to a calendar day
4. **Expected**: Schedule created successfully
5. Right-click on a day, select "Copy"
6. Right-click on another day, select "Paste"
7. **Expected**: Schedule copied successfully
8. Try to create schedule <1h from now
9. **Expected**: Error message about time rule
10. Try to delete schedule within 10m
11. **Expected**: Error message about deletion rule

#### Monitoring
1. Navigate to Monitoring
2. **Expected**: See recent runs table and overview stats
3. Click on a run
4. **Expected**: See run details

#### Settings
1. Navigate to Settings
2. Update profile information:
   - Name: "Test User"
   - Email: "testuser@example.com"
   - Company: "Test Company"
   - VAT ID: "VAT123456789"
3. Click "Save"
4. **Expected**: Success toast, data saved

#### Affiliate
1. Navigate to Affiliate
2. **Expected**: See referral link, clicks, signups, paid total

### 3. Agency Workflow

#### Agency Subscriptions
1. Login as Agency (`agency@example.com` / `Agency123!`)
2. Navigate to Subscriptions
3. **Expected**: See both creator + agency bots (12 total)
4. Select 2 platforms, 52 models
5. **Expected**: Pricing shows €6,240 (2 × 52 × €60)
6. **Expected**: "Custom support & setup" badge appears
7. Complete payment flow (same as Creator)

#### Agency Bots
1. Navigate to Bots
2. **Expected**: See both creator + agency bot codes
3. Test bot operations (same as Creator workflow)

#### Agency Schedule
1. Navigate to Schedule
2. **Expected**: Platform filter/search on right panel
3. Test scheduling operations

### 4. Admin Workflow

#### Admin Dashboard
1. Login as Admin (`admin@example.com` / `Admin123!`)
2. Navigate to Dashboard
3. **Expected**: See global overview metrics

#### Admin Subscriptions
1. Navigate to Subscriptions
2. **Expected**: See list with filters
3. Click on subscription
4. **Expected**: Links to invoices

#### Admin Invoices
1. Navigate to Invoices
2. **Expected**: See list with status, provider
3. Click "Download" on an invoice
4. **Expected**: Opens invoice URL

#### Admin Bots
1. Navigate to Bots
2. **Expected**: See global inventory table
3. **Expected**: No "Create bot" buttons

#### Admin Affiliates
1. Navigate to Affiliates
2. **Expected**: See list with summary metrics

### 5. Error Handling Tests

#### Network Errors
1. Disconnect internet
2. Try to create invoice
3. **Expected**: Error toast with retry option

#### Validation Errors
1. Try to upload invalid file type for cookies
2. **Expected**: Inline validation error

#### Permission Errors
1. Login as Creator
2. Try to access `/admin/bots`
3. **Expected**: Redirected to Creator dashboard

### 6. Performance Tests

#### Large Data Sets
1. Create many schedules
2. **Expected**: Calendar loads quickly
3. Navigate between months
4. **Expected**: Smooth transitions

#### Concurrent Users
1. Open multiple browser tabs
2. Login as different users
3. **Expected**: No interference between sessions

## Success Criteria

- ✅ All authentication flows work correctly
- ✅ Role-based routing prevents unauthorized access
- ✅ Creator workflow: subscriptions → bots → schedule → monitoring
- ✅ Agency workflow: tiered pricing, dual bot sets, platform filtering
- ✅ Admin workflow: global oversight, no creation buttons
- ✅ Error handling: graceful failures, user-friendly messages
- ✅ Performance: responsive UI, fast loading
- ✅ Data persistence: changes saved correctly
- ✅ Real-time features: SSE logs, live updates

## Common Issues & Solutions

### Issue: Login redirects to wrong dashboard
**Solution**: Check user role in database, clear browser cookies

### Issue: Bot validation fails
**Solution**: Ensure valid `storageState.json` format, check file permissions

### Issue: Schedule creation blocked
**Solution**: Check time rules (≥1h from now), verify timezone

### Issue: SSE logs not streaming
**Solution**: Check browser console for errors, verify API endpoint

### Issue: Payment webhook not working
**Solution**: Check webhook URL configuration, verify signature validation

## Reporting Issues

When reporting issues, include:
1. User role and email
2. Exact steps to reproduce
3. Expected vs actual behavior
4. Browser console errors
5. Network tab requests/responses
6. Screenshots if applicable