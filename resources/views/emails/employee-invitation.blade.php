<!DOCTYPE html>
<html lang="{{ app()->getLocale() }}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ __('mail.invitation.subject', ['company' => $companyName]) }}</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background-color: #f4f4f4; padding: 20px; border-radius: 10px;">
        <h2 style="color: #2563eb;">{{ __('mail.welcome', ['company' => $companyName]) }}</h2>
        
        <p>{{ __('mail.greeting', ['name' => $employee->name]) }}</p>
        
        <p>{{ __('mail.invitation.invited', ['company' => $companyName]) }} {{ __('mail.invitation.get_started') }}</p>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="{{ $invitationUrl }}" 
               style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                {{ __('mail.invitation.setup_account') }}
            </a>
        </div>
        
        <p>{{ __('mail.invitation.copy_link') }}</p>
        <p style="background-color: #e5e7eb; padding: 10px; border-radius: 5px; word-break: break-all;">
            {{ $invitationUrl }}
        </p>
        
        <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
            {{ __('mail.invitation.expires') }} {{ __('mail.invitation.ignore') }}
        </p>
    </div>
</body>
</html>
