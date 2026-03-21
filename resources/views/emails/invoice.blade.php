<!DOCTYPE html>
<html lang="{{ app()->getLocale() }}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ __('mail.invoice.subject', ['company' => config('app.name')]) }}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background-color: #4F46E5;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 5px 5px 0 0;
        }
        .content {
            background-color: #f9f9f9;
            padding: 30px;
            border: 1px solid #ddd;
            border-top: none;
        }
        .amount {
            font-size: 24px;
            font-weight: bold;
            color: #4F46E5;
            margin: 20px 0;
        }
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            text-align: center;
            color: #666;
            font-size: 12px;
        }
        .button {
            display: inline-block;
            background-color: #4F46E5;
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>{{ $type === 'customer' ? __('mail.invoice.title_customer') : __('mail.invoice.title_employee') }}</h1>
    </div>
    
    <div class="content">
        <p>{{ __('mail.invoice.dear', ['name' => $recipientName]) }}</p>
        
        @if($type === 'customer')
            <p>{{ __('mail.invoice.thank_you_business') }}</p>
            <div class="amount">
                {{ __('mail.invoice.amount_due') }}: {{ number_format($amount, 2) }} EUR
            </div>
            <p>{{ __('mail.invoice.review_invoice') }}</p>
            <p>{{ __('mail.invoice.questions', ['type' => strtolower(__('mail.invoice.title_customer'))]) }}</p>
        @else
            <p>{{ __('mail.invoice.thank_you_work') }}</p>
            <div class="amount">
                {{ __('mail.invoice.payment_amount') }}: {{ number_format($amount, 2) }} EUR
            </div>
            <p>{{ __('mail.invoice.payment_details') }}</p>
            <p>{{ __('mail.invoice.questions', ['type' => strtolower(__('mail.invoice.title_employee'))]) }}</p>
        @endif
        
        <p>{{ __('mail.regards') }}<br>
        {{ config('app.name') }}</p>
    </div>
    
    <div class="footer">
        <p>{{ __('mail.invoice.automated') }}</p>
        <p>&copy; {{ date('Y') }} {{ config('app.name') }}. {{ __('mail.invoice.rights') }}</p>
    </div>
</body>
</html>
