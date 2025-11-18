# Bulk Import Previous Buyers Guide

This guide explains how to import your previous buyers from CSV files and automatically grant them access to the apps they purchased.

## Overview

The bulk import system:
- Creates user accounts for buyers who don't have one yet
- Imports purchase history into the database
- Automatically grants app access based on what they purchased
- Handles both subscription and lifetime purchases
- Provides detailed reporting on import results

## CSV File Format

Your CSV file should include the following columns:

### Required Columns
- `CUSTOMER EMAIL` - Buyer's email address
- `PRODUCT NAME` - Name of the product purchased
- `PAYMENT STATUS` - Status of payment (Completed, Pending, Refunded)
- `PAYPAL TXN ID` or `ZAXAA TXN ID` - Transaction ID
- `DATE` - Purchase date
- `AMOUNT` - Purchase amount
- `CURRENCY` - Currency code (USD, EUR, etc.)

### Optional Columns
- `CUSTOMER NAME` - Buyer's full name
- `PAYMENT TYPE` - One Time, Subscription, or Installment
- `PAYMENT PROCESSOR` - paypal, stripe, or zaxxa
- `PAYPAL PREAPPROVAL KEY` - For subscriptions
- `RECURRING PERIOD` - Monthly or Yearly
- `BUYER COUNTRY` - Customer's country

### Sample CSV Format

```csv
NO,DATE,PRODUCT NAME,AMOUNT,PAYMENT TYPE,PAYMENT STATUS,CUSTOMER EMAIL,CUSTOMER NAME,CURRENCY,PAYMENT PROCESSOR,PAYPAL TXN ID
1,"Dec 28, 2024 12:58 PM ET","Personalizer AI Agency (Lifetime)",$499.00,"One Time","Completed","john@example.com","John Doe",USD,stripe,ch_abc123
2,"Dec 24, 2024 16:03 PM ET","Personalizer AI Writing Toolkit",$49.00,"One Time","Completed","jane@example.com","Jane Smith",USD,paypal,1234567890
```

## Product Name Mapping

The system automatically matches product names to grant the correct app access:

### Personalizer AI Agency Products

| Product Name in CSV | Apps Granted |
|-------------------|--------------|
| Personalizer AI Agency (Monthly) | Core personalizer tools (7 apps) |
| Personalizer AI Agency (Yearly) | All personalizer tools (10 apps) |
| Personalizer AI Agency (Lifetime) | All personalizer tools (12 apps) |

### Individual Product Tools

| Product Name in CSV | Apps Granted |
|-------------------|--------------|
| Personalizer AI Writing Toolkit | Writing toolkit + text editor |
| Personalizer Advanced Text-Video AI Editor | Text-video editor + text editor |
| Personalizer URL Video Generation Templates & Editor | URL video generation tool |
| Personalizer Interactive Shopping | Interactive shopping app |
| Personalizer AI Video and Image Transformer | Video/image transformer + AI tools |

## Method 1: Admin Dashboard Import (Recommended)

### Step-by-Step Instructions

1. **Login as Admin**
   - Go to `/admin` in your browser
   - Sign in with your admin credentials

2. **Navigate to Bulk Import**
   - Click on the "Purchases" tab
   - Scroll down to find the "Bulk Import" section

3. **Upload CSV File**
   - Click "Download Template" to get a sample CSV format
   - Drag and drop your CSV file or click to browse
   - The file must be under 10MB and in CSV format

4. **Preview Data**
   - Review the first 10 rows to ensure data is parsed correctly
   - Check that emails, product names, and amounts look correct

5. **Import**
   - Click "Import X Rows" button
   - Wait for the import to complete (may take a few minutes for large files)

6. **Review Results**
   - See summary statistics:
     - Total rows processed
     - Successful imports
     - Skipped duplicates
     - Failed imports
     - New users created
     - Existing users updated
     - App access granted
   - Download error report if any imports failed

## Method 2: Command Line Import

For advanced users or automated workflows:

### Prerequisites
- Node.js installed on your system
- Access to the project directory
- Valid `.env` file with Supabase credentials

### Usage

```bash
# Basic usage
node bulk-import-buyers.mjs path/to/your/file.csv

# Example with the included sample data
node bulk-import-buyers.mjs ./src/data/personalizer.csv
```

### Output

The script will display:
- Total rows found in CSV
- Number of successful imports
- Number of skipped rows (duplicates, refunds)
- Number of failed imports
- New user accounts created
- Existing users found
- Total app access records created

