# CSV Import System - Deployment Checklist

## Pre-Deployment

- [x] Database migration created and applied
- [x] Edge Functions created
- [x] Frontend components built
- [x] Build successful (no compilation errors)
- [ ] Review CSV file format with actual data

## Edge Functions Deployment

Deploy the two new Edge Functions to Supabase:

```bash
# Navigate to project directory
cd /path/to/project

# Deploy process-csv-import function
supabase functions deploy process-csv-import

# Deploy resolve-user-access function
supabase functions deploy resolve-user-access
```

**Verify deployment:**
- Check Supabase Dashboard → Edge Functions
- Both functions should appear as "Active"
- Test with a sample request

## Database Verification

Check that all tables were created successfully:

```sql
-- Run in Supabase SQL Editor
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
  'csv_imports',
  'import_products',
  'access_tiers',
  'product_app_mappings',
  'import_user_records'
);
```

Expected result: All 5 tables should be listed.

**Verify access tiers:**
```sql
SELECT * FROM access_tiers ORDER BY tier_level;
```

Expected: 4 tiers (basic, standard, premium, ultimate)

## Admin Dashboard Access

1. Log in as an admin user
2. Navigate to Admin Dashboard
3. Verify new tabs are visible:
   - CSV Import
   - Product Mapping
   - Import History

## Testing Workflow

### Test 1: CSV Upload
1. Go to **CSV Import** tab
2. Upload the test CSV: `src/data/VR User List - PKS.csv`
3. Verify preview shows correct data
4. Click "Import CSV"
5. Check for success message

### Test 2: Product Discovery
1. Go to **Product Mapping** tab
2. Verify products from CSV appear
3. Check stats show:
   - Total products
   - Mapped vs Unmapped

### Test 3: Product-App Mapping
1. Select an unmapped product
2. Click "Add Mapping"
3. Choose an app from dropdown
4. Select access tier
5. Click "Create Mapping"
6. Verify mapping appears in list

### Test 4: Import History
1. Go to **Import History** tab
2. Find your import in the list
3. Click "Details"
4. Verify all stats are correct:
   - Total rows
   - Successful rows
   - New products
   - New users

### Test 5: User Access
1. Log out of admin account
2. Log in as a test user from the CSV
3. Their products should grant app access
4. Verify they see correct apps on dashboard

## Post-Deployment Verification

- [ ] Edge Functions are accessible
- [ ] CSV import completes without errors
- [ ] Products are discovered and stored
- [ ] Users are created/updated correctly
- [ ] Product mappings work as expected
- [ ] User access is resolved properly
- [ ] Import history is accurate

## Rollback Plan

If issues occur:

1. **Edge Functions fail:**
   - Check Supabase logs
   - Verify environment variables
   - Redeploy with fixes

2. **Database issues:**
   - Migrations are non-destructive
   - Can safely re-run if needed
   - No data loss risk

3. **Frontend issues:**
   - Previous build still works
   - New tabs can be removed from TAB_CONFIG
   - Redeploy previous version if needed

## Common Issues & Solutions

### Issue: CSV Import Fails
**Solution:**
- Check CSV format matches template
- Verify all required columns present
- Look at error log in Import History

### Issue: Products Not Mapping
**Solution:**
- Ensure product status is "unmapped"
- Check that app exists in apps table
- Verify access tiers are active

### Issue: User Can't Access App
**Solution:**
- Verify user email matches CSV exactly
- Check product is mapped to app
- Ensure mapping is marked active
- Refresh user's session

### Issue: Edge Function Timeout
**Solution:**
- Large CSV files may take time
- Consider splitting into smaller files
- Check Supabase function logs

## Production Recommendations

1. **Start Small**: Import a test CSV with 10-20 rows first
2. **Verify Mappings**: Map all products before importing more CSVs
3. **Monitor Performance**: Check Edge Function execution times
4. **Regular Backups**: Export product mappings periodically
5. **User Communication**: Notify users when granting access to new apps

## Support Resources

- [CSV Import System Guide](./CSV_IMPORT_SYSTEM_GUIDE.md)
- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [Database Schema](./supabase/migrations/)

## Success Criteria

✅ CSV files import without errors
✅ Products automatically discovered
✅ Manual mapping interface works smoothly
✅ Users receive correct app access
✅ Import history provides clear audit trail
✅ System handles large CSV files (1000+ rows)

---

**Ready to Deploy**: Once all items checked, system is production-ready!
