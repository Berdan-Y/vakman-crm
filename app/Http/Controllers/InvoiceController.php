<?php

namespace App\Http\Controllers;

use App\Mail\InvoiceMail;
use App\Models\Invoice;
use App\Support\InvoicePdfViewData;
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
        $companyId = session('current_company_id');
        $invoice->load('job.company');
        if ($invoice->job->company_id !== $companyId) {
            abort(404);
        }
        $invoice->load('job.customer', 'lines');

        return Pdf::loadView('invoices.pdf', InvoicePdfViewData::make($invoice))
            ->setBasePath(public_path())
            ->stream('invoice-'.$invoice->id.'.pdf', ['Attachment' => false]);
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

        $pdf = InvoicePdfViewData::make($invoice);

        return [
            'invoice' => $pdf['invoice'],
            'invoice_lines' => $pdf['invoice_lines'],
            'job' => $pdf['job'],
            'customer' => $pdf['customer'],
            'company_name' => $pdf['company_name'],
            'company' => $pdf['company'],
            'company_sender_line' => $pdf['company_sender_line'],
            'document_date' => $pdf['document_date'],
            'due_date' => $pdf['due_date'],
            'delivery_date' => $pdf['delivery_date'],
            'payment_method_label' => $pdf['payment_method_label'],
            'display_invoice_number' => $pdf['display_invoice_number'],
            'tax_rate_percent' => $pdf['tax_rate_percent'],
            'customer_address_lines' => $pdf['customer_address_lines'],
        ];
    }

    private function sendInvoiceEmail(Invoice $invoice): void
    {
        $locale = auth()->user()?->locale ?? config('app.locale', 'nl');

        Mail::to($invoice->recipient_email)
            ->send(new InvoiceMail($invoice, $locale));
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
            $sentAt = now();
            $invoice->status = Invoice::STATUS_SENT;
            $invoice->sent_at = $sentAt;
            $invoice->assignCardInvoiceNumberIfNeeded($sentAt);
            $invoice->save();

            $this->sendInvoiceEmail($invoice);

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
            'payment_method' => ['required', 'string', 'in:card,cash'],
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

        $sentAt = $send ? now() : null;

        $invoice = Invoice::create([
            'crm_job_id' => $job->id,
            'type' => $validated['type'],
            'payment_method' => $validated['payment_method'],
            'invoice_number' => null,
            'recipient_name' => $validated['recipient_name'],
            'recipient_email' => $validated['recipient_email'],
            'amount' => $validated['amount'],
            'subtotal' => round($actualSubtotal, 2),
            'tax_amount' => round($taxAmount, 2),
            'total_incl_tax' => round($totalInclTax, 2),
            'status' => $send ? Invoice::STATUS_SENT : Invoice::STATUS_DRAFT,
            'sent_at' => $sentAt,
        ]);

        if ($send && $sentAt) {
            $invoice->assignCardInvoiceNumberIfNeeded($sentAt);
            $invoice->save();
        }

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
            'payment_method' => ['required', 'string', 'in:card,cash'],
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

        $previousStatus = $invoice->status;

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

        if ($previousStatus === Invoice::STATUS_PAID) {
            $finalStatus = Invoice::STATUS_PAID;
            $finalSentAt = $invoice->sent_at;
        } elseif (! $send) {
            $finalStatus = Invoice::STATUS_DRAFT;
            $finalSentAt = null;
        } else {
            $finalStatus = Invoice::STATUS_SENT;
            $finalSentAt = $previousStatus === Invoice::STATUS_DRAFT
                ? now()
                : ($invoice->sent_at ?? now());
        }

        $invoice->payment_method = $validated['payment_method'];
        $invoice->fill([
            'type' => $validated['type'],
            'recipient_name' => $validated['recipient_name'],
            'recipient_email' => $validated['recipient_email'],
            'amount' => $validated['amount'],
            'subtotal' => round($actualSubtotal, 2),
            'tax_amount' => round($taxAmount, 2),
            'total_incl_tax' => round($totalInclTax, 2),
            'status' => $finalStatus,
            'sent_at' => $finalSentAt,
        ]);

        if ($invoice->payment_method === Invoice::PAYMENT_CASH) {
            $invoice->invoice_number = null;
        } elseif ($finalStatus === Invoice::STATUS_DRAFT) {
            $invoice->invoice_number = null;
        } elseif ($previousStatus === Invoice::STATUS_PAID) {
            // keep existing invoice_number
        } elseif ($send && $previousStatus === Invoice::STATUS_DRAFT && $invoice->payment_method === Invoice::PAYMENT_CARD && $finalSentAt) {
            $invoice->assignCardInvoiceNumberIfNeeded($finalSentAt);
        }

        $invoice->save();

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

        if ($send && $previousStatus === Invoice::STATUS_DRAFT) {
            try {
                $this->sendInvoiceEmail($invoice->fresh(['lines', 'job.company', 'job.customer']));
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
