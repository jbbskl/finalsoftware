# End-to-End QA Checklist

This comprehensive QA checklist covers all functionality across the Bot Control Plane system, from user registration and billing through bot management, scheduling, and monitoring.

## Pre-Test Setup

### Environment Preparation
- [ ] Clean database with fresh migrations applied
- [ ] Redis instance running and accessible
- [ ] All services started and healthy (`docker-compose up -d`)
- [ ] Environment variables properly configured
- [ ] SSL certificates configured (for production testing)
- [ ] Test user accounts created (creator, agency, admin roles)

### Test Data Preparation
- [ ] Sample bot configuration files ready
- [ ] Test cookie files (JSON format) prepared
- [ ] Sample invoice data for testing
- [ ] Test payment webhook payloads ready
- [ ] Sample schedule configurations prepared

## 1. User Authentication & Authorization

### Registration & Login
- [ ] User can register with valid email and password
- [ ] Email validation works correctly
- [ ] Password strength requirements enforced
- [ ] Login with correct credentials succeeds
- [ ] Login with incorrect credentials fails gracefully
- [ ] Session persistence works across browser refresh
- [ ] Logout clears session and redirects properly

### Role-Based Access Control (RBAC)
- [ ] Creator role can access creator-specific features only
- [ ] Agency role can access agency features and creator features
- [ ] Admin role can access all features including admin panels
- [ ] Cross-tenant access is blocked (users cannot access other users' data)
- [ ] Unauthorized API requests return 403 Forbidden
- [ ] Role escalation attempts are logged and blocked

### Session Management
- [ ] Session cookies have proper security flags (HttpOnly, Secure, SameSite)
- [ ] Session timeout works correctly
- [ ] Multiple concurrent sessions work properly
- [ ] Session invalidation on logout works
- [ ] CSRF protection works on state-changing operations

## 2. Billing & Subscription Flow

### Creator Subscription Flow
- [ ] User can view subscription options (6 creator bots, €40 per automation)
- [ ] Model count UI is disabled (always 1 model for creators)
- [ ] User can select desired automations
- [ ] "Save & Continue" opens invoice/crypto modal
- [ ] Invoice tab is default selection
- [ ] Crypto tab is available as alternative
- [ ] Company fields are optional
- [ ] Invoice creation succeeds with correct amounts
- [ ] Invoice URL is returned and opens in new tab
- [ ] Pending state is displayed correctly

### Payment Processing
- [ ] Stripe webhook simulation works in dev mode
- [ ] Crypto webhook simulation works in dev mode
- [ ] "Mark as Paid (dev)" button triggers webhook
- [ ] Payment status polling works correctly
- [ ] "Access granted" toast appears on successful payment
- [ ] User is redirected to Bots page after payment
- [ ] Bot instances appear as inactive after payment
- [ ] Invoice status updates to "paid" in database

### Billing History
- [ ] Invoices list shows all user invoices
- [ ] Invoice status is displayed correctly
- [ ] Download button opens invoice URL
- [ ] Invoice amounts and dates are correct
- [ ] Payment provider information is shown

### Agency Subscription Flow
- [ ] Agency pricing calculator works correctly
- [ ] Creator bots (€40/automation) + Agency bots (€65/platform/model)
- [ ] Tier pricing works (50+ → €60, 100+ → €50)
- [ ] "Custom support & setup" badge appears for 30+ models
- [ ] Invoice creation includes both bot sets
- [ ] Bot instances provisioned for both creator and agency sets

## 3. Bot Instance Management

### Bot List View
- [ ] Creator sees 6 creator bot codes
- [ ] Agency sees both creator + agency bot codes
- [ ] Inactive bots appear first in list
- [ ] Status chips display correctly (inactive | ready | running | error)
- [ ] Activate button is disabled until validation_status === 'ok'
- [ ] Clicking bot item navigates to detail page
- [ ] Bot codes and descriptions are correct

### Bot Detail - Setup Tab
- [ ] Bot configuration paths are displayed (readonly)
- [ ] Cookie upload accepts JSON files
- [ ] Cookie upload accepts other file formats
- [ ] Upload progress indicator works
- [ ] Success message appears on upload
- [ ] Error handling for invalid files works
- [ ] Validate button triggers validation process
- [ ] Validation result and timestamp are displayed
- [ ] Validation status updates in database
- [ ] Error messages are user-friendly

### Bot Detail - Run Tab
- [ ] Start button is disabled when bot is running
- [ ] Start button is enabled when bot is ready
- [ ] Start run creates runs row in database
- [ ] Celery task is dispatched correctly
- [ ] Run status updates in real-time
- [ ] Stop button stops the current run
- [ ] Latest runs table shows recent runs
- [ ] Run status, start/finish times are correct
- [ ] Run summary information is displayed

### Bot Detail - Logs Tab
- [ ] SSE connection establishes successfully
- [ ] Log lines stream in real-time
- [ ] Auto-scroll works as new lines arrive
- [ ] Connection status is indicated
- [ ] Logs stop when run completes
- [ ] "Completed" status is shown when run finishes
- [ ] Error handling for connection issues works
- [ ] Log format is readable and properly formatted

## 4. Scheduling System

### Schedule Calendar View
- [ ] Month calendar displays correctly
- [ ] Right panel shows bots and phases
- [ ] Timezone hint shows "Europe/Amsterdam"
- [ ] Current month is highlighted
- [ ] Navigation between months works

### Schedule Creation
- [ ] Drag item from panel to calendar creates schedule
- [ ] Click day opens add schedule dialog
- [ ] Full-run option creates complete schedule
- [ ] Phase selection works correctly
- [ ] Time rules enforced (can't add < 1 hour from now)
- [ ] Server errors are surfaced nicely
- [ ] Schedule appears on calendar after creation
- [ ] Schedule details are saved correctly in database

### Schedule Management
- [ ] Right-click menu shows copy/paste options
- [ ] Copy day functionality works
- [ ] Paste day creates new schedules
- [ ] Delete option works with time rules (can't delete < 10 minutes)
- [ ] Schedule modifications update correctly
- [ ] Overlapping schedules are prevented
- [ ] Schedule conflicts are handled gracefully

### Celery Beat Integration
- [ ] Beat service runs and scans for due schedules
- [ ] Due schedules are dispatched correctly
- [ ] `dispatched_at` timestamp is set atomically
- [ ] No double-dispatch occurs
- [ ] Failed dispatches are handled gracefully
- [ ] Schedule status updates correctly

## 5. Monitoring & Analytics

### Creator Monitoring
- [ ] Runs table shows recent runs
- [ ] Run status and timestamps are correct
- [ ] Links to run details work
- [ ] Overview stats via `/monitoring/overview` work
- [ ] Stats are scoped to user's bots only
- [ ] Real-time updates work correctly

### Agency Monitoring
- [ ] Shows runs for both creator and agency bots
- [ ] Filter/search by platform works
- [ ] Overview stats include both bot sets
- [ ] Performance metrics are accurate

### Admin Monitoring
- [ ] Global overview shows all system metrics
- [ ] Admin-only KPIs are displayed
- [ ] Active subscriptions count is correct
- [ ] Active bots count is correct
- [ ] Daily runs statistics are accurate
- [ ] System health indicators work

### Run Details & History
- [ ] Individual run details page loads correctly
- [ ] Run logs are accessible and complete
- [ ] Run metadata is accurate
- [ ] Performance metrics are displayed
- [ ] Error details are shown for failed runs
- [ ] Run history pagination works

## 6. Admin Features

### Subscriptions Management
- [ ] Admin can view all subscriptions
- [ ] Filter by status works correctly
- [ ] Link to invoices works
- [ ] Subscription details are accurate
- [ ] User/org information is displayed

### Invoices Management
- [ ] Admin can view all invoices
- [ ] Filter by status and provider works
- [ ] Invoice amounts and dates are correct
- [ ] Open invoice URL functionality works
- [ ] Invoice download works correctly

### Bots Inventory
- [ ] Global bots inventory table loads
- [ ] Owner information is displayed correctly
- [ ] Bot codes and status are accurate
- [ ] Creation dates are shown
- [ ] No "Create bot" option visible (admin read-only)

### Affiliates Management
- [ ] Affiliates list shows summary metrics
- [ ] Clicks, signups, and paid totals are correct
- [ ] Affiliate codes are displayed
- [ ] Performance metrics are accurate

## 7. Security & Compliance

### Cookie Encryption
- [ ] Cookies are encrypted when uploaded
- [ ] Encrypted files are stored as `storageState.enc`
- [ ] Worker decrypts cookies to temp files
- [ ] Temp files are deleted after use
- [ ] Encryption/decryption errors are handled gracefully

### RBAC Enforcement
- [ ] All protected endpoints require authentication
- [ ] Role-based access is enforced consistently
- [ ] Resource ownership validation works
- [ ] Cross-tenant access is blocked
- [ ] Admin-only endpoints are protected

### Rate Limiting
- [ ] Auth endpoints limited to 10/min/IP
- [ ] Start/validate/stop endpoints limited to 30/min/IP
- [ ] Webhook endpoints limited to 120/min/provider IP
- [ ] 429 responses include retry-after header
- [ ] Rate limiting doesn't break normal usage

### CSRF Protection
- [ ] State-changing routes require CSRF tokens
- [ ] Webhook routes skip CSRF (use secret headers)
- [ ] CSRF tokens are properly validated
- [ ] Invalid CSRF tokens are rejected

### CORS Configuration
- [ ] CORS is limited to allowed origins
- [ ] No wildcard origins in production
- [ ] Preflight requests are handled correctly
- [ ] CORS headers are properly set

## 8. Error Handling & UX

### Error Messages
- [ ] All errors return JSON format `{error: 'message', code}`
- [ ] HTTP status codes are appropriate
- [ ] Error messages are user-friendly
- [ ] Technical details are not exposed to users
- [ ] Error logging captures technical details

### Loading States
- [ ] Loading indicators appear during API calls
- [ ] Buttons are disabled during operations
- [ ] Skeleton loading states work
- [ ] Loading timeouts are handled gracefully

### Toast Notifications
- [ ] Success toasts appear on successful operations
- [ ] Error toasts appear on failures
- [ ] Toast messages are clear and actionable
- [ ] Toasts auto-dismiss appropriately

### Empty States
- [ ] Empty states are shown when no data
- [ ] Empty states include helpful messaging
- [ ] Empty states include action buttons where appropriate

## 9. Performance & Reliability

### Database Performance
- [ ] Essential indexes are in place
- [ ] Queries are optimized and fast
- [ ] Pagination works correctly
- [ ] Large datasets don't cause timeouts

### API Performance
- [ ] Response times are acceptable (< 2 seconds)
- [ ] Concurrent requests are handled properly
- [ ] Rate limiting doesn't impact normal usage
- [ ] Large file uploads work correctly

### Worker Reliability
- [ ] Celery tasks retry on failure
- [ ] Task acknowledgments work correctly
- [ ] Failed tasks are logged and handled
- [ ] Worker graceful shutdown works
- [ ] No task loss during restarts

### System Health
- [ ] Health endpoints return correct status
- [ ] Readiness checks work properly
- [ ] Service dependencies are monitored
- [ ] Health metrics are accurate

## 10. Integration Testing

### End-to-End User Flows
- [ ] Complete creator signup → subscription → bot setup → run → monitoring flow
- [ ] Complete agency signup → subscription → bot setup → schedule → monitoring flow
- [ ] Admin user can access all admin features
- [ ] Cross-role functionality works correctly

### Payment Integration
- [ ] Invoice creation and payment processing
- [ ] Webhook handling and idempotency
- [ ] Bot provisioning after payment
- [ ] Billing history and invoice downloads

### Bot Execution
- [ ] Bot validation with real cookie files
- [ ] Bot execution and log streaming
- [ ] Schedule execution and monitoring
- [ ] Error handling during bot runs

### Data Persistence
- [ ] Data survives service restarts
- [ ] Database migrations work correctly
- [ ] Backup and restore procedures work
- [ ] Data consistency is maintained

## 11. Security Testing

### Authentication Security
- [ ] Brute force protection works
- [ ] Session hijacking protection works
- [ ] Password security requirements enforced
- [ ] Account lockout mechanisms work

### Authorization Security
- [ ] Privilege escalation attempts fail
- [ ] Cross-tenant data access is blocked
- [ ] Admin functions are properly protected
- [ ] Resource ownership validation works

### Data Security
- [ ] Sensitive data is encrypted
- [ ] Data transmission is secure
- [ ] File uploads are validated
- [ ] SQL injection attempts fail

### Network Security
- [ ] HTTPS is enforced in production
- [ ] Security headers are present
- [ ] CORS configuration is secure
- [ ] Rate limiting prevents abuse

## 12. Production Readiness

### Deployment
- [ ] Production compose profile works
- [ ] Environment variables are properly configured
- [ ] SSL certificates are configured
- [ ] Reverse proxy is working correctly

### Monitoring
- [ ] Health checks are responding
- [ ] Metrics are being collected
- [ ] Logs are being generated
- [ ] Alerts are configured

### Backup & Recovery
- [ ] Database backups are working
- [ ] File backups are working
- [ ] Recovery procedures are tested
- [ ] Disaster recovery plan is documented

### Documentation
- [ ] Deployment guide is complete
- [ ] API documentation is accurate
- [ ] User guides are available
- [ ] Troubleshooting guides exist

## Test Execution Notes

### Test Environment
- **Database**: PostgreSQL 15 with test data
- **Cache**: Redis 7 with test configuration
- **Storage**: MinIO with test buckets
- **Services**: All services running in Docker containers

### Test Data
- **Users**: Test accounts for each role (creator, agency, admin)
- **Bots**: Sample bot configurations and cookie files
- **Schedules**: Test schedule configurations
- **Invoices**: Sample invoice data for testing

### Success Criteria
- All critical user flows work end-to-end
- Security measures are properly enforced
- Performance meets acceptable thresholds
- Error handling is user-friendly
- System is production-ready

### Failure Handling
- Document all test failures with steps to reproduce
- Categorize failures by severity (critical, high, medium, low)
- Track resolution status and regression testing
- Update test cases based on findings

## Sign-off

### QA Team Approval
- [ ] All critical paths tested and working
- [ ] Security requirements met
- [ ] Performance requirements met
- [ ] Documentation is complete
- [ ] Production deployment tested

### Development Team Approval
- [ ] All bugs fixed and verified
- [ ] Code review completed
- [ ] Security review completed
- [ ] Performance optimization completed
- [ ] Documentation updated

### Product Team Approval
- [ ] User experience meets requirements
- [ ] Feature completeness verified
- [ ] Business logic is correct
- [ ] Integration requirements met
- [ ] Go-live criteria satisfied

---

**Test Date**: _______________  
**QA Engineer**: _______________  
**Version**: _______________  
**Environment**: _______________  

**Final Status**: [ ] PASS [ ] FAIL  
**Comments**: _______________