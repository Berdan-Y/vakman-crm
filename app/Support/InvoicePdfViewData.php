<?php

namespace App\Support;

use App\Models\Company;
use App\Models\Invoice;
use App\Models\Job;
use Carbon\CarbonInterface;

final class InvoicePdfViewData
{
    /**
     * @return array<string, mixed>
     */
    public static function make(Invoice $invoice): array
    {
        $invoice->loadMissing([
            'company',
            'job.customer',
            'job.employee',
            'job.company',
            'billingCustomer',
            'billingEmployee',
            'lines',
        ]);

        $job = $invoice->job;
        $company = $invoice->company ?? $job?->company;
        if (! $company instanceof Company) {
            throw new \RuntimeException('Invoice is missing company.');
        }

        $documentAt = $invoice->sent_at ?? $invoice->created_at;
        $documentCarbon = $documentAt instanceof CarbonInterface
            ? $documentAt->copy()
            : \Carbon\Carbon::parse($documentAt);

        $dueCarbon = $documentCarbon->copy()->addDays(14);
        $deliveryCarbon = $job?->date
            ? ($job->date instanceof CarbonInterface ? $job->date->copy() : \Carbon\Carbon::parse($job->date))
            : $documentCarbon->copy();

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
            'recipient_vat_number' => $invoice->recipient_vat_number,
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

        $scheduledTime = $job && $job->scheduled_time
            ? (is_string($job->scheduled_time)
                ? substr($job->scheduled_time, 0, 5)
                : $job->scheduled_time->format('H:i'))
            : null;

        $jobData = $job ? [
            'id' => $job->id,
            'description' => $job->description,
            'date' => $job->date->format('Y-m-d'),
            'scheduled_time' => $scheduledTime,
            'invoice_number' => $ref ?? $job->invoice_number,
        ] : [
            'id' => 0,
            'description' => null,
            'date' => $documentCarbon->format('Y-m-d'),
            'scheduled_time' => null,
            'invoice_number' => null,
        ];

        $customerData = self::billToPartyPayload($invoice, $job);
        $billToVat = self::billToVatNumber($invoice, $job);

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
            'job_attached' => $job !== null,
            'customer' => $customerData,
            'bill_to_vat_number' => $billToVat,
            'company' => $companyData,
            'company_name' => $company->name,
            'company_sender_line' => $companySenderLine,
            'document_date' => $documentCarbon->format('d-m-Y'),
            'due_date' => $dueCarbon->format('d-m-Y'),
            'delivery_date' => $deliveryCarbon->format('d-m-Y'),
            'payment_method_label' => __("invoice_pdf.{$paymentKey}"),
            'display_invoice_number' => $ref,
            'tax_rate_percent' => $taxRatePercent,
            'customer_address_lines' => self::customerAddressLines($invoice, $job),
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
     * @return array<string, mixed>|null
     */
    private static function billToPartyPayload(Invoice $invoice, ?Job $job): ?array
    {
        if ($invoice->type === Invoice::TYPE_CUSTOMER && $job?->customer) {
            $c = $job->customer;

            return [
                'name' => $c->name,
                'email' => $c->email,
                'phone' => $c->phone,
                'street' => $c->street,
                'house_number' => $c->house_number,
                'zip_code' => $c->zip_code,
                'city' => $c->city,
            ];
        }

        if ($invoice->type === Invoice::TYPE_EMPLOYEE && $job?->employee) {
            $e = $job->employee;

            return [
                'name' => $e->name,
                'email' => $e->email,
                'phone' => $e->phone,
                'street' => $e->street,
                'house_number' => $e->house_number,
                'zip_code' => $e->zip_code,
                'city' => $e->city,
            ];
        }

        if ($job === null && $invoice->type === Invoice::TYPE_CUSTOMER && $invoice->billingCustomer) {
            $c = $invoice->billingCustomer;

            return [
                'name' => $c->name,
                'email' => $c->email,
                'phone' => $c->phone,
                'street' => $c->street,
                'house_number' => $c->house_number,
                'zip_code' => $c->zip_code,
                'city' => $c->city,
            ];
        }

        if ($job === null && $invoice->type === Invoice::TYPE_EMPLOYEE && $invoice->billingEmployee) {
            $e = $invoice->billingEmployee;

            return [
                'name' => $e->name,
                'email' => $e->email,
                'phone' => $e->phone,
                'street' => $e->street,
                'house_number' => $e->house_number,
                'zip_code' => $e->zip_code,
                'city' => $e->city,
            ];
        }

        return null;
    }

    private static function billToVatNumber(Invoice $invoice, ?Job $job): ?string
    {
        if ($invoice->type === Invoice::TYPE_CUSTOMER && $job?->customer?->vat_number) {
            return $job->customer->vat_number;
        }

        if ($invoice->type === Invoice::TYPE_EMPLOYEE && $job?->employee?->vat_number) {
            return $job->employee->vat_number;
        }

        if ($job === null && $invoice->type === Invoice::TYPE_CUSTOMER && $invoice->billingCustomer?->vat_number) {
            return $invoice->billingCustomer->vat_number;
        }

        if ($job === null && $invoice->type === Invoice::TYPE_EMPLOYEE && $invoice->billingEmployee?->vat_number) {
            return $invoice->billingEmployee->vat_number;
        }

        return filled($invoice->recipient_vat_number) ? $invoice->recipient_vat_number : null;
    }

    /**
     * @return array<int, string>
     */
    private static function customerAddressLines(Invoice $invoice, ?Job $job): array
    {
        if ($invoice->type === Invoice::TYPE_CUSTOMER && $job?->customer) {
            $c = $job->customer;
            $street = trim(($c->street ?? '').' '.($c->house_number ?? ''));
            $line2 = trim(implode(' ', array_filter([$c->zip_code, $c->city])));
            $lines = array_values(array_filter([$street, $line2]));

            return $lines !== [] ? $lines : [$invoice->recipient_name];
        }

        if ($invoice->type === Invoice::TYPE_EMPLOYEE && $job?->employee) {
            $e = $job->employee;
            $street = trim(($e->street ?? '').' '.($e->house_number ?? ''));
            $line2 = trim(implode(' ', array_filter([$e->zip_code, $e->city])));
            $lines = array_values(array_filter([$street, $line2]));

            return $lines !== [] ? $lines : [$invoice->recipient_name];
        }

        if ($job === null && $invoice->type === Invoice::TYPE_CUSTOMER && $invoice->billingCustomer) {
            $c = $invoice->billingCustomer;
            $street = trim(($c->street ?? '').' '.($c->house_number ?? ''));
            $line2 = trim(implode(' ', array_filter([$c->zip_code, $c->city])));
            $lines = array_values(array_filter([$street, $line2]));

            return $lines !== [] ? $lines : [$invoice->recipient_name];
        }

        if ($job === null && $invoice->type === Invoice::TYPE_EMPLOYEE && $invoice->billingEmployee) {
            $e = $invoice->billingEmployee;
            $street = trim(($e->street ?? '').' '.($e->house_number ?? ''));
            $line2 = trim(implode(' ', array_filter([$e->zip_code, $e->city])));
            $lines = array_values(array_filter([$street, $line2]));

            return $lines !== [] ? $lines : [$invoice->recipient_name];
        }

        return array_values(array_filter([$invoice->recipient_name]));
    }
}
