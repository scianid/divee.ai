# Contact Form Setup Documentation

## Overview
The landing page includes a contact form that allows visitors to submit their information. The form includes:
- Name (required)
- Email (required)
- Phone (optional)
- Company Name (optional)
- Google reCAPTCHA v2 (required)

Data is securely stored in the database via an Edge Function, with no direct user access to the table.

## Setup Instructions

### 1. Google reCAPTCHA Enterprise Configuration

#### Get reCAPTCHA Enterprise Keys
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Enable the reCAPTCHA Enterprise API for your project
3. Go to [reCAPTCHA Enterprise](https://console.cloud.google.com/security/recaptcha)
4. Create a new key with the "Score-based" type
5. Add your domain(s) (e.g., divee.ai, localhost for testing)
6. Copy the **Site Key** (already set in code: `6LdwHGksAAAAACdLIN5EjT5aI1CHEH1kiC6G_DUX`)
7. Create an API key in Google Cloud Console with reCAPTCHA Enterprise API access
8. Copy your **Project ID** from Google Cloud Console

#### Configure Backend Environment Variables
Set the required environment variable in Supabase:

1. Go to your Supabase project dashboard
2. Navigate to Project Settings → Edge Functions → Secrets
3. Add this secret:
   - Name: `RECAPTCHA_API_KEY`
   - Value: Your Google Cloud API Key (with reCAPTCHA Enterprise API access)

Alternatively, use the Supabase CLI:
```bash
supabase secrets set RECAPTCHA_API_KEY=your_api_key_here
```

**Note:** The Project ID (`playlist-481721`) and Site Key (`6LdwHGksAAAAACdLIN5EjT5aI1CHEH1kiC6G_DUX`) are already hardcoded in the application.

#### Update Site Key (if needed)
If you need to use a different site key, update it in these locations:

**File:** `web/index.html`
```html
<script src="https://www.google.com/recaptcha/enterprise.js?render=YOUR_SITE_KEY"></script>
```

**File:** `web/src/App.tsx`
```tsx
const token = await (window as any).grecaptcha.enterprise.execute(
  'YOUR_SITE_KEY',
  { action: 'CONTACT_FORM' }
);
```

**File:** `supabase/functions/contact/index.ts`
```typescript
siteKey: "YOUR_SITE_KEY",
```

### 2. Database Migration

The contact submissions table is created automatically via migration:

**File:** `supabase/migrations/20260212000008_contact_submissions.sql`

Run the migration:
```bash
supabase db push
```

Or apply directly in production via the Supabase dashboard.

### 3. Deploy Edge Function

Deploy the contact form Edge Function:

```bash
supabase functions deploy contact
```

The function will be available at: `https://[your-project-ref].supabase.co/functions/v1/contact`

### 4. Update API Endpoint (if needed)

If yreCAPTCHA Enterprise
- **Invisible Captcha**: No user interaction required
- **Score-based**: Uses risk analysis (0.0-1.0 score, 0.5+ threshold for legitimate traffic)
- **Action verification**: Ensures the token was generated for the correct action (CONTACT_FORM)
- **Token expiry**: Tokens are valid for 2 minutes

### our Supabase project URL is different, update the API endpoint in the contact form:

**File:** `web/src/App.tsx`

Find:
```tsx
const response = await fetch('https://srv.divee.ai/functions/v1/contact', {
```

Update to your Supabase project URL:
```tsx
const response = await fetch('https://YOUR_PROJECT_REF.supabase.co/functions/v1/contact', {
```

## Security Features

### Database Security
- **RLS Enabled**: Row Level Security is enabled on `contact_submissions` table
- **No User Enterprise score verification (0.5+ threshold)
- Action verification (ensures token is for CONTACT_FORM action) RLS policies exist, meaning normal users cannot query this table
- **Service Role Only**: Only the Edge Function using the service role key can insert data

### Form Validation
- Email format validation
- Required field validation
- reCAPTCHA verification
- Input sanitization (XSS prevention)

### Data Captured
For spam prevention and audit purposes, the following metadata is stored:
- IP Address (from request headers)
- User Agent (browser information)
- Timestamp (automatic)

## Viewing Submissions

To view contact form submissions, use the Supabase dashboard or query directly:

```sql
SELECT 
  id,
  name,
  email,
  phone,
  company_name,
  created_at,
  ip_address
FROM contact_submissions
ORDER BY created_at DESC;
```

Or create an admin page in your dashboard to view submissions.

## Testing

### Local Testing
1. Start your development server:
   Submit (reCAPTCHA Enterprise works invisibly in the background)
5. Check the browser console and edge function logs for the reCAPTCHA score

**Note:** reCAPTCHA Enterprise works on localhost, but scores may be lower in development. In production, legitimate users typically score 0.7-1.0.

### Test with Different Scores
reCAPTCHA Enterprise doesn't have fixed test keys. To test the form:
- Use a real site key and API key in development
- Monitor scores in the Edge Function logs
- Adjust the score threshold (currently 0.5) in `index.ts` if needed

### Test reCAPTCHA
For local testing,working
- Verify the reCAPTCHA Enterprise script is loaded in `index.html`
- Check browser console for JavaScript errors
- Ensure the site key matches across all files
- Verify reCAPTCHA Enterprise API is enabled in Google Cloud Console

### Form submission fails
- Check browser console for errors
- Verify the Edge Function is deployed: `supabase functions list`
- Check Edge Function logs: `supabase functions logs contact`
- Verify `RECAPTCHA_API_KEY` is set in Supabase secrets

### "Invalid captcha" error
- Verify the API key has access to reCAPTCHA Enterprise API
- Check that the Project ID matches your Google Cloud project
- Review the Edge Function logs to see the actual reCAPTCHA score
- Ensure the domain is registered in reCAPTCHA Enterprise console
- Consider lowering the score threshold (0.5) if legitimate users are being blocked

### Low reCAPTCHA scores
- Scores below 0.5 may indicate bot traffic or unusual patterns
- Legitimate users in development/testing may have lower scores
- Production traffic from real users typically scores 0.7-1.0
- You can adjust the threshold in `index.ts` based on your needs
- Verify the Edge Function is deployed: `supabase functions list`
- Check Edge Function logs: `supabase functions logs contact`
- Verify `RECAPTCHA_SECRET_KEY` is set in Supabase secrets

### "Invalid captcha" error
- Verify the secret key in Supabase matches your reCAPTCHA admin panel
- Ensure the domain is registered in reCAPTCHA admin
- For localhost testing, use the test keys mentioned above

## API Reference

### POST /functions/v1/contact

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "company_name": "Acme Corp",
  "captchaToken": "recaptcha_token_string"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Thank you for contacting us! We'll get back to you soon."
}
```

**Error Response (400/500):**
```json
{
  "error": "Error message here"
}
```

## Next Steps

Once the contact form is receiving submissions:
1. Set up email notifications (e.g., using Supabase Functions + SendGrid/Resend)
2. Create an admin dashboard to manage submissions
3. Add auto-reply emails to users
4. Integrate with a CRM system
5. Set up analytics tracking for form submissions
