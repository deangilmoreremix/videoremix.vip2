# Supabase Configuration Protection

## ✅ Protection System Active

Your Supabase configuration is now protected from accidental overwrites.

### Correct Configuration
- **Project ID**: `gadedbrnqzpfqtsdfzcg`
- **URL**: `https://gadedbrnqzpfqtsdfzcg.supabase.co`

### Protection Mechanisms

1. **Lock File** (`.env.lock`)
   - Contains the correct project ID and URL
   - Used as the source of truth for validation
   - Do not delete this file

2. **Validation Script** (`validate-env.mjs`)
   - Automatically runs before `npm run dev` and `npm run build`
   - Checks that `.env` matches `.env.lock`
   - Prevents builds with incorrect configuration
   - Exits with error if mismatch detected

3. **Example File** (`.env.example`)
   - Updated with correct credentials
   - Use as template: `cp .env.example .env`

### How It Works

The validation script runs automatically:
```bash
npm run dev      # Validates before starting dev server
npm run build    # Validates before building
npm run validate-env  # Manual validation
```

If wrong credentials detected, you'll see:
```
❌ ERROR: Incorrect Supabase URL detected!
   Current:  https://wrong-project.supabase.co
   Expected: https://gadedbrnqzpfqtsdfzcg.supabase.co
   Project:  gadedbrnqzpfqtsdfzcg

   Run: cp .env.example .env
```

### Manual Restore

If `.env` gets corrupted:
```bash
cp .env.example .env
npm run validate-env
```

### Files Protected
- `.env` - Working configuration
- `.env.example` - Template with correct values
- `.env.lock` - Lock file (source of truth)

**Do not modify `.env.lock` unless intentionally changing projects!**
