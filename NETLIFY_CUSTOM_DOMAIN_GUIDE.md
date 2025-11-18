# Netlify Custom Domain Configuration Guide

Complete guide for setting up and troubleshooting your videoremix.vip custom domain with Netlify.

---

## Overview

Your VideoRemix platform uses:
- **Primary Domain**: videoremix.vip
- **Netlify Site**: videoremix.netlify.app (redirects to custom domain)
- **Multiple Subdomains**: For different apps (ai-personalizedcontent.videoremix.vip, etc.)

---

## Step 1: Verify Current Domain Status

### 1.1: Check Netlify Dashboard

1. Go to [Netlify Dashboard](https://app.netlify.com)
2. Select your VideoRemix site
3. Navigate to **Domain settings** → **Custom domains**
4. Check the status of videoremix.vip

**Possible Statuses:**

| Status | Meaning | Action Required |
|--------|---------|-----------------|
| ✅ **Netlify DNS** | Fully managed by Netlify | None - working correctly |
| ✅ **External DNS** | Pointing correctly to Netlify | Verify SSL is enabled |
| ⚠️ **Awaiting External DNS** | DNS not configured | Update DNS records |
| ❌ **Not Configured** | Domain not added | Add domain to Netlify |

### 1.2: Check DNS Propagation

Use online tools to verify DNS is working:
- [DNS Checker](https://dnschecker.org) - Enter: videoremix.vip
- [What's My DNS](https://www.whatsmydns.net) - Check A or CNAME records
- Expected: Should point to Netlify servers

---

## Step 2: DNS Configuration Options

### Option A: Using Netlify DNS (Recommended)

**Pros:**
- ✅ Automatic SSL certificate management
- ✅ Built-in DDOS protection
- ✅ Easy subdomain management
- ✅ Fast global CDN

**Setup Steps:**

1. In Netlify Dashboard, go to **Domain settings** → **DNS**
2. Click **Set up Netlify DNS for videoremix.vip**
3. Follow the wizard - it will show you nameservers like:
   ```
   dns1.p05.nsone.net
   dns2.p05.nsone.net
   dns3.p05.nsone.net
   dns4.p05.nsone.net
   ```

4. Go to your domain registrar (where you bought videoremix.vip)
5. Update nameservers to use Netlify's nameservers
6. Wait 24-48 hours for DNS propagation

### Option B: Using External DNS Provider

**Pros:**
- ✅ Keep existing email setup
- ✅ More control over DNS records
- ✅ Use with other services

**Setup Steps:**

#### For Apex Domain (videoremix.vip):

Add an **A record**:
```
Type: A
Name: @ (or leave blank for apex)
Value: 75.2.60.5
TTL: 3600 (or Auto)
```

#### For WWW Subdomain:

Add a **CNAME record**:
```
Type: CNAME
Name: www
Value: [your-netlify-site-name].netlify.app
TTL: 3600
```

Example: `videoremix-prod.netlify.app`

#### For App Subdomains:

Add **CNAME records** for each app:

```
Type: CNAME
Name: ai-personalizedcontent
Value: [your-netlify-site-name].netlify.app
TTL: 3600

Type: CNAME
Name: ai-funnelcraft
Value: [your-netlify-site-name].netlify.app
TTL: 3600

Type: CNAME
Name: ai-skills
Value: [your-netlify-site-name].netlify.app
TTL: 3600

Type: CNAME
Name: ai-skills-monetizer
Value: [your-netlify-site-name].netlify.app
TTL: 3600

Type: CNAME
Name: ai-salespage
Value: [your-netlify-site-name].netlify.app
TTL: 3600

Type: CNAME
Name: ai-salesassistant
Value: [your-netlify-site-name].netlify.app
TTL: 3600

Type: CNAME
Name: ai-personalizer
Value: [your-netlify-site-name].netlify.app
TTL: 3600

Type: CNAME
Name: ai-video-transformer
Value: [your-netlify-site-name].netlify.app
TTL: 3600

Type: CNAME
Name: ai-screenrecorder
Value: [your-netlify-site-name].netlify.app
TTL: 3600

Type: CNAME
Name: ai-signature
Value: [your-netlify-site-name].netlify.app
TTL: 3600

Type: CNAME
Name: ai-thumbnail-generator
Value: [your-netlify-site-name].netlify.app
TTL: 3600

Type: CNAME
Name: ai-personalizationstudio
Value: [your-netlify-site-name].netlify.app
TTL: 3600
```

---

## Step 3: Add Custom Domain in Netlify

If domain not already added:

1. In Netlify Dashboard, go to **Domain settings** → **Custom domains**
2. Click **Add custom domain**
3. Enter: `videoremix.vip`
4. Click **Verify** and **Add domain**
5. Netlify will check DNS configuration

### Add Domain Aliases

For each subdomain:

1. Click **Add domain alias**
2. Enter subdomain (e.g., `ai-personalizedcontent.videoremix.vip`)
3. Click **Add**
4. Repeat for all app subdomains

---

## Step 4: Enable HTTPS/SSL

### 4.1: Automatic SSL Certificate

1. Go to **Domain settings** → **HTTPS**
2. Find **SSL/TLS certificate** section
3. Netlify should automatically provision a Let's Encrypt certificate
4. Status should show: ✅ **Certificate active**

### 4.2: If Certificate Fails

**Common reasons:**
- DNS not propagated yet (wait 24-48 hours)
- CAA records blocking Let's Encrypt
- Domain not verified

**Solutions:**

1. **Force certificate renewal:**
   - **HTTPS** → **Renew certificate**
   - Wait 5-10 minutes

2. **Check DNS propagation:**
   - Use [DNS Checker](https://dnschecker.org)
   - Verify A/CNAME records are correct worldwide

3. **Remove CAA records (if present):**
   - In your DNS provider, check for CAA records
   - Either remove them or add: `0 issue "letsencrypt.org"`

### 4.3: Enable HTTPS Redirects

1. In **HTTPS** settings
2. Enable **Force HTTPS** (redirects HTTP to HTTPS)
3. Enable **Use HSTS** (optional but recommended for security)

---

## Step 5: Configure Redirect Rules

Your `netlify.toml` file already includes redirect rules:

```toml
# Redirect from netlify.app to custom domain
[[redirects]]
  from = "https://videoremix.netlify.app/*"
  to = "https://videoremix.vip/:splat"
  status = 301
  force = true

# SPA fallback
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Verify Redirects

Test that netlify.app redirects to videoremix.vip:

```bash
curl -I https://videoremix.netlify.app
```

Expected response:
```
HTTP/2 301
location: https://videoremix.vip/
```

---

## Step 6: Testing & Verification

### 6.1: Test Main Domain

```bash
# Test DNS resolution
nslookup videoremix.vip

# Test HTTPS
curl -I https://videoremix.vip

# Expected: HTTP 200 OK
```

### 6.2: Test Subdomains

Visit each subdomain in browser:
- https://ai-personalizedcontent.videoremix.vip
- https://ai-funnelcraft.videoremix.vip
- https://ai-skills.videoremix.vip
- (etc.)

**Expected**: Should load the app or show appropriate content

### 6.3: Test SSL Certificate

1. Visit https://videoremix.vip
2. Click the lock icon in browser address bar
3. Click **Certificate** → **Details**
4. Verify:
   - Issued by: Let's Encrypt
   - Valid for: videoremix.vip and *.videoremix.vip (wildcard)
   - Expiration: Future date

---

## Step 7: Monitor Domain Health

### Daily Checks

- ✅ Site loads at videoremix.vip
- ✅ HTTPS enabled with valid certificate
- ✅ All subdomains accessible
- ✅ No mixed content warnings

### Monthly Checks

- ✅ SSL certificate auto-renewed (Let's Encrypt renews every 60 days)
- ✅ DNS records still pointing correctly
- ✅ No new subdomains needed for apps

### Tools for Monitoring

- [SSL Labs SSL Test](https://www.ssllabs.com/ssltest/) - Check SSL security
- [Uptime Robot](https://uptimerobot.com) - Monitor site availability
- Netlify Analytics - Built-in traffic monitoring

---

## Troubleshooting Guide

### Issue: Domain Shows "Site Not Found"

**Cause**: DNS not pointing to Netlify or domain not added in Netlify

**Solutions:**
1. Verify DNS records are correct (Step 2)
2. Check domain is added in Netlify **Custom domains**
3. Wait for DNS propagation (up to 48 hours)
4. Clear DNS cache: `ipconfig /flushdns` (Windows) or `sudo dscacheutil -flushcache` (Mac)

### Issue: "Not Secure" Warning in Browser

**Cause**: SSL certificate not issued or expired

**Solutions:**
1. Go to Netlify **HTTPS** → **Renew certificate**
2. Verify DNS is pointing correctly
3. Check for CAA records blocking Let's Encrypt
4. Wait 10 minutes and refresh browser

### Issue: Subdomain Not Working

**Cause**: CNAME record missing or incorrect

**Solutions:**
1. Add CNAME record for subdomain in DNS provider
2. Add subdomain as domain alias in Netlify
3. Wait for DNS propagation
4. Test with: `nslookup ai-personalizedcontent.videoremix.vip`

### Issue: Mixed Content Warnings

**Cause**: Some assets loading over HTTP instead of HTTPS

**Solutions:**
1. Enable **Force HTTPS** in Netlify
2. Check `netlify.toml` has HTTPS redirect rules
3. Update any hardcoded HTTP URLs in code to HTTPS
4. Verify Supabase and external APIs use HTTPS

### Issue: Redirect Loop

**Cause**: Multiple redirect rules conflicting

**Solutions:**
1. Check `netlify.toml` redirect rules
2. Ensure SPA fallback is LAST rule
3. Verify no conflicting redirects in DNS provider
4. Clear browser cache and cookies

### Issue: Certificate Expired

**Cause**: Netlify failed to auto-renew

**Solutions:**
1. Manually renew: **HTTPS** → **Renew certificate**
2. Check Netlify email for renewal notifications
3. Verify DNS hasn't changed
4. Contact Netlify support if issue persists

---

## Common DNS Provider Instructions

### Namecheap

1. Login to Namecheap account
2. Go to **Domain List** → Select videoremix.vip
3. Click **Manage** → **Advanced DNS**
4. Add A/CNAME records as specified in Step 2

### GoDaddy

1. Login to GoDaddy account
2. Go to **My Products** → **Domains**
3. Click **DNS** next to videoremix.vip
4. Add records under **Records** section

### Cloudflare

1. Login to Cloudflare dashboard
2. Select videoremix.vip domain
3. Go to **DNS** → **Records**
4. Add A/CNAME records
5. **Important**: Set SSL/TLS to **Full** (not Flexible)

### Google Domains

1. Login to Google Domains
2. Select videoremix.vip
3. Go to **DNS** → **Custom records**
4. Add A/CNAME records

---

## Best Practices

### Security

- ✅ Always use HTTPS (never HTTP)
- ✅ Enable HSTS for additional security
- ✅ Keep SSL certificates auto-renewed
- ✅ Use strong DNS provider with DNSSEC

### Performance

- ✅ Use Netlify CDN for global distribution
- ✅ Enable **Asset Optimization** in Netlify
- ✅ Set appropriate cache headers
- ✅ Use HTTP/2 (enabled by default in Netlify)

### Reliability

- ✅ Monitor domain expiration date
- ✅ Keep registrar contact info updated
- ✅ Enable auto-renewal for domain
- ✅ Have backup DNS provider configured

---

## DNS Record Summary

Quick reference for all required DNS records:

```
# Apex domain
A     @     75.2.60.5

# WWW subdomain
CNAME www   [your-site].netlify.app

# App subdomains (12 total)
CNAME ai-personalizedcontent      [your-site].netlify.app
CNAME ai-funnelcraft              [your-site].netlify.app
CNAME ai-skills                   [your-site].netlify.app
CNAME ai-skills-monetizer         [your-site].netlify.app
CNAME ai-salespage                [your-site].netlify.app
CNAME ai-salesassistant           [your-site].netlify.app
CNAME ai-personalizer             [your-site].netlify.app
CNAME ai-video-transformer        [your-site].netlify.app
CNAME ai-screenrecorder           [your-site].netlify.app
CNAME ai-signature                [your-site].netlify.app
CNAME ai-thumbnail-generator      [your-site].netlify.app
CNAME ai-personalizationstudio    [your-site].netlify.app
```

---

## Next Steps After Domain Setup

1. ✅ Domain configured and verified
2. ✅ SSL certificate active
3. ✅ All subdomains working
4. ✅ Redirects functioning correctly
5. → Configure environment variables (see ENVIRONMENT_VARIABLES_AUDIT.md)
6. → Connect GitHub repository (see GITHUB_SETUP_GUIDE.md)
7. → Deploy latest changes

---

## Support Resources

- [Netlify Custom Domains Docs](https://docs.netlify.com/domains-https/custom-domains/)
- [Netlify HTTPS Docs](https://docs.netlify.com/domains-https/https-ssl/)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [DNS Checker Tool](https://dnschecker.org)

---

**Created**: October 31, 2025
**Last Updated**: October 31, 2025
**Status**: Reference Guide
