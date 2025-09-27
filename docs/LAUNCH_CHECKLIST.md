# Launch Checklist

This checklist ensures the application is production-ready before going live.

## Pre-Launch Setup

### Environment Configuration
- [ ] `.env` file complete with all required variables (see `docs/ENV_VARS.md`)
- [ ] `DATABASE_URL` points to production database
- [ ] `REDIS_URL` points to production Redis instance
- [ ] `COOKIE_KEY` is 32 bytes and secure
- [ ] `AUTH_SECRET` is set and secure
- [ ] `NODE_ENV=production` set
- [ ] All API keys configured (Stripe, SMTP, etc.)

### Database Setup
- [ ] Run `./scripts/migrate.sh` successfully
- [ ] Database migrations applied without errors
- [ ] `/readyz` endpoint returns 200 (migrations applied)
- [ ] Run `npm run seed` or `python scripts/seed.py` for test users
- [ ] Database indexes created for performance

### Infrastructure
- [ ] `docker-compose up -d --build` runs without errors
- [ ] All services healthy (API, Worker, Database, Redis)
- [ ] Persistent volumes mounted correctly
- [ ] Log rotation configured
- [ ] Backups scheduled and tested

## Authentication & Authorization

### Signup/Login Flow
- [ ] Navigate to `https://yourdomain.com/signup`
- [ ] Create account with email/password
- [ ] **Expected**: Redirected to appropriate dashboard based on role
- [ ] Login with existing credentials
- [ ] **Expected**: Session maintained, role-based redirects work

### Role-based Access Control
- [ ] Creator users can only access `/creator/*` routes
- [ ] Agency users can only access `/agency/*` routes  
- [ ] Admin users can only access `/admin/*` routes
- [ ] Unauthenticated users redirected to `/login`
- [ ] Cross-role access attempts blocked with redirects

### Session Security
- [ ] Session cookies are `HttpOnly`, `Secure`, `SameSite=Lax`
- [ ] CSRF protection enabled for state-changing routes
- [ ] CORS configured for allowed origins only
- [ ] Rate limiting active on auth-sensitive routes

## Billing & Payments

### Invoice Creation
1. [ ] Login as Creator
2. [ ] Navigate to Subscriptions
3. [ ] Select automations and create invoice
4. [ ] **Expected**: Invoice URL opens, shows pending state
5. [ ] Click "Mark as Paid (dev)" for testing
6. [ ] **Expected**: Webhook processes payment
7. [ ] **Expected**: Bot instances provisioned and appear inactive

### Payment Providers
- [ ] Stripe webhook configured and tested
- [ ] Crypto payments (Coinbase Commerce) configured
- [ ] Webhook signature verification working
- [ ] Payment failures handled gracefully
- [ ] Invoice download links working

### Entitlements
- [ ] Creator bots (6) provisioned after payment
- [ ] Agency bots (12) provisioned after payment
- [ ] Bot instances start as "inactive" status
- [ ] Subscription status tracked correctly

## Bot Management

### Cookie Upload & Validation
1. [ ] Navigate to Bot Detail page
2. [ ] Upload valid `storageState.json` file
3. [ ] **Expected**: File encrypted and stored securely
4. [ ] Click "Validate"
5. [ ] **Expected**: Validation runs via Celery worker
6. [ ] **Expected**: Status shows "ok" with timestamp
7. [ ] **Expected**: "Activate" button becomes enabled

### Bot Operations
1. [ ] Click "Activate" on validated bot
2. [ ] **Expected**: Bot status changes to "ready"
3. [ ] Click "Start" to run bot
4. [ ] **Expected**: Run created and queued
5. [ ] **Expected**: Bot status changes to "running"
6. [ ] Navigate to Logs tab
7. [ ] **Expected**: SSE stream shows real-time logs
8. [ ] Click "Stop"
9. [ ] **Expected**: Run marked as stopped

### Error Handling
- [ ] Invalid cookie file upload shows error
- [ ] Validation failures show user-friendly message
- [ ] Bot run failures handled gracefully
- [ ] Logs stream errors don't break UI

## Scheduling System

### Schedule Creation
1. [ ] Navigate to Schedule page
2. [ ] Drag bot from right panel to calendar day
3. [ ] **Expected**: Schedule created successfully
4. [ ] Try to create schedule <1h from now
5. [ ] **Expected**: Error message about time rule
6. [ ] Create schedule >65 minutes in future
7. [ ] **Expected**: Schedule saved with correct time

### Schedule Management
1. [ ] Right-click day, select "Copy"
2. [ ] Right-click another day, select "Paste"
3. [ ] **Expected**: Schedule copied successfully
4. [ ] Try to delete schedule within 10 minutes
5. [ ] **Expected**: Error message about deletion rule
6. [ ] Delete schedule >10 minutes in future
7. [ ] **Expected**: Schedule deleted successfully

### Celery Beat Integration
- [ ] Celery Beat service running
- [ ] Scheduled tasks dispatch at correct times
- [ ] Bot runs created from due schedules
- [ ] Schedule `dispatched_at` marked correctly

## Monitoring & Admin

### Creator Monitoring
- [ ] Navigate to Monitoring page
- [ ] **Expected**: Recent runs table shows data
- [ ] **Expected**: Overview stats show correct counts
- [ ] Click on run for details
- [ ] **Expected**: Run details page loads

