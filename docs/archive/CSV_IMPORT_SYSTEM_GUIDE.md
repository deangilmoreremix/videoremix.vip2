# CSV Import and Product-to-App Access Management System

## Overview

This system allows you to import CSV files containing user purchase data, manually map products to apps with tiered access levels, and automatically grant users access based on their purchases.

## Features Implemented

### 1. Database Schema
- **csv_imports**: Tracks all CSV file uploads with detailed statistics
- **import_products**: Stores unique products discovered from CSV imports
- **access_tiers**: Defines access levels (Basic, Standard, Premium, Ultimate)
- **product_app_mappings**: Manual mapping between products and apps with tiers
- **import_user_records**: Individual user records from CSV imports

### 2. Admin Components
- **CSV Import** (`AdminCSVImport`): Upload and preview CSV files before importing
- **Product Mapping** (`AdminProductMapping`): Manually map products to apps with access tiers
- **Import History** (`AdminImportHistory`): View all past imports with detailed statistics

### 3. Edge Functions
- **process-csv-import**: Processes CSV files, creates users, and tracks products
- **resolve-user-access**: Determines which apps a user can access based on their products

### 4. Frontend Integration
- **useUserAccess** hook: React hook for checking user access in components
- **AppAccessBadge** component: Displays access status with tier badges

## How to Use

### Step 1: Deploy Edge Functions

Deploy the new Edge Functions to Supabase:

```bash
# Deploy process-csv-import function
supabase functions deploy process-csv-import

# Deploy resolve-user-access function
supabase functions deploy resolve-user-access
```

### Step 2: Upload CSV File

1. Navigate to **Admin Dashboard** → **CSV Import** tab
2. Drag and drop your CSV file or click "Browse Files"
3. Review the preview showing:
   - Total rows
   - Unique products found
   - Unique campaigns
   - Sample data
4. Enter an import name (e.g., "PayKickstart October 2025")
5. Click "Import CSV"

**CSV Format Requirements:**
```csv
Customer Name,Customer Email,Campaign,Product
John Doe,john@example.com,SmartVideo Launch,SmartVideo Ultimate
Jane Smith,jane@example.com,VideoRemix Promo,VideoRemix Link-ED (YEARLY)
```

### Step 3: Map Products to Apps

1. Navigate to **Product Mapping** tab
2. You'll see a list of all products discovered from CSV imports
3. For each product:
   - Click "Add Mapping"
   - Select the app this product grants access to
   - Choose the access tier (Basic, Standard, Premium, Ultimate)
   - Click "Create Mapping"
4. Products can map to multiple apps
5. Multiple products can map to the same app with different tiers

**Example Mappings:**
- Product: "SmartVideo Ultimate" → App: "AI Video Creator" → Tier: Ultimate
- Product: "VideoRemix Link-ED (YEARLY)" → App: "Video Editor" → Tier: Premium

### Step 4: View Import History

1. Navigate to **Import History** tab
2. View all past imports with:
   - Import status (completed, failed, processing)
   - Row counts and success rates
   - New products and users created
   - Processing duration
3. Click "Details" on any import to see:
   - Complete statistics
   - Error logs (if any)
   - Import summary

### Step 5: Verify User Access

Users will automatically have access to apps based on their purchased products:

1. When a user logs in, the system:
   - Looks up their purchases from import_user_records
   - Finds all product-app mappings for their products
   - Grants access to mapped apps with the highest tier
   - Caches the access data for performance

2. In your frontend components, use the `useUserAccess` hook:

```tsx
import { useUserAccess } from '../hooks/useUserAccess';

function MyComponent() {
  const { hasAccessToApp, getAppAccessTier, isLoading } = useUserAccess();

  if (isLoading) return <div>Loading...</div>;

  if (!hasAccessToApp('video-creator')) {
    return <div>You don't have access to this app</div>;
  }

  const tier = getAppAccessTier('video-creator');
  return (
    <div>
      You have {tier?.tierDisplayName} access to this app
    </div>
  );
}
```

## Access Tier Hierarchy

The system includes 4 default tiers:

1. **Basic** (Level 1) - Essential features for getting started
2. **Standard** (Level 2) - Enhanced features for regular users
3. **Premium** (Level 3) - Advanced features with priority support
4. **Ultimate** (Level 4) - Full access to all features and benefits

When a user has multiple products granting access to the same app, they receive the **highest tier** level.

## Data Flow

```
CSV Upload
    ↓
Process & Extract Products
    ↓
Create/Update Users
    ↓
Store Import Records
    ↓
Manual Product-App Mapping
    ↓
User Access Resolution
    ↓
App Access Granted
```

## Managing Access Tiers

To add or modify access tiers:

1. Access the `access_tiers` table in Supabase
2. Insert/update records with:
   - `tier_name`: Unique identifier (e.g., 'enterprise')
   - `tier_level`: Integer level (higher = more access)
   - `display_name`: Human-readable name
   - `description`: What this tier includes
   - `badge_color`: Hex color for UI badges
   - `icon_name`: Icon identifier

## Security

- All tables have Row Level Security (RLS) enabled
- Only admins can manage imports and mappings
- Users can only view their own access data
- Edge Functions verify admin permissions before processing

## Troubleshooting

### Import Fails
- Check CSV format matches requirements
- Ensure all required columns are present
- Review error logs in Import History

### User Can't Access App
- Verify product is mapped to the app
- Check mapping is marked as active
- Ensure user's email matches CSV record
- Refresh user's access data

### Products Not Appearing
- Check if products were successfully extracted
- Verify import status is "completed"
- Look for similar product names that might need merging

## Next Steps

1. **Deploy Edge Functions** - Make sure both functions are deployed
2. **Import Your CSV** - Start with a small test file first
3. **Map Products** - Go through unmapped products and create mappings
4. **Test Access** - Log in as a test user and verify app access
5. **Integrate in UI** - Use the `useUserAccess` hook in your app components

## Support

For issues or questions:
1. Check Import History for detailed error logs
2. Review product mapping status
3. Verify Edge Functions are deployed and accessible
4. Check Supabase logs for function execution errors
