# QUICK FIX: .vip TLD Spam Filter Issue

## Problem
Your `.vip` domain is flagged by spam filters as "Untrustworthy TLD", causing emails to land in spam.

## Immediate Solution (15 minutes)

### Option 1: Use Custom SMTP with SendGrid (Recommended)

**Step 1: Sign Up for SendGrid**
1. Go to https://signup.sendgrid.com/
2. Sign up for free account (100 emails/day)
3. Verify your email

**Step 2: Create API Key**
1. Go to Settings → API Keys
2. Click "Create API Key"
3. Name it "VideoRemix Supabase"
4. Select "Full Access"
5. Copy the API key (save it securely)

**Step 3: Verify Sender Identity**
1. Go to Settings → Sender Authentication
2. Click "Verify a Single Sender"
3. Enter:
   - From Name: VideoRemix
   - From Email: noreply@videoremix.vip
   - Reply To: support@videoremix.vip
   - Company: VideoRemix
   - Address: [Your address]
4. Check your email and verify

**Step 4: Configure Supabase**
1. Go to Supabase Dashboard
2. Navigate to: Project Settings → Auth → SMTP Settings
3. Enable Custom SMTP
4. Enter:
   ```
   Host: smtp.sendgrid.net
   Port: 587
   Username: apikey
   Password: [Your SendGrid API Key]
   Sender Email: noreply@videoremix.vip
   Sender Name: VideoRemix
   ```
5. Click Save

**Step 5: Test**
1. Send a test signup email
2. Check if it arrives in inbox (not spam)
3. Use mail-tester.com to verify score

### Option 2: Use Mailgun (Alternative)

**If SendGrid doesn't work, try Mailgun:**

1. Sign up at https://www.mailgun.com/
2. Get SMTP credentials
3. Configure in Supabase:
   ```
   Host: smtp.mailgun.org
   Port: 587
   Username: [Mailgun SMTP username]
   Password: [Mailgun SMTP password]
   Sender Email: noreply@videoremix.vip
   Sender Name: VideoRemix
   ```

## DNS Configuration (30 minutes)

**Add these DNS records to improve deliverability:**

### SPF Record
```
Type: TXT
Name: @
Value: v=spf1 include:sendgrid.net ~all
```

### DKIM Records
SendGrid will provide these in Settings → Sender Authentication → Authenticate Your Domain

### DMARC Record
```
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=none; rua=mailto:dmarc@videoremix.vip
```

## Expected Results

**Before Custom SMTP:**
- Spam Score: 3-5/10
- Emails land in spam: 60-80%

**After Custom SMTP + DNS:**
- Spam Score: 8-10/10
- Emails land in inbox: 95%+

## Testing

**Test Your Setup:**
1. Send test email to: test-[random]@mail-tester.com
2. Visit https://www.mail-tester.com/
3. Check your score
4. Fix any issues listed

**Target Score:** 8+/10

## Still Having Issues?

### Temporary Workarounds:

1. **Use Subdomain**
   - Instead of: videoremix.vip
   - Use: mail.videoremix.vip or app.videoremix.vip

2. **Reduce Links**
   - Keep only essential links
   - Remove footer links if necessary

3. **Simplify Content**
   - Use more plain text
   - Less HTML styling
   - Shorter messages

### Long-term Solutions:

1. **Register .com Domain**
   - Buy videoremix.com
   - Use for email sending
   - Link back to .vip for the app

2. **Build Reputation**
   - Start with low volume
   - Gradually increase
   - Monitor metrics closely

## Priority Actions

**Do Immediately:**
1. ✅ Set up custom SMTP (SendGrid/Mailgun)
2. ✅ Test email delivery
3. ✅ Check spam score on mail-tester.com

**Do Within 24 Hours:**
1. ✅ Add SPF record to DNS
2. ✅ Configure DKIM
3. ✅ Set up DMARC

**Do Within 1 Week:**
1. ✅ Monitor deliverability metrics
2. ✅ Adjust based on results
3. ✅ Consider alternative domain if needed

## Help & Support

**Need Help?**
- SendGrid Support: https://support.sendgrid.com/
- Mailgun Support: https://help.mailgun.com/
- Supabase Discord: https://discord.supabase.com/

**Questions?**
Email: support@videoremix.vip

---

**TL;DR:** Set up custom SMTP with SendGrid (free, 15 minutes) to bypass .vip TLD spam filter issues.
