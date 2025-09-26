🛠 Interface Adjustments (Final, with zoom note everywhere)
🎨 Creator Interface
Dashboard

Zoom level: page feels too zoomed in → adjust layout so background is not visible between page and left navigation.

Remove: “failed” bots display.

Extend “runs per hour” analytics container (longer view).

Quick actions: buttons currently don’t work → make them functional.

Recent activity: hide “creator bot” labels (creator interface only shows creator bots).

Subscriptions

Zoom level: page feels too zoomed in → adjust layout so background is not visible between page and left navigation.

For creators:

Number of models should always be 1 (can’t update).

Rename:

“Scripts per model” → Automations.

“Scripts enabled” → Automations enabled.

Show only creator bots:

F2F Posting Bot

F2F Mass DM Bot

OnlyFans Posting Bot

OnlyFans Mass DM Bot

Fanvue Posting Bot

Fanvue Mass DM Bot

Pricing logic: €40 per automation (check this is enforced).

Payment methods:

For now: invoices only.

Workflow:

Creator fills in details (company info optional).

Clicks Save & Continue → popup appears.

Popup: “If you click OK, an invoice will be sent to your email. Once paid, you’ll get instant access to your bots.”

Payment must trigger API callback → system validates → access granted automatically.

Add crypto payment option (same flow as invoices).

Billing history: allow invoice download.

Bots

Zoom level: page feels too zoomed in → adjust layout so background is not visible between page and left navigation.

Show available creator bots (list above).

Bots should show as inactive by default.

Activation button disabled until phases are fully set up.

Phases (⚠️ last step to implement)

Zoom level: page feels too zoomed in → adjust layout so background is not visible between page and left navigation.

Goal: Simple setup with checkboxes/options.

Configs auto-generated from client’s choices.

Result: Bots run perfectly based on these options.

This is the core product and must be handled carefully.

Schedule

Zoom level: page feels too zoomed in → adjust layout so background is not visible between page and left navigation.

Calendar view (month switching).

User can choose:

Run entire bot (all phases that day).

Run specific phases.

Features:

Right-click copy day → paste on another.

Rules:

Can only add 1h before a phase starts.

Deletion only possible up to 10 min before start.

Popup when selecting “full bot” → show phases for that day → user can remove specific phases.

Right-side panel:

List all set-up bots/phases.

Filter by platform.

Search bar.

Drag-and-drop phases to calendar.

Monitoring

Zoom level: page feels too zoomed in → adjust layout so background is not visible between page and left navigation.

Show creator bots.

Log success/failure of posts and DMs.

Analytics

Zoom level: page feels too zoomed in → adjust layout so background is not visible between page and left navigation.

❌ Remove from client interface.

Settings

Zoom level: page feels too zoomed in → adjust layout so background is not visible between page and left navigation.

TBD — suggestion needed.

Affiliate

Zoom level: page feels too zoomed in → adjust layout so background is not visible between page and left navigation.

Show affiliate link for the creator.

Track earnings from referrals.

🏢 Agency Interface
Dashboard

Zoom level: page feels too zoomed in → adjust layout so background is not visible between page and left navigation.

Remove: “failed” bots display.

Extend “runs per hour” analytics container.

Quick actions: buttons don’t work → fix.

Recent activity: can show both creator and agency bots.

Subscriptions

Zoom level: page feels too zoomed in → adjust layout so background is not visible between page and left navigation.

Logic:

Creator bots → always 1 model.

Agency bots → can choose multiple models.

Must calculate correctly (creator bots ≠ agency bots).

Rename:

“Scripts per model” → Automations.

“Scripts enabled” → Automations enabled.

Show all bots (creator + agency).

Pricing logic:

Creator bots → €40 per automation.

Agency bots → €65 per platform per model.

Discounts:

50+ models → €60 per platform.

100+ models → €50 per platform.

Payment methods:

Invoice (same flow as creator).

Crypto option (same flow).

Billing history: invoices downloadable.

Bots

Zoom level: page feels too zoomed in → adjust layout so background is not visible between page and left navigation.

Show all bots (creator + agency).

Show inactive by default.

Activation disabled until phases set up.

Phases (⚠️ last step to implement)

Zoom level: page feels too zoomed in → adjust layout so background is not visible between page and left navigation.

Same as creator phases.

Schedule

Zoom level: page feels too zoomed in → adjust layout so background is not visible between page and left navigation.

Same as creator schedule.

Monitoring

Zoom level: page feels too zoomed in → adjust layout so background is not visible between page and left navigation.

Show bots + logs (posting/DM success/failure).

Analytics

Zoom level: page feels too zoomed in → adjust layout so background is not visible between page and left navigation.

❌ Remove from client interface.

Settings

Zoom level: page feels too zoomed in → adjust layout so background is not visible between page and left navigation.

TBD — suggestion needed.

Affiliate

Zoom level: page feels too zoomed in → adjust layout so background is not visible between page and left navigation.

Affiliate link + earnings tracking.

👑 Admin Interface
Dashboard

Zoom level: page feels too zoomed in → adjust layout so background is not visible between page and left navigation.

Show overview of how bots are running for all clients.

No need to create bots manually.

Subscriptions

Zoom level: page feels too zoomed in → adjust layout so background is not visible between page and left navigation.

Show all client subscriptions (creator + agency).

Display payment history + status.

Bots

Zoom level: page feels too zoomed in → adjust layout so background is not visible between page and left navigation.

Show all bots in system (count + overview).

Phases

Zoom level: page feels too zoomed in → adjust layout so background is not visible between page and left navigation.

❌ Not needed.

Schedule

Zoom level: page feels too zoomed in → adjust layout so background is not visible between page and left navigation.

❌ Not needed.

Monitoring

Zoom level: page feels too zoomed in → adjust layout so background is not visible between page and left navigation.

❌ Not needed.

Analytics

Zoom level: page feels too zoomed in → adjust layout so background is not visible between page and left navigation.

Admin-only analytics page:

High-level overview of all clients.

Ability to adjust client accounts if needed.

Settings

Zoom level: page feels too zoomed in → adjust layout so background is not visible between page and left navigation.

TBD — suggestion needed.

Affiliate

Zoom level: page feels too zoomed in → adjust layout so background is not visible between page and left navigation.

Show affiliate analytics:

Track users with affiliate links.

Track commissions/earnings.