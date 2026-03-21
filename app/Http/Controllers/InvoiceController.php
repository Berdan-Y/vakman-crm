<?php

namespace App\Http\Controllers;

use App\Mail\InvoiceMail;
use App\Models\Invoice;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;
use Inertia\Response;

class InvoiceController extends Controller
{
    public function show(Request $request, Invoice $invoice): Response
    {
        $payload = $this->getInvoicePayload($invoice);
        if (! $payload) {
            abort(404);
        }

        return Inertia::render('invoices/show', $payload);
    }

    /**
     * Return JSON payload for invoice PDF preview (e.g. in a modal).
     */
    public function preview(Request $request, Invoice $invoice): \Illuminate\Http\JsonResponse
    {
        $payload = $this->getInvoicePayload($invoice);
        if (! $payload) {
            abort(404);
        }

        return response()->json($payload);
    }

    /**
     * Stream the invoice as a PDF (no browser headers/footers like date or title).
     */
    public function pdf(Request $request, Invoice $invoice): \Illuminate\Http\Response
    {
        $payload = $this->getInvoicePayload($invoice);
        if (! $payload) {
            abort(404);
        }

        $invoiceData = $payload['invoice'];
        $invoiceLines = $payload['invoice_lines'] ?? [];
        $job = $payload['job'];
        $customer = $payload['customer'];
        $companyName = $payload['company_name'];

        $invoiceDate = \Carbon\Carbon::parse($invoiceData['created_at'])->locale('nl_NL')->translatedFormat('j F Y');
        $sentAt = $invoiceData['sent_at']
            ? \Carbon\Carbon::parse($invoiceData['sent_at'])->locale('nl_NL')->translatedFormat('j F Y')
            : null;

        $streetHouseNumber = $customer['street'].' '.$customer['house_number'];
        if ($customer['house_number_addition']) {
            $streetHouseNumber .= ' '.$customer['house_number_addition'];
        }

        $addressLine = implode(', ', array_filter([
            $streetHouseNumber,
            $customer['zip_code'] ?? null,
            $customer['city'] ?? null,
        ]));
        $amountFormatted = '€ '.number_format((float) $invoiceData['amount'], 2, ',', ' ');

        $pdf = Pdf::loadView('invoices.pdf', [
            'invoice' => $invoiceData,
            'invoice_lines' => $invoiceLines,
            'job' => $job,
            'customer' => $customer,
            'company_name' => $companyName,
            'invoice_date' => $invoiceDate,
            'sent_at' => $sentAt,
            'address_line' => $addressLine,
            'amount_formatted' => $amountFormatted,
        ])
            ->setBasePath(public_path());

        return $pdf->stream('invoice-'.$invoice->id.'.pdf', ['Attachment' => false]);
    }

    /**
     * @return array<string, mixed>|null
     */
    private function getInvoicePayload(Invoice $invoice): ?array
    {
        $companyId = session('current_company_id');
        $invoice->load('job.customer', 'job.company', 'lines');
        if ($invoice->job->company_id !== $companyId) {
            return null;
        }

        $companyName = $invoice->job->company->name ?? config('app.name');

        return [
            'invoice' => [
                'id' => $invoice->id,
                'type' => $invoice->type,
                'recipient_name' => $invoice->recipient_name,
                'recipient_email' => $invoice->recipient_email,
                'amount' => (float) $invoice->amount,
                'status' => $invoice->status,
                'created_at' => $invoice->created_at->toIso8601String(),
                'sent_at' => $invoice->sent_at?->toIso8601String(),
            ],
            'invoice_lines' => $invoice->lines->map(fn ($line) => [
                'id' => $line->id,
                'description' => $line->description,
                'quantity' => (float) $line->quantity,
                'unit_price' => (float) $line->unit_price,
                'total' => (float) $line->total,
            ])->toArray(),
            'job' => [
                'id' => $invoice->job->id,
                'description' => $invoice->job->description,
                'date' => $invoice->job->date->format('Y-m-d'),
                'scheduled_time' => $invoice->job->scheduled_time
                    ? (is_string($invoice->job->scheduled_time)
                        ? substr($invoice->job->scheduled_time, 0, 5)
                        : $invoice->job->scheduled_time->format('H:i'))
                    : null,
                'invoice_number' => $invoice->job->invoice_number,
            ],
            'customer' => $invoice->job->customer ? [
                'name' => $invoice->job->customer->name,
                'email' => $invoice->job->customer->email,
                'phone' => $invoice->job->customer->phone,
                'street' => $invoice->job->customer->street,
                'house_number' => $invoice->job->customer->house_number,
                'zip_code' => $invoice->job->customer->zip_code,
                'city' => $invoice->job->customer->city,
            ] : null,
            'company_name' => $companyName,
        ];
    }

