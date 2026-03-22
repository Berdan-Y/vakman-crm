<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <title>{{ __('invoice_pdf.title') }} #{{ $invoice['id'] }}</title>
    <style>
        @font-face {
            font-family: 'Instrument Sans';
            font-style: normal;
            font-weight: 400 600;
            font-display: swap;
            src: url('fonts/InstrumentSans-Variable.ttf') format('truetype');
        }
        body {
            font-family: 'Instrument Sans', DejaVu Sans, sans-serif;
            font-size: 11px;
            color: #111827;
            line-height: 1.45;
            margin: 0;
            padding: 28px 32px 40px;
        }
        /* DomPDF: table cells do not always inherit font; 600 often falls back when the variable font has no 600 face */
        .doc,
        .doc table,
        .doc th,
        .doc td,
        .doc p,
        .doc h1 {
            font-family: 'Instrument Sans', DejaVu Sans, sans-serif;
        }
        .doc { max-width: 720px; margin: 0 auto; }
        .title {
            font-size: 26px;
            font-weight: 700;
            letter-spacing: 0.02em;
            margin: 0 0 6px 0;
            text-transform: uppercase;
        }
        .sender-line {
            font-size: 11px;
            color: #6b7280;
            margin: 0 0 28px 0;
            max-width: 90%;
        }
        .cols { width: 100%; border-collapse: collapse; margin-bottom: 22px; }
        .cols td { vertical-align: top; padding: 0; }
        .col-left { width: 52%; padding-right: 16px; }
        .col-right { width: 48%; }
        .klant-label {
            font-size: 11px;
            font-weight: 700;
            margin: 0 0 8px 0;
        }
        .klant-name { font-weight: 700; margin: 0 0 4px 0; font-size: 12px; }
        .klant-line { margin: 0; color: #374151; font-size: 11px; }
        .meta-table { width: 100%; border-collapse: collapse; font-size: 11px; }
        .meta-table td { padding: 3px 0; vertical-align: top; }
        .meta-label { color: #374151; width: 42%; }
        .meta-value { font-weight: 700; text-align: right; }
        .lines-table {
            width: 100%;
            border-collapse: collapse;
            margin: 8px 0 20px;
            font-size: 10px;
        }
        .lines-table thead th {
            background: #e5e7eb;
            color: #374151;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.03em;
            padding: 8px 6px;
            border: 1px solid #d1d5db;
        }
        .lines-table th.desc { text-align: left; }
        .lines-table th.num { text-align: center; width: 8%; }
        .lines-table th.price, .lines-table th.disc, .lines-table th.amt { text-align: right; }
        .lines-table th.price { width: 14%; }
        .lines-table th.disc { width: 11%; }
        .lines-table th.amt { width: 15%; }
        .lines-table th.datecol { text-align: center; width: 18%; }
        .lines-table th.amt-only { text-align: right; width: 22%; }
        .lines-table td {
            padding: 10px 6px;
            border-bottom: 1px solid #e5e7eb;
            vertical-align: top;
        }
        .lines-table td.desc { text-align: left; }
        .lines-table td.num { text-align: center; }
        .lines-table td.price, .lines-table td.disc, .lines-table td.amt { text-align: right; }
        .totals-wrap { width: 100%; margin-top: 4px; }
        .totals-inner {
            float: right;
            width: 58%;
            border: 1px solid #d1d5db;
            border-collapse: collapse;
        }
        .totals-inner td {
            padding: 8px 12px;
            font-size: 11px;
            border-bottom: 1px solid #e5e7eb;
        }
        .totals-inner td.lbl { color: #374151; text-align: left; }
        .totals-inner td.val { font-weight: 700; text-align: right; white-space: nowrap; }
        .totals-inner tr.due td {
            background: #1d4ed8;
            color: #fff;
            font-weight: 700;
            border-bottom: none;
        }
        .clear { clear: both; }
        .footer {
            margin-top: 36px;
            padding-top: 16px;
            border-top: 1px solid #d1d5db;
            font-size: 9px;
            color: #4b5563;
            line-height: 1.55;
        }
        .footer-block { margin-bottom: 6px; }
    </style>
</head>
<body>
@php
    $euro = static function (float $n): string {
        return '€ '.number_format($n, 2, ',', '.');
    };
    $hasLines = !empty($invoice_lines);
    $subtotal = $invoice['subtotal'] ?? null;
    $taxAmount = $invoice['tax_amount'] ?? null;
    $totalIncl = $invoice['total_incl_tax'] ?? null;
    $showTaxBlock = $subtotal !== null && $taxAmount !== null && $totalIncl !== null;
    $refDisplay = $display_invoice_number ?? $invoice['invoice_number'] ?? null;
    $factuurNr = $refDisplay !== null && $refDisplay !== '' ? $refDisplay : __('invoice_pdf.no_number');
    $baseForVat = $showTaxBlock ? $euro((float) $subtotal) : '';
@endphp
<div class="doc">
    <h1 class="title">{{ __('invoice_pdf.title') }}</h1>
    @if(!empty($company_sender_line))
        <p class="sender-line">{{ $company_sender_line }}</p>
    @endif

    <table class="cols">
        <tr>
            <td class="col-left">
                <p class="klant-label">{{ __('invoice_pdf.customer_label') }}</p>
                <p class="klant-name">{{ $invoice['recipient_name'] }}</p>
                @foreach($customer_address_lines as $line)
                    <p class="klant-line">{{ $line }}</p>
                @endforeach
            </td>
            <td class="col-right">
                <table class="meta-table">
                    <tr>
                        <td class="meta-label">{{ __('invoice_pdf.invoice_number') }}</td>
                        <td class="meta-value">{{ $factuurNr }}</td>
                    </tr>
                    <tr>
                        <td class="meta-label">{{ __('invoice_pdf.date') }}</td>
                        <td class="meta-value">{{ $document_date }}</td>
                    </tr>
                    <tr>
                        <td class="meta-label">{{ __('invoice_pdf.due_date') }}</td>
                        <td class="meta-value">{{ $due_date }}</td>
                    </tr>
                    <tr><td colspan="2" style="height:8px;"></td></tr>
                    <tr>
                        <td class="meta-label">{{ __('invoice_pdf.delivery_date') }}</td>
                        <td class="meta-value">{{ $delivery_date }}</td>
                    </tr>
                    <tr>
                        <td class="meta-label">{{ __('invoice_pdf.payment_method') }}</td>
                        <td class="meta-value">{{ $payment_method_label }}</td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>

    <table class="lines-table">
        <thead>
            <tr>
                <th class="desc">{{ __('invoice_pdf.table_description') }}</th>
                @if($hasLines)
                    <th class="num">{{ __('invoice_pdf.table_qty') }}</th>
                    <th class="price">{{ __('invoice_pdf.table_price') }}</th>
                    <th class="disc">{{ __('invoice_pdf.table_discount') }}</th>
                    <th class="amt">{{ __('invoice_pdf.table_amount') }}</th>
                @else
                    <th class="datecol">{{ __('invoice_pdf.table_date') }}</th>
                    <th class="amt-only">{{ __('invoice_pdf.table_amount') }}</th>
                @endif
            </tr>
        </thead>
        <tbody>
            @if($hasLines)
                @foreach($invoice_lines as $line)
                    <tr>
                        <td class="desc">{{ $line['description'] }}</td>
                        <td class="num">{{ rtrim(rtrim(number_format((float) $line['quantity'], 2, ',', ''), '0'), ',') }}</td>
                        <td class="price">{{ $euro((float) $line['unit_price']) }}</td>
                        <td class="disc">0,00</td>
                        <td class="amt">{{ $euro((float) $line['total']) }}</td>
                    </tr>
                @endforeach
            @else
                <tr>
                    <td class="desc">
                        {{ __('invoice_pdf.job_line', ['id' => $job['id']]) }}
                        @if(!empty($job['description']))
                            <span style="display:block;color:#6b7280;font-size:9px;margin-top:2px;">{{ $job['description'] }}</span>
                        @endif
                    </td>
                    <td class="num">
                        {{ \Carbon\Carbon::parse($job['date'])->format('d-m-Y') }}
                        @if(!empty($job['scheduled_time']))
                            <span style="display:block;color:#6b7280;font-size:9px;">{{ $job['scheduled_time'] }}</span>
                        @endif
                    </td>
                    <td class="amt">{{ $euro((float) $invoice['amount']) }}</td>
                </tr>
            @endif
        </tbody>
    </table>

    @if($showTaxBlock)
        <div class="totals-wrap">
            <table class="totals-inner">
                <tr>
                    <td class="lbl">{{ __('invoice_pdf.total_excl') }}:</td>
                    <td class="val">{{ $euro((float) $subtotal) }}</td>
                </tr>
                <tr>
                    <td class="lbl">{{ __('invoice_pdf.vat_line', ['rate' => $tax_rate_percent, 'base' => $baseForVat]) }}</td>
                    <td class="val">{{ $euro((float) $taxAmount) }}</td>
                </tr>
                <tr>
                    <td class="lbl">{{ __('invoice_pdf.total_incl') }}:</td>
                    <td class="val">{{ $euro((float) $totalIncl) }}</td>
                </tr>
                <tr class="due">
                    <td class="lbl">{{ __('invoice_pdf.amount_due') }}</td>
                    <td class="val">{{ $euro((float) $totalIncl) }}</td>
                </tr>
            </table>
            <div class="clear"></div>
        </div>
    @else
        <div class="totals-wrap">
            <table class="totals-inner">
                <tr class="due">
                    <td class="lbl">{{ __('invoice_pdf.amount_due') }}</td>
                    <td class="val">{{ $euro((float) $invoice['amount']) }}</td>
                </tr>
            </table>
            <div class="clear"></div>
        </div>
    @endif

    <div class="footer">
        @php
            $c = $company;
            $addr = collect([$c['name'], $c['street_address'], trim(implode(' ', array_filter([$c['postal_code'] ?? null, $c['city'] ?? null]))), $c['country'] ?? null])->filter(fn ($v) => $v !== null && $v !== '')->implode(', ');
        @endphp
        @if($addr !== '')
            <div class="footer-block">{{ $addr }}</div>
        @endif
        @php
            $idBits = [];
            if (!empty($c['tax_number'])) {
                $idBits[] = __('invoice_pdf.footer_tax').': '.$c['tax_number'];
            }
            if (!empty($c['kvk_number'])) {
                $idBits[] = __('invoice_pdf.footer_kvk').': '.$c['kvk_number'];
            }
        @endphp
        @if(!empty($idBits))
            <div class="footer-block">{{ implode(' | ', $idBits) }}</div>
        @endif
        @if(!empty($c['email']))
            <div class="footer-block">{{ __('invoice_pdf.footer_email') }}: {{ $c['email'] }}</div>
        @endif
        @php
            $bankBits = [];
            if (!empty($c['account_holder'])) {
                $bankBits[] = __('invoice_pdf.footer_account_holder').': '.$c['account_holder'];
            }
            if (!empty($c['bank_name'])) {
                $bankBits[] = __('invoice_pdf.footer_bank').': '.$c['bank_name'];
            }
            if (!empty($c['bank_account_number'])) {
                $bankBits[] = __('invoice_pdf.footer_account').': '.$c['bank_account_number'];
            }
        @endphp
        @if(!empty($bankBits))
            <div class="footer-block">{{ implode(' | ', $bankBits) }}</div>
        @endif
    </div>
</div>
</body>
</html>
