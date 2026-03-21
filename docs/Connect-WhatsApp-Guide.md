# Connect your WhatsApp Business number

This guide is for **business users** who want to connect their company’s WhatsApp number to the app. The same steps apply whether you’re setting up for the first time or your organisation is going live—no extra technical steps are needed.

When you connect your number:

- Assigning a job to an employee will send them the job details on WhatsApp.
- You can send messages from the app using your business number.

You only need to follow the steps below once per company. The app handles the rest.

---

## What you need

- A **Facebook account** (personal is fine).
- Your **business** (or the one you’re connecting). If your business isn’t set up with Meta yet, we’ll walk you through it.
- About **10–15 minutes** the first time.

---

## Step 1: Open Meta’s business site

1. Go to **business.facebook.com** and log in with your Facebook account.
2. If you’re asked to create a business account, enter your **business name** and your **name** as the person managing it, then continue.
3. If you already have a business account, select it.

---

## Step 2: Add WhatsApp to your business

1. In the left menu, look for **WhatsApp** or **All tools** → **WhatsApp**.
2. If you see **WhatsApp Manager** or **WhatsApp Accounts**, open it.
3. Click **Add** or **Create** to add a **WhatsApp Business Account** (this is the official way to use a business number for messaging).
4. Follow the prompts. You may be asked to:
   - Accept WhatsApp’s terms.
   - Add or select a **phone number** for your business (you can use a new number or one you already use for WhatsApp Business app).

If your country or number type requires **business verification**, Meta will ask you to submit documents (e.g. business registration, utility bill). This can take a few days. Once verified, you can continue.

---

## Step 3: Get your connection details

You need **two things** from Meta to paste into the app:

1. **Phone number ID** – an ID that represents your WhatsApp business number.
2. **Access token** – a code that lets the app send messages from your number safely.

Where to find them:

- If you’re in **WhatsApp Manager** (business.facebook.com):
  - Open your **WhatsApp account** → **Phone numbers** (or **API setup** / **Getting started**).
  - You’ll see your number and a **Phone number ID**. Copy the **Phone number ID**.
  - Look for **Temporary access token** or **Access token**. Click **Generate** or **Copy** and save the token.

- If your company uses an **IT person or partner** who set up “WhatsApp Business API” or “Cloud API”:
  - Ask them for the **Phone number ID** and a **permanent (long-lived) access token** for that number.
  - They can get the token from **Meta Business Suite** → **Business settings** → **Users** → **System users** → generate a token with WhatsApp permissions.

**Important:** A “temporary” token only works for about 24 hours. For ongoing use, you need a **permanent** token. If you only see a temporary token, ask your IT team or the person who manages your Meta business to create a permanent one (system user token) and give you those two values.

---

## Step 4: Enter the details in the app

1. Log in to this app and select your **company** (if you have more than one).
2. Go to **Settings** (your profile or the gear icon) → **Integrations**.
3. In the **WhatsApp** section:
   - Paste the **Phone number ID** into the first field.
   - Paste the **Access token** into the second field.
   - Optionally fill in **Display phone number** (the number as customers see it, e.g. +31 6 12345678) and **Business name** so it’s clear which number is connected.
4. Click **Connect WhatsApp**.

If everything is correct, you’ll see **Connected**. From then on, when you assign a job to an employee and choose to send a notification, they’ll receive the job details on WhatsApp from your business number.

---

## Step 5: Make sure employees have the right phone number

- In the app, each **employee** has a phone number.
- Notifications are sent to that number on WhatsApp.
- Use a number that has WhatsApp (with country code, no spaces or extra zeros), e.g. **31612345678** for the Netherlands.

---

## If something doesn’t work

- **“WhatsApp is not connected”**  
  Check that you pasted the full **Phone number ID** and **Access token** with no extra spaces. Try disconnecting and connecting again with fresh values.

- **“Invalid recipient phone number”**  
  The employee’s phone number in the app must be correct and include the country code (e.g. 31 for Netherlands, 1 for USA).

- **Messages stop working after a day**  
  You’re probably using a temporary token. Ask your IT person or Meta business admin for a **permanent access token** and paste the new token in **Settings** → **Integrations** → WhatsApp, then connect again.

- **Meta asks for business verification**  
  This is normal for many regions. Complete the verification with your business documents; once approved, you can add your number and get the connection details as in Step 3.

---

## Summary

1. Go to **business.facebook.com** and add **WhatsApp** to your business.
2. Get your **Phone number ID** and **Access token** (use a permanent token for ongoing use).
3. In this app: **Settings** → **Integrations** → paste both → **Connect WhatsApp**.
4. Assign jobs and send notifications as usual; the app sends the messages for you.

No coding or technical setup is required in the app itself—just these steps. If your organisation uses an IT team or a Meta partner, they can handle Steps 1–3 and give you the two values to paste in Step 4.