    private function generatePdfContent(Invoice $invoice): string
    {
        $payload = $this->getInvoicePayload($invoice);
        if (! $payload) {
            abort(404);
        }

        $invoiceData = $payload['invoice'];
        $invoiceLines = $payload['invoice_lines'] ?? [];
        $job = $payload['job'];
        $customer = $payload['customer'];
        $companyName = $payload['company_name'];

        $invoiceDate = \Carbon\Carbon::parse($invoiceData['created_at'])->locale('nl_NL')->translatedFormat('j F Y');
        $sentAt = $invoiceData['sent_at']
            ? \Carbon\Carbon::parse($invoiceData['sent_at'])->locale('nl_NL')->translatedFormat('j F Y')
            : null;

        $streetHouseNumber = $customer['street'].' '.$customer['house_number'];
        if ($customer['house_number_addition'] ?? null) {
            $streetHouseNumber .= ' '.$customer['house_number_addition'];
        }

        $addressLine = implode(', ', array_filter([
            $streetHouseNumber,
            $customer['zip_code'] ?? null,
            $customer['city'] ?? null,
        ]));
        $amountFormatted = '€ '.number_format((float) $invoiceData['amount'], 2, ',', ' ');

        $pdf = Pdf::loadView('invoices.pdf', [
            'invoice' => $invoiceData,
            'invoice_lines' => $invoiceLines,
            'job' => $job,
            'customer' => $customer,
            'company_name' => $companyName,
            'invoice_date' => $invoiceDate,
            'sent_at' => $sentAt,
            'address_line' => $addressLine,
            'amount_formatted' => $amountFormatted,
        ])
            ->setBasePath(public_path());

        return $pdf->output();
    }

    private function sendInvoiceEmail(Invoice $invoice): void
    {
        Mail::to($invoice->recipient_email)
            ->send(new InvoiceMail($invoice));
    }

    public function send(Request $request, Invoice $invoice): RedirectResponse
    {
        $companyId = session('current_company_id');
        if ($invoice->job->company_id !== $companyId) {
            abort(404);
        }

        if ($invoice->status === Invoice::STATUS_PAID) {
            return redirect()->back()
                ->with('error', __('Cannot send an invoice that is already paid.'));
        }

        try {
            $this->sendInvoiceEmail($invoice);

            $invoice->update([
                'status' => Invoice::STATUS_SENT,
                'sent_at' => now(),
            ]);

            return redirect()->back()
                ->with('success', __('Invoice sent successfully to '.$invoice->recipient_email));
        } catch (\Exception $e) {
            \Log::error('Failed to send invoice email: '.$e->getMessage());

            return redirect()->back()
                ->with('error', __('Failed to send invoice. Please check your mail configuration.'));
        }
    }