### Agency Features
- [ ] Agency pricing calculator shows correct math
- [ ] 2 platforms × 52 models @ €60 = €6,240
- [ ] "Custom support & setup" badge appears for ≥30 models
- [ ] Platform filtering works in schedule
- [ ] Both creator + agency bots visible

### Admin Dashboard
- [ ] Admin dashboard shows global metrics
- [ ] Subscriptions list with filters works
- [ ] Invoices list with download links works
- [ ] Bots inventory shows all instances
- [ ] Affiliates list with summary metrics
- [ ] No "Create bot" buttons anywhere

## Performance & Reliability

### Load Testing
- [ ] Multiple users can signup/login simultaneously
- [ ] Bot operations don't interfere with each other
- [ ] SSE logs stream without blocking
- [ ] Calendar loads quickly with many schedules
- [ ] Database queries optimized with indexes

### Error Recovery
- [ ] Network failures handled gracefully
- [ ] Database connection issues don't crash app
- [ ] Redis unavailability handled
- [ ] Worker failures don't break UI
- [ ] File upload errors show clear messages

### Security
- [ ] Input validation prevents malicious data
- [ ] SQL injection protection active
- [ ] XSS protection in place
- [ ] File upload restrictions enforced
- [ ] Rate limiting prevents abuse

## External Integrations

### SMTP Configuration
- [ ] Test email sent successfully
- [ ] User signup emails delivered
- [ ] Password reset emails work
- [ ] Invoice notification emails sent

### Payment Webhooks
- [ ] Stripe webhook signature verified
- [ ] Crypto webhook signature verified
- [ ] Webhook idempotency prevents duplicates
- [ ] Failed webhooks logged for debugging

### Domain & TLS
- [ ] Domain resolves correctly
- [ ] SSL certificate valid and auto-renewing
- [ ] HTTPS redirects working
- [ ] Security headers configured

## Data Integrity

### Database Consistency
- [ ] All foreign key constraints working
- [ ] User roles consistent across tables
- [ ] Bot instance ownership correct
- [ ] Schedule relationships valid
- [ ] Run status transitions valid

### File Storage
- [ ] Cookie files encrypted at rest
- [ ] Temporary files cleaned up
- [ ] Log files rotated properly
- [ ] Upload size limits enforced

### Backup & Recovery
- [ ] Database backups created successfully
- [ ] Backup restoration tested
- [ ] File system backups working
- [ ] Disaster recovery plan documented

## User Experience

### Navigation
- [ ] All links work correctly
- [ ] Breadcrumbs show current location
- [ ] Back/forward buttons work
- [ ] Page refreshes maintain state

### Responsive Design
- [ ] Mobile layout works
- [ ] Tablet layout works
- [ ] Desktop layout optimal
- [ ] Touch interactions work

### Accessibility
- [ ] Keyboard navigation works
- [ ] Screen reader compatible
- [ ] Color contrast adequate
- [ ] Focus indicators visible

## Final Verification

### End-to-End Test
1. [ ] Signup new user → Login → Create invoice → Pay → Upload cookies → Validate → Activate → Start → Monitor logs → Stop → Create schedule → Delete schedule
2. [ ] Test with Creator, Agency, and Admin roles
3. [ ] Verify all data persists correctly
4. [ ] Check all error scenarios

### Performance Metrics
- [ ] Page load times <2 seconds
- [ ] API response times <500ms
- [ ] Database query times <100ms
- [ ] Memory usage stable
- [ ] CPU usage reasonable

### Security Scan
- [ ] Run security scanner (OWASP ZAP, etc.)
- [ ] Check for common vulnerabilities
- [ ] Verify HTTPS everywhere
- [ ] Confirm secure headers

## Go-Live Steps

### Final Deployment
1. [ ] Deploy to production environment
2. [ ] Run migration script
3. [ ] Seed admin user
4. [ ] Update DNS to production
5. [ ] Enable monitoring alerts
6. [ ] Test all critical paths

### Post-Launch Monitoring
- [ ] Watch error logs for first hour
- [ ] Monitor performance metrics
- [ ] Check user signup flow
- [ ] Verify payment processing
- [ ] Test bot operations

### Rollback Plan
- [ ] Database rollback procedure documented
- [ ] Code rollback procedure documented
- [ ] Emergency contact list ready
- [ ] Incident response plan in place

## Success Criteria

### Technical
- ✅ All health checks passing
- ✅ Smoke tests passing
- ✅ No critical errors in logs
- ✅ Performance metrics acceptable
- ✅ Security scan clean

### Business
- ✅ Users can signup and login
- ✅ Payments process correctly
- ✅ Bots can be activated and run
- ✅ Scheduling works as expected
- ✅ Admin oversight functional

### User Experience
- ✅ Intuitive navigation
- ✅ Clear error messages
- ✅ Responsive design
- ✅ Fast loading times
- ✅ Reliable functionality

---

## Emergency Contacts

- **Technical Lead**: [Contact Info]
- **DevOps**: [Contact Info]
- **Database Admin**: [Contact Info]
- **Payment Provider**: [Contact Info]
- **Domain Provider**: [Contact Info]

## Quick Commands

```bash
# Check application status
curl https://yourdomain.com/healthz
curl https://yourdomain.com/readyz

# Run smoke tests
./scripts/smoke.sh

# Check logs
docker-compose logs -f api
docker-compose logs -f worker

# Database backup
./scripts/migrate.sh && pg_dump $DATABASE_URL > backup.sql

# Emergency restart
docker-compose down && docker-compose up -d --build
```

**🎉 If all items are checked, the application is ready for production!**