# Mailgun Email Setup Guide

This guide will help you set up Mailgun to send invoice emails from your Vakman CRM application.

## Overview

The system is now configured to send invoice emails with PDF attachments to customers and employees. Emails are sent automatically when you create/update an invoice with "Send immediately" checked, or manually by clicking the "Send" button on draft invoices.

## Prerequisites

1. A Mailgun account (free tier available)
2. A verified domain or use Mailgun's sandbox domain for testing

## Step 1: Sign Up for Mailgun

1. Go to [https://mailgun.com](https://mailgun.com)
2. Click "Sign Up" and create a free account
3. Verify your email address

## Step 2: Get Your API Credentials

### Option A: Using Mailgun Sandbox (Testing)

1. After logging in, go to **Sending** → **Domains**
2. You'll see a sandbox domain like `sandboxXXXXXXXX.mailgun.org`
3. Click on the sandbox domain
4. Note down:
   - **Domain**: `sandboxXXXXXXXX.mailgun.org`
   - **API Key**: Found under **Domain Information** → **HTTP** → **API Key**
5. Add authorized recipients:
   - Go to **Domain Settings** → **Authorized Recipients**
   - Add email addresses that you want to test with
   - Verify each email address (they'll receive a confirmation email)

### Option B: Using Your Own Domain (Production)

1. Go to **Sending** → **Domains** → **Add New Domain**
2. Enter your domain (e.g., `mail.yourdomain.com`)
3. Follow the DNS setup instructions:
   - Add the TXT, MX, and CNAME records to your domain's DNS settings
   - Wait for DNS propagation (can take up to 48 hours)
4. Once verified, note down:
   - **Domain**: `mail.yourdomain.com`
   - **API Key**: Found under **Domain Information** → **HTTP** → **API Key**

## Step 3: Configure Your .env File

Add or update these lines in your `.env` file:

```env
# Change mailer from 'log' to 'mailgun'
MAIL_MAILER=mailgun
MAIL_FROM_ADDRESS="noreply@yourdomain.com"
MAIL_FROM_NAME="Vakman CRM"

# Mailgun Configuration
MAILGUN_DOMAIN=sandboxXXXXXXXX.mailgun.org
MAILGUN_SECRET=your-api-key-here
MAILGUN_ENDPOINT=api.mailgun.net
```

**Important Notes:**
- Replace `MAILGUN_DOMAIN` with your actual domain or sandbox domain
- Replace `MAILGUN_SECRET` with your actual API key (starts with `key-`)
- If using EU region, change `MAILGUN_ENDPOINT` to `api.eu.mailgun.net`
- Change `MAIL_FROM_ADDRESS` to an email address on your verified domain

## Step 4: Set Up Queue Worker (Recommended)

Emails are queued for better performance. To process them:

### Development (Simple)

Run this command in a terminal:
```bash
php artisan queue:work
```

Keep this running in the background while testing.

### Production (Using Supervisor)

1. Install Supervisor:
```bash
sudo apt-get install supervisor
```

2. Create a configuration file `/etc/supervisor/conf.d/vakman-queue.conf`:
```ini
[program:vakman-queue]
process_name=%(program_name)s_%(process_num)02d
command=php /path/to/your/project/artisan queue:work --sleep=3 --tries=3 --max-time=3600
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
user=www-data
numprocs=2
redirect_stderr=true
stdout_logfile=/path/to/your/project/storage/logs/queue-worker.log
stopwaitsecs=3600
```

3. Update and start Supervisor:
```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start vakman-queue:*
```

## Step 5: Test Email Sending

1. Go to your application
2. Create or view a job
3. Create an invoice for a customer or employee
4. Either:
   - Check "Send immediately" when creating the invoice, OR
   - Click the "Send" button on a draft invoice
5. Check the recipient's email inbox

### Troubleshooting

If emails aren't being sent:

1. **Check Queue Processing**:
   ```bash
   php artisan queue:work
   ```
   Watch for any errors in the output.

2. **Check Logs**:
   ```bash
   tail -f storage/logs/laravel.log
   ```

3. **Check Mailgun Dashboard**:
   - Go to **Sending** → **Logs**
   - See if emails are being received by Mailgun

4. **Common Issues**:
   - **API Key Invalid**: Double-check your `MAILGUN_SECRET` in `.env`
   - **Domain Not Verified**: Verify your domain DNS settings in Mailgun dashboard
   - **Sandbox Limitations**: With sandbox domain, you can only send to authorized recipients
   - **Queue Not Running**: Make sure `php artisan queue:work` is running

5. **Test Configuration**:
   ```bash
   php artisan tinker
   ```
   Then run:
   ```php
   Mail::raw('Test email', function($msg) {
       $msg->to('your-email@example.com')->subject('Test');
   });
   ```

## Features

### What Gets Emailed

- **Customer Invoices**: Professional invoice with itemized lines, totals, and company details
- **Employee Payments**: Payment details and breakdown
- **PDF Attachment**: Complete invoice as a professionally formatted PDF

### Email Content

- Subject line changes based on invoice type (Customer/Employee)
- Professional HTML template with your app name
- Shows amount due/paid
- Includes PDF attachment with full invoice details

### Invoice Workflow

1. **Draft**: Create invoice without sending → Can edit freely
2. **Send**: Click "Send" button or check "Send immediately" → Emails sent via Mailgun
3. **Sent**: Invoice has been emailed → Can mark as paid
4. **Paid**: Final state → No further actions needed

## Configuration Options

### Regional Endpoints

- US Region (default): `api.mailgun.net`
- EU Region: `api.eu.mailgun.net`

Update `MAILGUN_ENDPOINT` in `.env` based on your Mailgun account region.

### Custom From Address

Update these in your `.env`:
```env
MAIL_FROM_ADDRESS="invoices@yourcompany.com"
MAIL_FROM_NAME="Your Company Name"
```

### Email Template Customization

The email template is located at:
```
resources/views/emails/invoice.blade.php
```

You can customize the HTML, styling, and content as needed.

## Production Checklist

- [ ] Verify your domain in Mailgun
- [ ] Update all DNS records (TXT, MX, CNAME)
- [ ] Set `MAILGUN_DOMAIN` to your verified domain
- [ ] Set `MAIL_FROM_ADDRESS` to an address on your domain
- [ ] Set up Supervisor for queue processing
- [ ] Test sending to multiple email addresses
- [ ] Monitor Mailgun logs for delivery issues
- [ ] Set up domain authentication (SPF, DKIM, DMARC)

## Costs

Mailgun Pricing (as of 2024):
- **Free Tier**: 5,000 emails/month for 3 months (for new accounts)
- **Pay As You Go**: First 1,000 emails free per month, then $0.80 per 1,000 emails
- **Foundation Plan**: $35/month for 50,000 emails

The free tier is usually sufficient for small businesses getting started.

## Support

For Mailgun-specific issues:
- Documentation: [https://documentation.mailgun.com](https://documentation.mailgun.com)
- Support: [https://www.mailgun.com/support](https://www.mailgun.com/support)

For application-specific issues, check the Laravel logs in `storage/logs/laravel.log`.
