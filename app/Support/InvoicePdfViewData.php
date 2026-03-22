<?php

namespace App\Support;

use App\Models\Company;
use App\Models\Customer;
use App\Models\Invoice;
use Carbon\CarbonInterface;

final class InvoicePdfViewData
{
    /**
     * @return array<string, mixed>
     */
    public static function make(Invoice $invoice): array
    {
        $invoice->loadMissing('job.customer', 'job.company', 'lines');

        $company = $invoice->job->company;
        $job = $invoice->job;
        $customer = $invoice->job->customer;

        $documentAt = $invoice->sent_at ?? $invoice->created_at;
        $documentCarbon = $documentAt instanceof CarbonInterface
            ? $documentAt->copy()
            : \Carbon\Carbon::parse($documentAt);

        $dueCarbon = $documentCarbon->copy()->addDays(14);
        $deliveryCarbon = $job->date instanceof CarbonInterface
            ? $job->date->copy()
            : \Carbon\Carbon::parse($job->date);

        $ref = $invoice->invoice_number;

        $companySenderLine = self::formatCompanySenderLine($company);

        $paymentKey = match ($invoice->payment_method) {
            Invoice::PAYMENT_CARD => 'payment_card',
            Invoice::PAYMENT_CASH => 'payment_cash',
            default => 'payment_card',
        };

        $subtotal = $invoice->subtotal !== null ? (float) $invoice->subtotal : null;
        $taxAmount = $invoice->tax_amount !== null ? (float) $invoice->tax_amount : null;
        $totalInclTax = $invoice->total_incl_tax !== null ? (float) $invoice->total_incl_tax : null;

        $taxRatePercent = 21;
        if ($subtotal !== null && $subtotal > 0.00001 && $taxAmount !== null) {
            $taxRatePercent = (int) round($taxAmount / $subtotal * 100);
        }

        $invoiceData = [
            'id' => $invoice->id,
            'type' => $invoice->type,
            'payment_method' => $invoice->payment_method,
            'invoice_number' => $invoice->invoice_number,
            'recipient_name' => $invoice->recipient_name,
            'recipient_email' => $invoice->recipient_email,
            'amount' => (float) $invoice->amount,
            'subtotal' => $subtotal,
            'tax_amount' => $taxAmount,
            'total_incl_tax' => $totalInclTax,
            'status' => $invoice->status,
            'created_at' => $invoice->created_at->toIso8601String(),
            'sent_at' => $invoice->sent_at?->toIso8601String(),
        ];

        $invoiceLines = $invoice->lines->map(fn ($line) => [
            'id' => $line->id,
            'description' => $line->description,
            'quantity' => (float) $line->quantity,
            'unit_price' => (float) $line->unit_price,
            'total' => (float) $line->total,
        ])->values()->all();

        $scheduledTime = $job->scheduled_time
            ? (is_string($job->scheduled_time)
                ? substr($job->scheduled_time, 0, 5)
                : $job->scheduled_time->format('H:i'))
            : null;

        $jobData = [
            'id' => $job->id,
            'description' => $job->description,
            'date' => $job->date->format('Y-m-d'),
            'scheduled_time' => $scheduledTime,
            'invoice_number' => $ref ?? $job->invoice_number,
        ];

        $customerData = $customer ? [
            'name' => $customer->name,
            'email' => $customer->email,
            'phone' => $customer->phone,
            'street' => $customer->street,
            'house_number' => $customer->house_number,
            'zip_code' => $customer->zip_code,
            'city' => $customer->city,
        ] : null;

        $companyData = [
            'name' => $company->name,
            'street_address' => $company->street_address,
            'postal_code' => $company->postal_code,
            'city' => $company->city,
            'country' => $company->country,
            'tax_number' => $company->tax_number,
            'kvk_number' => $company->kvk_number,
            'email' => $company->email,
            'account_holder' => $company->account_holder,
            'bank_name' => $company->bank_name,
            'bank_account_number' => $company->bank_account_number,
        ];

        return [
            'invoice' => $invoiceData,
            'invoice_lines' => $invoiceLines,
            'job' => $jobData,
            'customer' => $customerData,
            'company' => $companyData,
            'company_name' => $company->name,
            'company_sender_line' => $companySenderLine,
            'document_date' => $documentCarbon->format('d-m-Y'),
            'due_date' => $dueCarbon->format('d-m-Y'),
            'delivery_date' => $deliveryCarbon->format('d-m-Y'),
            'payment_method_label' => __("invoice_pdf.{$paymentKey}"),
            'display_invoice_number' => $ref,
            'tax_rate_percent' => $taxRatePercent,
            'customer_address_lines' => self::customerAddressLines($customer, $invoice),
        ];
    }

    private static function formatCompanySenderLine(Company $company): string
    {
        $parts = collect([
            $company->name,
            $company->street_address,
            trim(implode(' ', array_filter([$company->postal_code, $company->city]))),
            $company->country,
        ])->filter(fn ($v) => $v !== null && $v !== '')->all();

        return implode(', ', $parts);
    }

    /**
     * @return array<int, string>
     */
    private static function customerAddressLines(?Customer $customer, Invoice $invoice): array
    {
        if ($customer) {
            $street = trim(($customer->street ?? '').' '.($customer->house_number ?? ''));
            $line2 = trim(implode(' ', array_filter([$customer->zip_code, $customer->city])));
            $lines = array_values(array_filter([$street, $line2]));

            return $lines !== [] ? $lines : [$invoice->recipient_name];
        }

        return array_values(array_filter([$invoice->recipient_name]));
    }
}
