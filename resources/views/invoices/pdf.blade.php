<!DOCTYPE html>
<html lang="nl">
<head>
    <meta charset="utf-8">
    <title>Invoice #{{ $invoice['id'] }}</title>
    <style>
        @font-face {
            font-family: 'Instrument Sans';
            font-style: normal;
            font-weight: 400 600;
            font-display: swap;
            src: url('fonts/InstrumentSans-Variable.ttf') format('truetype');
        }
        body { font-family: 'Instrument Sans', DejaVu Sans, sans-serif; font-size: 14px; color: #111827; line-height: 1.4; margin: 0; padding: 32px; }
        .doc { max-width: 42rem; margin: 0 auto; }
        .header { display: table; width: 100%; margin-bottom: 32px; padding-bottom: 24px; border-bottom: 1px solid #e5e7eb; }
        .header-left { display: table-cell; vertical-align: top; }
        .header-right { display: table-cell; vertical-align: top; text-align: right; }
        .company { font-size: 20px; font-weight: 600; color: #111827; margin: 0 0 4px 0; }
        .subtitle { font-size: 14px; color: #6b7280; margin: 0; }
        .inv-num { font-weight: 500; margin: 0; }
        .inv-meta { font-size: 14px; color: #374151; margin: 4px 0 0 0; }
        .inv-date { margin-top: 4px; }
        .grid { margin-bottom: 32px; }
        .section-label { font-size: 11px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; margin: 0 0 4px 0; }
        .section-value { font-weight: 500; color: #111827; margin: 0; }
        .section-value-sm { font-size: 14px; color: #4b5563; margin: 0; }
        .address-block { margin-bottom: 24px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 32px; font-size: 14px; }
        th { text-align: left; font-weight: 500; color: #374151; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
        th.amount { text-align: right; }
        td { padding: 12px 0; border-bottom: 1px solid #e5e7eb; color: #111827; }
        td.amount { text-align: right; font-weight: 500; }
        .job-desc { font-size: 12px; color: #6b7280; display: block; margin-top: 2px; }
        .job-time { font-size: 12px; color: #6b7280; display: block; margin-top: 2px; }
        .footer { display: table; width: 100%; padding-top: 24px; border-top: 1px solid #e5e7eb; }
        .footer-left { display: table-cell; vertical-align: middle; font-size: 14px; color: #4b5563; }
        .footer-right { display: table-cell; vertical-align: middle; text-align: right; font-size: 20px; font-weight: 600; color: #111827; }
        .status-draft { color: #374151; }
        .status-sent { color: #1d4ed8; font-weight: 500; }
        .status-paid { color: #15803d; font-weight: 500; }
    </style>
</head>
<body>
    <div class="doc">
        <div class="header">
            <div class="header-left">
                <h1 class="company">{{ $company_name }}</h1>
                <p class="subtitle">{{ $invoice['type'] === 'customer' ? 'Customer invoice' : 'Employee invoice' }}</p>
            </div>
            <div class="header-right">
                <p class="inv-num">Invoice #{{ $invoice['id'] }}</p>
                @if(!empty($job['invoice_number']))
                    <p class="inv-meta">Ref: {{ $job['invoice_number'] }}</p>
                @endif
                <p class="inv-meta inv-date">Date: {{ $invoice_date }}</p>
                @if($invoice['status'] !== 'draft' && !empty($invoice['sent_at']))
                    <p class="inv-meta" style="font-size: 12px;">Sent: {{ $sent_at }}</p>
                @endif
            </div>
        </div>

        <div class="grid">
            <div class="address-block">
                <p class="section-label">Bill to</p>
                <p class="section-value">{{ $invoice['recipient_name'] }}</p>
                <p class="section-value-sm">{{ $invoice['recipient_email'] }}</p>
            </div>
            @if($customer)
                <div class="address-block">
                    <p class="section-label">Service address</p>
                    <p class="section-value-sm">{{ $address_line }}</p>
                    @if(!empty($customer['phone']))
                        <p class="section-value-sm" style="margin-top: 4px;">{{ $customer['phone'] }}</p>
                    @endif
                </div>
            @endif
        </div>

        <table>
            <thead>
                <tr>
                    <th>Description</th>
                    @if(!empty($invoice_lines))
                        <th class="amount">Quantity</th>
                        <th class="amount">Unit price</th>
                    @else
                        <th class="amount">Date</th>
                    @endif
                    <th class="amount">Amount</th>
                </tr>
            </thead>
            <tbody>
                @if(!empty($invoice_lines))
                    @foreach($invoice_lines as $line)
                        <tr>
                            <td>{{ $line['description'] }}</td>
                            <td class="amount">{{ $line['quantity'] }}</td>
                            <td class="amount">€ {{ number_format($line['unit_price'], 2, ',', ' ') }}</td>
                            <td class="amount">€ {{ number_format($line['total'], 2, ',', ' ') }}</td>
                        </tr>
                    @endforeach
                @else
                    <tr>
                        <td>
                            Job #{{ $job['id'] }}
                            @if(!empty($job['description']))
                                <span class="job-desc">{{ $job['description'] }}</span>
                            @endif
                        </td>
                        <td class="amount">
                            {{ $job['date'] }}
                            @if(!empty($job['scheduled_time']))
                                <span class="job-time">{{ $job['scheduled_time'] }}</span>
                            @endif
                        </td>
                        <td class="amount">{{ $amount_formatted }}</td>
                    </tr>
                @endif
            </tbody>
        </table>

        @if(!empty($invoice['subtotal']) && !empty($invoice['tax_amount']))
            <div style="margin-bottom: 32px; display: table; width: 100%;">
                <div style="display: table-row;">
                    <div style="display: table-cell; width: 60%;"></div>
                    <div style="display: table-cell; text-align: right; padding: 8px 0; font-size: 14px; color: #6b7280;">
                        Subtotal (excl. tax):
                    </div>
                    <div style="display: table-cell; text-align: right; padding: 8px 0; font-size: 14px; font-weight: 500; padding-left: 24px;">
                        € {{ number_format($invoice['subtotal'], 2, ',', ' ') }}
                    </div>
                </div>
                <div style="display: table-row;">
                    <div style="display: table-cell; width: 60%;"></div>
                    <div style="display: table-cell; text-align: right; padding: 8px 0; font-size: 14px; color: #6b7280;">
                        Tax (21%):
                    </div>
                    <div style="display: table-cell; text-align: right; padding: 8px 0; font-size: 14px; font-weight: 500; padding-left: 24px;">
                        € {{ number_format($invoice['tax_amount'], 2, ',', ' ') }}
                    </div>
                </div>
            </div>
        @endif

        <div class="footer">
            <div class="footer-left">
                Status: <span class="status-{{ $invoice['status'] }}">{{ ucfirst($invoice['status']) }}</span>
            </div>
            <div class="footer-right">
                Total (incl. tax): 
                @if(!empty($invoice['total_incl_tax']))
                    € {{ number_format($invoice['total_incl_tax'], 2, ',', ' ') }}
                @else
                    {{ $amount_formatted }}
                @endif
            </div>
        </div>
    </div>
</body>
</html>
