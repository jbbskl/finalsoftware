# Bots Control Plane Interface

A modern, responsive web interface for managing bot automation systems built with Next.js, TypeScript, and Tailwind CSS.

## 🎨 Brand Colors

The interface uses a custom color scheme based on **#1800ad**:

- **Primary**: #1800ad (Deep Purple)
- **Primary Light**: #2d14c8 (Lighter Purple)
- **Primary Dark**: #12008a (Darker Purple)
- **Secondary**: #4064ff (Bright Blue)
- **Accent**: #7896ff (Light Blue)
- **Muted**: #c8d2ff (Very Light Blue)

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or pnpm

### Installation
```bash
# Install dependencies
npm install
# or
pnpm install

# Copy environment file
cp env.example .env.local

# Start development server
npm run dev
```

The interface will be available at `http://localhost:3000`

## 🌟 Features

### ✅ Completed Pages
1. **Dashboard** (`/`) - KPI overview, charts, quick actions
2. **Subscriptions** (`/subscriptions`) - Plan configurator, billing
3. **Schedule** (`/schedule`) - Calendar view, schedule management
4. **Bots** (`/bots`) - Platform and bot management
5. **Monitoring** - Run monitoring (stubbed)
6. **Analytics** - Performance analytics (stubbed)
7. **Settings** - Configuration management (stubbed)

### 🎯 Key Components
- **PlanConfigurator** - Interactive subscription builder
- **MonthCalendar** - Full month calendar with scheduled runs
- **CronField** - Cron expression input with validation
- **StatusPill** - Status indicators with brand colors
- **DataTable** - Reusable table with search/pagination
- **RunDrawer** - Comprehensive run details view

## 🔧 Configuration

### Environment Variables
```bash
# Enable mock mode (default: true)
NEXT_PUBLIC_DEV_MOCK=true

# API base URL (when mocks disabled)
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Mock Data
The interface includes comprehensive mock data for:
- All platforms (F2F, OnlyFans, Fanvue, Fancentro, Fansly)
- Bot configurations and statuses
- Sample schedules and runs
- Subscription plans and pricing
- Billing history and payment methods

## 🎨 Customization

### Brand Colors
Update colors in `app/globals.css`:
```css
:root {
  --brand-primary: 24 0 173; /* #1800ad */
  --brand-secondary: 64 100 255; /* #4064ff */
  --brand-accent: 120 150 255; /* #7896ff */
  /* ... more colors */
}
```

### Component Styling
Use brand color utilities:
```tsx
className="bg-brand-primary text-white"
className="border-brand-accent text-brand-primary"
className="hover:bg-brand-muted/20"
```

## 🧪 Testing the Interface

### 1. Start Development Server
```bash
npm run dev
```

### 2. Navigate Through Pages
- **Dashboard**: View KPIs, charts, and recent activity
- **Bots**: See all platforms and bots with coming soon states
- **Subscriptions**: Configure plans with live pricing calculator
- **Schedule**: Manage schedules with calendar and list views

### 3. Test Interactive Features
- **Plan Configurator**: Adjust models/scripts to see pricing changes
- **Calendar Navigation**: Use prev/next month buttons
- **Schedule Creation**: Create new schedules with cron expressions
- **Bot Toggles**: Enable/disable bots (mock functionality)

### 4. Verify Brand Colors
- Purple (#1800ad) primary buttons and headers
- Blue (#4064ff) secondary elements
- Light blue (#7896ff) accents and highlights
- White backgrounds with proper contrast

## 🔌 Backend Integration

When ready to connect to real backend:

1. **Disable Mocks**: Set `NEXT_PUBLIC_DEV_MOCK=false`
2. **Update API URL**: Set `NEXT_PUBLIC_API_URL` to your backend
3. **API Endpoints**: The interface expects these endpoints:
   - `/subscription` - Subscription management
   - `/platforms` - Platform and bot catalog
   - `/schedules` - Schedule CRUD operations
   - `/runs` - Run monitoring and management
   - `/dashboard/*` - Dashboard data
   - `/organization` - Organization settings

## 📱 Responsive Design

The interface is fully responsive:
- **Mobile**: Stacked layouts, touch-friendly buttons
- **Tablet**: Side-by-side grids, optimized spacing
- **Desktop**: Full-width layouts, hover effects

## 🎨 Theme Support

- **Light Mode**: White backgrounds with brand colors
- **Dark Mode**: Dark backgrounds with lighter brand variants
- **Custom CSS Variables**: Easy theme customization

## 🚀 Next Steps

1. **Test Interface**: Verify all pages render correctly
2. **Check Brand Colors**: Ensure #1800ad scheme is applied
3. **Test Interactions**: Verify forms, buttons, and navigation
4. **Backend Planning**: Plan API integration strategy
5. **Bot Integration**: Wire up actual bot management

## 📁 Project Structure

```
bots-control-plane/
├── app/                    # Next.js app router
│   ├── (dashboard)/       # Dashboard layout pages
│   ├── globals.css        # Global styles and brand colors
│   └── layout.tsx         # Root layout
├── components/            # Reusable components
│   ├── ui/               # Base UI components
│   ├── dashboard/        # Dashboard-specific components
│   ├── schedule/         # Schedule management components
│   └── subscriptions/    # Subscription components
├── lib/                  # Utilities and API
│   ├── api.ts           # API client with mock fallback
│   ├── mocks.ts         # Comprehensive mock data
│   └── types.ts         # TypeScript type definitions
└── public/               # Static assets
```

## 🆘 Troubleshooting

### Common Issues
- **Colors not showing**: Check CSS variables in `globals.css`
- **Components not loading**: Verify all dependencies installed
- **Mock data missing**: Check `NEXT_PUBLIC_DEV_MOCK=true`
- **Build errors**: Clear `.next` folder and reinstall dependencies

### Development Tips
- Use browser dev tools to inspect brand color classes
- Check console for any JavaScript errors
- Verify all component imports are correct
- Test responsive behavior at different screen sizes

---

**Ready to test!** 🎯 The interface should now display with your #1800ad brand colors throughout all components and pages.
