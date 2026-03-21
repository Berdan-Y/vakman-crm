# Quick Start: Mailgun Email Setup

## 1. Install Package ✓
Already installed: `symfony/mailgun-mailer`

## 2. Get Mailgun Credentials

### For Testing (Sandbox):
1. Go to https://mailgun.com and sign up
2. Navigate to **Sending → Domains**
3. Use the sandbox domain provided
4. Add authorized recipients (emails you want to test with)

### For Production:
1. Add your domain in Mailgun
2. Set up DNS records (TXT, MX, CNAME)
3. Wait for verification

## 3. Configure .env

Update your `.env` file:

```env
# Change from 'smtp' or 'log' to 'mailgun'
MAIL_MAILER=mailgun

# Your email details
MAIL_FROM_ADDRESS="noreply@yourdomain.com"
MAIL_FROM_NAME="Vakman CRM"

# Mailgun credentials (get from Mailgun dashboard)
MAILGUN_DOMAIN=sandboxXXXXXXXX.mailgun.org
MAILGUN_SECRET=key-XXXXXXXXXXXXXXXXXXXXXXXX
MAILGUN_ENDPOINT=api.mailgun.net

# If EU region, use:
# MAILGUN_ENDPOINT=api.eu.mailgun.net
```

## 4. Test Configuration

Run this command:
```bash
php artisan mail:test your-email@example.com
```

If using sandbox, make sure the email is in your authorized recipients list.

## 5. Start Queue Worker

In a new terminal, run:
```bash
php artisan queue:work
```

Keep this running in the background.

## 6. Test Invoice Sending

1. Go to your application
2. Open any job
3. Click "Create invoice"
4. Fill in the details
5. Either:
   - Check "Send immediately" and save, OR
   - Save as draft and click "Send" button

## Usage

### Creating and Sending Invoice
- **Save as Draft**: Uncheck "Send immediately" → Edit later
- **Send Immediately**: Check "Send immediately" → Email sent on save

### Sending Draft Invoice
- Click "Send" button next to draft invoice
- Email sent with PDF attachment

### Invoice Statuses
- **Draft** (gray badge): Not sent yet, can edit
- **Sent** (blue badge): Email delivered, can mark as paid
- **Paid** (green badge): Payment received

## Troubleshooting

### Emails not arriving?

1. **Check queue worker is running**:
   ```bash
   php artisan queue:work
   ```

2. **Check logs**:
   ```bash
   tail -f storage/logs/laravel.log
   ```

3. **Using sandbox?**
   - Only authorized recipients can receive emails
   - Go to Mailgun → Your Domain → Authorized Recipients
   - Add and verify the email address

4. **Check Mailgun dashboard**:
   - Go to **Sending → Logs**
   - See if emails are being sent

### Common Errors

| Error | Solution |
|-------|----------|
| "CSRF token mismatch" | Refresh the page |
| "Failed to send email" | Check `.env` credentials |
| Email stays as draft | Make sure queue worker is running |
| "Unauthorized recipient" | Add email to Mailgun authorized recipients |

## Production Setup

For production use:

1. **Use your own domain** (not sandbox)
2. **Set up queue worker with Supervisor** (see MAILGUN_SETUP.md)
3. **Update FROM address** to use your domain
4. **Monitor Mailgun logs** regularly

## Where to Find Things

- **Setup Guide**: `MAILGUN_SETUP.md`
- **Implementation Details**: `EMAIL_IMPLEMENTATION.md`
- **Email Template**: `resources/views/emails/invoice.blade.php`
- **Test Command**: `php artisan mail:test`

## Quick Commands

```bash
# Test email configuration
php artisan mail:test your@email.com

# Start queue worker (keep running)
php artisan queue:work

# View queue jobs
php artisan queue:work --once

# Check logs
tail -f storage/logs/laravel.log
```

## Need Help?

1. Read `MAILGUN_SETUP.md` for detailed instructions
2. Check Mailgun documentation: https://documentation.mailgun.com
3. Review Laravel logs: `storage/logs/laravel.log`