    public function store(Request $request): RedirectResponse
    {
        $job = \App\Models\Job::findOrFail($request->input('job_id'));
        $companyId = session('current_company_id');
        if ($job->company_id !== $companyId) {
            abort(404);
        }

        $validated = $request->validate([
            'job_id' => ['required', 'exists:crm_jobs,id'],
            'type' => ['required', 'in:customer,employee'],
            'recipient_name' => ['required', 'string', 'max:255'],
            'recipient_email' => ['required', 'email', 'max:255'],
            'amount' => ['required', 'numeric', 'min:0'],
            'send' => ['boolean'],
            'price_includes_tax' => ['boolean'],
            'lines' => ['required', 'array', 'min:1'],
            'lines.*.description' => ['required', 'string', 'max:500'],
            'lines.*.quantity' => ['required', 'numeric', 'min:0.01'],
            'lines.*.unit_price' => ['required', 'numeric', 'min:0'],
            'lines.*.total' => ['required', 'numeric', 'min:0'],
        ]);

        $send = ! empty($validated['send']);
        $priceIncludesTax = ! empty($validated['price_includes_tax']);
        $taxRate = 21.00;

        // Calculate tax fields
        $subtotal = 0;
        foreach ($validated['lines'] as $line) {
            $subtotal += $line['total'];
        }

        if ($priceIncludesTax) {
            // If prices include tax, we need to extract the tax
            $actualSubtotal = $subtotal / 1.21;
            $taxAmount = $subtotal - $actualSubtotal;
            $totalInclTax = $subtotal;
        } else {
            // If prices don't include tax, we need to add the tax
            $actualSubtotal = $subtotal;
            $taxAmount = $subtotal * 0.21;
            $totalInclTax = $subtotal + $taxAmount;
        }

        $invoice = Invoice::create([
            'crm_job_id' => $job->id,
            'type' => $validated['type'],
            'recipient_name' => $validated['recipient_name'],
            'recipient_email' => $validated['recipient_email'],
            'amount' => $validated['amount'],
            'subtotal' => round($actualSubtotal, 2),
            'tax_amount' => round($taxAmount, 2),
            'total_incl_tax' => round($totalInclTax, 2),
            'status' => $send ? Invoice::STATUS_SENT : Invoice::STATUS_DRAFT,
            'sent_at' => $send ? now() : null,
        ]);

        foreach ($validated['lines'] as $index => $line) {
            $lineTotal = $line['total'];

            if ($priceIncludesTax) {
                $lineTaxAmount = $lineTotal - ($lineTotal / 1.21);
            } else {
                $lineTaxAmount = $lineTotal * 0.21;
            }

            \App\Models\InvoiceLine::create([
                'invoice_id' => $invoice->id,
                'description' => $line['description'],
                'quantity' => $line['quantity'],
                'unit_price' => $line['unit_price'],
                'total' => $line['total'],
                'tax_rate' => $taxRate,
                'tax_amount' => round($lineTaxAmount, 2),
                'order' => $index,
            ]);
        }

        if ($send) {
            try {
                $this->sendInvoiceEmail($invoice);
            } catch (\Exception $e) {
                \Log::error('Failed to send invoice email: '.$e->getMessage());

                return redirect()->route('jobs.show', $job)
                    ->with('error', __('Invoice created but failed to send email. Please check your mail configuration.'));
            }
        }

        $message = $send
            ? __('Invoice created and sent successfully.')
            : __('Invoice saved as draft.');

        return redirect()->route('jobs.show', $job)->with('success', $message);
    }

    public function markPaid(Request $request, Invoice $invoice): RedirectResponse
    {
        $companyId = session('current_company_id');
        if ($invoice->job->company_id !== $companyId) {
            abort(404);
        }
        $invoice->update(['status' => Invoice::STATUS_PAID]);

        // Check if all customer invoices for this job are now paid
        $job = $invoice->job;
        $customerInvoices = $job->invoices()->where('type', Invoice::TYPE_CUSTOMER)->get();

        if ($customerInvoices->count() > 0) {
            $allPaid = $customerInvoices->every(function ($inv) {
                return $inv->status === Invoice::STATUS_PAID;
            });

            if ($allPaid && ! $job->is_paid) {
                $job->update(['is_paid' => true]);
            }
        }

        return redirect()->route('jobs.show', $invoice->job)
            ->with('success', __('Invoice marked as paid.'));
    }