### Example Output

```
🚀 Starting bulk buyer import from CSV...

📖 Reading CSV file...
   Found 150 rows

☁️  Sending data to import function...

📊 Import Results:

   Total Rows:          150
   ✅ Successful:       142
   ⏭️  Skipped:          6
   ❌ Failed:           2
   👤 New Users:        95
   👥 Existing Users:   47
   🔐 App Access:       854

✨ Import complete!
```

## What Happens During Import

### 1. User Account Creation
- Checks if user exists by email
- Creates new account if needed
- Sets temporary random password
- Marks account as email-verified
- Stores customer name in metadata

### 2. Purchase Record Import
- Validates transaction ID uniqueness
- Matches product name to product catalog
- Records purchase amount and date
- Sets subscription status if applicable
- Stores original CSV data for audit

### 3. App Access Grant
- Looks up which apps the product grants
- Creates access records in database
- Sets access type (lifetime or subscription)
- Calculates expiration for subscriptions
- Links access to purchase record

### 4. Subscription Setup
- Creates subscription status record
- Sets current period dates
- Tracks subscription ID
- Monitors payment status

## Handling Common Scenarios

### Duplicate Purchases
- System checks transaction ID before importing
- Duplicate transactions are automatically skipped
- No duplicate app access records created

### Existing Users
- Email lookup finds existing accounts
- Purchase added to existing user
- App access granted or updated
- User receives additional apps

### Refunded Purchases
- Transactions marked as "Refunded" are skipped
- No app access granted for refunded purchases
- Purchase record created for history

### Missing Product Mappings
- Import continues but no app access granted
- Error reported in results
- Can be fixed and re-imported later

### Invalid Email Addresses
- Rows with missing emails are skipped
- Rows with invalid format emails will fail
- Check error report for details

## Troubleshooting

### Import Fails Completely
- Check Supabase connection in `.env` file
- Verify edge function is deployed
- Check browser console for errors

### Some Rows Fail
- Download error report
- Check product names match expected format
- Verify transaction IDs are present
- Ensure email addresses are valid

### Users Can't Login
- New users need to reset password
- Send password reset emails to imported users
- Check user accounts in Supabase dashboard

### App Access Not Working
- Verify product mapping exists
- Check user_app_access table in database
- Run grant-app-access.mjs script manually

## Post-Import Steps

### 1. Verify Import Success
```bash
# Check imported purchases
node check-users.mjs

# Verify app access grants
# Login to Supabase dashboard > SQL Editor
SELECT
  u.email,
  COUNT(DISTINCT uaa.app_slug) as apps_granted
FROM auth.users u
LEFT JOIN user_app_access uaa ON u.id = uaa.user_id
WHERE uaa.is_active = true
GROUP BY u.email
ORDER BY apps_granted DESC;
```

### 2. Notify Users
- Send welcome emails to new users
- Include password reset link
- Explain how to access their apps
- Provide support contact info

### 3. Monitor Access
- Check error logs for issues
- Review user login attempts
- Monitor support requests

## Best Practices

1. **Test First**
   - Import a small sample file first
   - Verify results before full import
   - Check app access works correctly

2. **Backup Data**
   - Export existing user data
   - Keep original CSV file
   - Document any manual changes

3. **Clean Your Data**
   - Remove test transactions
   - Verify email addresses
   - Standardize product names

4. **Schedule Off-Peak**
   - Import during low traffic times
   - Avoid peak usage hours
   - Allow time for processing

5. **Communicate**
   - Notify users of import
   - Explain password reset process
   - Provide clear instructions

## Security Notes

- Only admin users can perform imports
- Service role key required for CLI import
- User passwords are randomly generated
- Email verification automatically set
- All data encrypted in transit

## Support

If you encounter issues:
1. Check error messages in import results
2. Review this guide for troubleshooting tips
3. Check Supabase logs in dashboard
4. Verify CSV format matches template
5. Contact technical support with error details

## Technical Details

### Database Tables Updated
- `auth.users` - User accounts
- `purchases` - Purchase records
- `user_app_access` - App access grants
- `subscription_status` - Subscription tracking

### Edge Functions Used
- `import-personalizer-purchases` - Main import processor

### Scripts Available
- `bulk-import-buyers.mjs` - CLI import tool
- `import-purchases.mjs` - Legacy import script
- `grant-app-access.mjs` - Manual access grant script
- `check-users.mjs` - Verification tool
