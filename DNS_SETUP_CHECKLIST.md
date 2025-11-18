# DNS Configuration Checklist for videoremix.vip

## Required DNS Records

### Option 1: Using A Record (Recommended for most providers)
```
Type: A
Name: @ (or leave empty for root domain)
Value: 75.2.60.5
TTL: 3600 (or Auto)
```

### Option 2: Using ALIAS/ANAME (if your DNS provider supports it)
```
Type: ALIAS or ANAME
Name: @ (or leave empty for root domain)  
Value: [your-netlify-site].netlify.app
TTL: 3600 (or Auto)
```

### WWW Subdomain (Optional but recommended)
```
Type: CNAME
Name: www
Value: [your-netlify-site].netlify.app
TTL: 3600 (or Auto)
```

## Verification Steps

1. **Check DNS Propagation:**
   ```bash
   nslookup videoremix.vip
   # Should return: 75.2.60.5
   ```

2. **Check HTTPS Certificate:**
   - Visit https://videoremix.vip
   - Check for valid SSL certificate (not browser warning)

3. **Verify in Netlify:**
   - Go to Domain Management in Netlify
   - Should show "Netlify DNS" or "External DNS configured"
   - HTTPS should show "Certificate active"

## Common Issues

### Issue: Site shows Netlify URL instead of custom domain
**Solution:** Set videoremix.vip as primary domain in Netlify Domain Management

### Issue: DNS not propagating
**Solution:** Wait 24-48 hours or flush DNS cache:
```bash
# Windows
ipconfig /flushdns

# Mac
sudo dscacheutil -flushcache

# Linux
sudo systemd-resolve --flush-caches
```

### Issue: SSL Certificate not provisioning
**Solution:** 
- Verify DNS is correctly configured
- Click "Verify DNS configuration" in Netlify HTTPS settings
- Wait for automatic provisioning (can take 24 hours)

## Current Configuration

Your netlify.toml already has the correct redirect:
- FROM: https://videoremix.netlify.app/*
- TO: https://videoremix.vip/:splat
- STATUS: 301 (Permanent redirect)

This ensures even if someone accesses the Netlify URL, they'll be redirected to your custom domain.