    public function update(Request $request, Invoice $invoice): RedirectResponse
    {
        $companyId = session('current_company_id');
        if ($invoice->job->company_id !== $companyId) {
            abort(404);
        }

        $validated = $request->validate([
            'type' => ['required', 'in:customer,employee'],
            'recipient_name' => ['required', 'string', 'max:255'],
            'recipient_email' => ['required', 'email', 'max:255'],
            'amount' => ['required', 'numeric', 'min:0'],
            'send' => ['boolean'],
            'price_includes_tax' => ['boolean'],
            'lines' => ['required', 'array', 'min:1'],
            'lines.*.description' => ['required', 'string', 'max:500'],
            'lines.*.quantity' => ['required', 'numeric', 'min:0.01'],
            'lines.*.unit_price' => ['required', 'numeric', 'min:0'],
            'lines.*.total' => ['required', 'numeric', 'min:0'],
        ]);

        $send = ! empty($validated['send']);
        $priceIncludesTax = ! empty($validated['price_includes_tax']);
        $taxRate = 21.00;

        // Calculate tax fields
        $subtotal = 0;
        foreach ($validated['lines'] as $line) {
            $subtotal += $line['total'];
        }

        if ($priceIncludesTax) {
            $actualSubtotal = $subtotal / 1.21;
            $taxAmount = $subtotal - $actualSubtotal;
            $totalInclTax = $subtotal;
        } else {
            $actualSubtotal = $subtotal;
            $taxAmount = $subtotal * 0.21;
            $totalInclTax = $subtotal + $taxAmount;
        }

        $invoice->update([
            'type' => $validated['type'],
            'recipient_name' => $validated['recipient_name'],
            'recipient_email' => $validated['recipient_email'],
            'amount' => $validated['amount'],
            'subtotal' => round($actualSubtotal, 2),
            'tax_amount' => round($taxAmount, 2),
            'total_incl_tax' => round($totalInclTax, 2),
            'status' => $send ? Invoice::STATUS_SENT : Invoice::STATUS_DRAFT,
            'sent_at' => $send ? now() : $invoice->sent_at,
        ]);

        $invoice->lines()->delete();

        foreach ($validated['lines'] as $index => $line) {
            $lineTotal = $line['total'];

            if ($priceIncludesTax) {
                $lineTaxAmount = $lineTotal - ($lineTotal / 1.21);
            } else {
                $lineTaxAmount = $lineTotal * 0.21;
            }

            \App\Models\InvoiceLine::create([
                'invoice_id' => $invoice->id,
                'description' => $line['description'],
                'quantity' => $line['quantity'],
                'unit_price' => $line['unit_price'],
                'total' => $line['total'],
                'tax_rate' => $taxRate,
                'tax_amount' => round($lineTaxAmount, 2),
                'order' => $index,
            ]);
        }

        if ($send && $invoice->status !== Invoice::STATUS_SENT) {
            try {
                $this->sendInvoiceEmail($invoice);
            } catch (\Exception $e) {
                \Log::error('Failed to send invoice email: '.$e->getMessage());

                return redirect()->route('jobs.show', $invoice->job)
                    ->with('error', __('Invoice updated but failed to send email. Please check your mail configuration.'));
            }
        }

        // Check if job payment status needs to be updated
        $job = $invoice->job;
        if ($invoice->type === Invoice::TYPE_CUSTOMER) {
            $customerInvoices = $job->invoices()->where('type', Invoice::TYPE_CUSTOMER)->get();

            if ($customerInvoices->count() > 0) {
                $allPaid = $customerInvoices->every(fn ($inv) => $inv->status === Invoice::STATUS_PAID);

                if ($allPaid && ! $job->is_paid) {
                    $job->update(['is_paid' => true]);
                } elseif (! $allPaid && $job->is_paid) {
                    $job->update(['is_paid' => false]);
                }
            }
        }

        $message = $send
            ? __('Invoice updated and sent successfully.')
            : __('Invoice updated successfully.');

        return redirect()->route('jobs.show', $invoice->job)->with('success', $message);
    }

    public function destroy(Request $request, Invoice $invoice): RedirectResponse
    {
        $companyId = session('current_company_id');
        if ($invoice->job->company_id !== $companyId) {
            abort(404);
        }

        $job = $invoice->job;
        $wasCustomerInvoice = $invoice->type === Invoice::TYPE_CUSTOMER;
        $invoice->delete();

        // If a customer invoice was deleted, check if job should be unmarked as paid
        if ($wasCustomerInvoice && $job->is_paid) {
            $remainingCustomerInvoices = $job->invoices()->where('type', Invoice::TYPE_CUSTOMER)->get();

            // If there are no customer invoices left, or not all are paid, unmark the job
            if ($remainingCustomerInvoices->count() === 0 ||
                ! $remainingCustomerInvoices->every(fn ($inv) => $inv->status === Invoice::STATUS_PAID)) {
                $job->update(['is_paid' => false]);
            }
        }

        return redirect()->route('jobs.show', $job)
            ->with('success', __('Invoice deleted successfully.'));
    }
}
