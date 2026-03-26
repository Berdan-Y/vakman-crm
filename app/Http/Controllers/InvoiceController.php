<?php

namespace App\Http\Controllers;

use App\Mail\InvoiceMail;
use App\Models\Customer;
use App\Models\Employee;
use App\Models\Invoice;
use App\Models\Job;
use App\Support\InvoicePdfViewData;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class InvoiceController extends Controller
{
    public function index(Request $request): Response
    {
        $companyId = (int) session('current_company_id');
        $user = $request->user();
        $currentCompany = $user->companies()->where('company_id', $companyId)->first();
        $userRole = $currentCompany?->pivot->role;

        $query = Invoice::query()
            ->with(['job.customer'])
            ->where('company_id', $companyId)
            ->orderByDesc('created_at');

        if ($userRole === 'employee') {
            $employee = Employee::where('company_id', $companyId)
                ->where('email', $user->email)
                ->first();
            if ($employee) {
                $query->where(function ($q) use ($employee, $user) {
                    $q->whereHas('job', fn ($j) => $j->where('employee_id', $employee->id))
                        ->orWhere(function ($q2) use ($user) {
                            $q2->whereNull('crm_job_id')
                                ->where('type', Invoice::TYPE_EMPLOYEE)
                                ->where('recipient_email', $user->email);
                        });
                });
            } else {
                return Inertia::render('invoices/index', [
                    'invoices' => [],
                ]);
            }
        }

        $invoices = $query->limit(500)->get()->map(function (Invoice $invoice) {
            $job = $invoice->crm_job_id ? $invoice->job : null;

            return [
                'id' => $invoice->id,
                'invoice_number' => $invoice->invoice_number,
                'type' => $invoice->type,
                'payment_method' => $invoice->payment_method,
                'status' => $invoice->status,
                'amount' => (float) $invoice->amount,
                'total_incl_tax' => $invoice->total_incl_tax !== null ? (float) $invoice->total_incl_tax : null,
                'recipient_name' => $invoice->recipient_name,
                'created_at' => $invoice->created_at->toIso8601String(),
                'sent_at' => $invoice->sent_at?->toIso8601String(),
                'job' => $job ? [
                    'id' => $job->id,
                    'date' => $job->date->format('Y-m-d'),
                    'customer_name' => $job->customer?->name,
                ] : null,
            ];
        });

        return Inertia::render('invoices/index', [
            'invoices' => $invoices,
        ]);
    }

    public function create(Request $request): Response
    {
        $companyId = session('current_company_id');
        $user = $request->user();
        $currentCompany = $user->companies()->where('company_id', $companyId)->first();
        $userRole = $currentCompany?->pivot->role;

        $query = Job::query()
            ->where('company_id', $companyId)
            ->with(['customer'])
            ->orderByDesc('date');

        if ($userRole === 'employee') {
            $employee = Employee::where('company_id', $companyId)
                ->where('email', $user->email)
                ->first();
            if ($employee) {
                $query->where('employee_id', $employee->id);
            } else {
                return Inertia::render('invoices/create', [
                    'jobs' => [],
                ]);
            }
        }

        $jobs = $query->limit(200)->get()->map(fn (Job $job) => [
            'id' => $job->id,
            'description' => $job->description,
            'date' => $job->date->format('Y-m-d'),
            'customer' => $job->customer ? [
                'name' => $job->customer->name,
            ] : null,
        ]);

        return Inertia::render('invoices/create', [
            'jobs' => $jobs,
        ]);
    }

    public function newInvoice(Request $request): Response
    {
        $companyId = (int) session('current_company_id');

        $customers = Customer::query()
            ->where('company_id', $companyId)
            ->orderBy('name')
            ->get(['id', 'name', 'email'])
            ->map(fn (Customer $c) => [
                'id' => $c->id,
                'name' => $c->name,
                'email' => $c->email,
            ])
            ->values()
            ->all();

        $employees = Employee::query()
            ->where('company_id', $companyId)
            ->orderBy('name')
            ->get(['id', 'name', 'email'])
            ->map(fn (Employee $e) => [
                'id' => $e->id,
                'name' => $e->name,
                'email' => $e->email,
            ])
            ->values()
            ->all();

        return Inertia::render('invoices/new', [
            'customers' => $customers,
            'employees' => $employees,
        ]);
    }

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
        $companyId = (int) session('current_company_id');
        $this->assertInvoiceInCompany($invoice, $companyId);
        $invoice->loadMissing(['company', 'lines']);

        return Pdf::loadView('invoices.pdf', InvoicePdfViewData::make($invoice))
            ->setBasePath(public_path())
            ->stream('invoice-'.$invoice->id.'.pdf', ['Attachment' => false]);
    }

    /**
     * @return array<string, mixed>|null
     */
    private function getInvoicePayload(Invoice $invoice): ?array
    {
        $companyId = (int) session('current_company_id');
        $invoice->load([
            'company',
            'lines',
            'job.customer',
            'job.employee',
            'job.company',
            'billingCustomer',
            'billingEmployee',
        ]);
        if ((int) $invoice->company_id !== $companyId) {
            return null;
        }

        $pdf = InvoicePdfViewData::make($invoice);

        $jobForUi = null;
        if ($invoice->crm_job_id) {
            $invoice->loadMissing('job');
            if ($invoice->job) {
                $j = $invoice->job;
                $scheduledTime = $j->scheduled_time
                    ? (is_string($j->scheduled_time)
                        ? substr($j->scheduled_time, 0, 5)
                        : $j->scheduled_time->format('H:i'))
                    : null;
                $jobForUi = [
                    'id' => $j->id,
                    'description' => $j->description,
                    'date' => $j->date->format('Y-m-d'),
                    'scheduled_time' => $scheduledTime,
                    'invoice_number' => $invoice->invoice_number ?? $j->invoice_number,
                ];
            }
        }

        return [
            'invoice' => $pdf['invoice'],
            'invoice_lines' => $pdf['invoice_lines'],
            'job' => $jobForUi,
            'standalone' => $invoice->crm_job_id === null,
            'customer' => $pdf['customer'],
            'bill_to_vat_number' => $pdf['bill_to_vat_number'],
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
        $companyId = (int) session('current_company_id');
        $this->assertInvoiceInCompany($invoice, $companyId);

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

    public function bulkInvoiceForJobs(Request $request, Employee $employee): RedirectResponse
    {
        $companyId = (int) session('current_company_id');
        if ($employee->company_id !== $companyId) {
            abort(404);
        }

        $validated = $request->validate([
            'job_ids' => ['required', 'array', 'min:1'],
            'job_ids.*' => ['integer', 'distinct', 'exists:crm_jobs,id'],
        ]);

        $jobIds = array_map('intval', $validated['job_ids']);

        $matchingJobs = Job::query()
            ->where('company_id', $companyId)
            ->where('employee_id', $employee->id)
            ->whereIn('id', $jobIds)
            ->get();

        if ($matchingJobs->count() !== count($jobIds)) {
            return redirect()->back()
                ->with('error', __('Some selected jobs are no longer available.'));
        }

        $openJobs = $matchingJobs->where('is_paid', false)->values();
        if ($openJobs->count() !== $matchingJobs->count()) {
            return redirect()->back()
                ->with('error', __('Some selected jobs are already done.'));
        }

        $count = $openJobs->count();
        if ($count === 0) {
            return redirect()->back()
                ->with('error', __('No jobs selected.'));
        }

        if (! filled($employee->email)) {
            return redirect()->back()
                ->with('error', __('Employee has no email address.'));
        }

        // Normalize each job price to be exclusive of tax before summing.
        $normalizedTotal = (float) $openJobs->sum(function (Job $job): float {
            $price = (float) $job->price;

            if ($job->price_includes_tax) {
                return $price / 1.21;
            }

            return $price;
        });

        $total = $normalizedTotal;
        $priceIncludesTax = false;
        $taxRate = 21.00;

        // Calculate tax fields (same approach as store()).
        $subtotal = $total;
        if ($priceIncludesTax) {
            $actualSubtotal = $subtotal / 1.21;
            $taxAmount = $subtotal - $actualSubtotal;
            $totalInclTax = $subtotal;
        } else {
            $actualSubtotal = $subtotal;
            $taxAmount = $subtotal * 0.21;
            $totalInclTax = $subtotal + $taxAmount;
        }

        $sentAt = now();
        $description = $count.' opdrachten gereden.';

        $invoice = Invoice::create([
            'company_id' => $companyId,
            'crm_job_id' => null,
            'type' => Invoice::TYPE_EMPLOYEE,
            'payment_method' => Invoice::PAYMENT_CARD,
            'invoice_number' => null,
            'recipient_name' => $employee->name,
            'recipient_email' => $employee->email,
            'recipient_vat_number' => null,
            'billing_customer_id' => null,
            'billing_employee_id' => $employee->id,
            'amount' => $total,
            'subtotal' => round($actualSubtotal, 2),
            'tax_amount' => round($taxAmount, 2),
            'total_incl_tax' => round($totalInclTax, 2),
            'status' => Invoice::STATUS_SENT,
            'sent_at' => $sentAt,
        ]);

        // Assign card invoice reference (INV-...) for nicer UX on the employee/job screens.
        $invoice->assignCardInvoiceNumberIfNeeded($sentAt);
        $invoice->save();

        $lineTotal = $total;
        $lineTaxAmount = $priceIncludesTax
            ? $lineTotal - ($lineTotal / 1.21)
            : $lineTotal * 0.21;

        \App\Models\InvoiceLine::create([
            'invoice_id' => $invoice->id,
            'description' => $description,
            'quantity' => 1,
            'unit_price' => $total,
            'total' => $lineTotal,
            'tax_rate' => $taxRate,
            'tax_amount' => round($lineTaxAmount, 2),
            'order' => 0,
        ]);

        try {
            $this->sendInvoiceEmail($invoice);
        } catch (\Exception $e) {
            \Log::error('Failed to send bulk invoice email: '.$e->getMessage());

            return redirect()->back()
                ->with('error', __('Invoice created but failed to send email. Please check your mail configuration.'));
        }

        Job::query()
            ->whereIn('id', $openJobs->pluck('id')->all())
            ->update([
                'is_paid' => true,
                'invoice_number' => $invoice->invoice_number,
            ]);

        return redirect()->route('employees.show', $employee)
            ->with('success', __('Bulk invoice sent successfully.'));
    }

    public function store(Request $request): RedirectResponse
    {
        $companyId = (int) session('current_company_id');

        $validated = $request->validate([
            'job_id' => ['nullable', 'exists:crm_jobs,id'],
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
            'recipient_vat_number' => ['nullable', 'string', 'max:64'],
            'billing_customer_id' => ['nullable', 'integer', 'exists:customers,id'],
            'billing_employee_id' => ['nullable', 'integer', 'exists:employees,id'],
        ]);

        $job = null;
        if (! empty($validated['job_id'])) {
            $job = Job::query()
                ->where('company_id', $companyId)
                ->whereKey($validated['job_id'])
                ->first();
            if (! $job) {
                abort(404);
            }
        }

        $billing = $this->resolveBillingPartyIds($companyId, $job, $validated);

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
            'company_id' => $companyId,
            'crm_job_id' => $job?->id,
            'type' => $validated['type'],
            'payment_method' => $validated['payment_method'],
            'invoice_number' => null,
            'recipient_name' => $validated['recipient_name'],
            'recipient_email' => $validated['recipient_email'],
            'recipient_vat_number' => $validated['recipient_vat_number'] ?? null,
            'billing_customer_id' => $billing['billing_customer_id'],
            'billing_employee_id' => $billing['billing_employee_id'],
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

                $errorRedirect = $job
                    ? redirect()->route('jobs.show', $job)
                    : redirect()->route('invoices.show', $invoice);

                return $errorRedirect
                    ->with('error', __('Invoice created but failed to send email. Please check your mail configuration.'));
            }
        }

        $message = $send
            ? __('Invoice created and sent successfully.')
            : __('Invoice saved as draft.');

        if ($job) {
            return redirect()->route('jobs.show', $job)->with('success', $message);
        }

        return redirect()->route('invoices.show', $invoice)->with('success', $message);
    }

    public function markPaid(Request $request, Invoice $invoice): RedirectResponse
    {
        $companyId = (int) session('current_company_id');
        $this->assertInvoiceInCompany($invoice, $companyId);
        $invoice->update(['status' => Invoice::STATUS_PAID]);

        if ($invoice->job) {
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
        }

        return redirect()->back()
            ->with('success', __('Invoice marked as paid.'));
    }

    public function update(Request $request, Invoice $invoice): RedirectResponse
    {
        $companyId = (int) session('current_company_id');
        $this->assertInvoiceInCompany($invoice, $companyId);

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
            'recipient_vat_number' => ['nullable', 'string', 'max:64'],
            'billing_customer_id' => ['nullable', 'integer', 'exists:customers,id'],
            'billing_employee_id' => ['nullable', 'integer', 'exists:employees,id'],
        ]);

        $send = ! empty($validated['send']);
        $priceIncludesTax = ! empty($validated['price_includes_tax']);
        $taxRate = 21.00;

        $previousStatus = $invoice->status;

        $billing = $invoice->crm_job_id !== null
            ? ['billing_customer_id' => null, 'billing_employee_id' => null]
            : $this->resolveBillingPartyIds($companyId, null, $validated);

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
            'recipient_vat_number' => $validated['recipient_vat_number'] ?? null,
            'billing_customer_id' => $billing['billing_customer_id'],
            'billing_employee_id' => $billing['billing_employee_id'],
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
                $this->sendInvoiceEmail($invoice->fresh([
                    'lines',
                    'company',
                    'job.company',
                    'job.customer',
                    'job.employee',
                    'billingCustomer',
                    'billingEmployee',
                ]));
            } catch (\Exception $e) {
                \Log::error('Failed to send invoice email: '.$e->getMessage());

                $errorRedirect = $invoice->job
                    ? redirect()->route('jobs.show', $invoice->job)
                    : redirect()->route('invoices.show', $invoice);

                return $errorRedirect
                    ->with('error', __('Invoice updated but failed to send email. Please check your mail configuration.'));
            }
        }

        if ($invoice->job && $invoice->type === Invoice::TYPE_CUSTOMER) {
            $job = $invoice->job;
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

        if ($invoice->job) {
            return redirect()->route('jobs.show', $invoice->job)->with('success', $message);
        }

        return redirect()->route('invoices.show', $invoice)->with('success', $message);
    }

    public function destroy(Request $request, Invoice $invoice): RedirectResponse
    {
        $companyId = (int) session('current_company_id');
        $this->assertInvoiceInCompany($invoice, $companyId);

        $job = $invoice->job;
        $wasCustomerInvoice = $invoice->type === Invoice::TYPE_CUSTOMER;
        $invoice->delete();

        if ($job && $wasCustomerInvoice && $job->is_paid) {
            $remainingCustomerInvoices = $job->invoices()->where('type', Invoice::TYPE_CUSTOMER)->get();

            if ($remainingCustomerInvoices->count() === 0 ||
                ! $remainingCustomerInvoices->every(fn ($inv) => $inv->status === Invoice::STATUS_PAID)) {
                $job->update(['is_paid' => false]);
            }
        }

        if ($job) {
            return redirect()->route('jobs.show', $job)
                ->with('success', __('Invoice deleted successfully.'));
        }

        return redirect()->route('invoices.index')
            ->with('success', __('Invoice deleted successfully.'));
    }

    private function assertInvoiceInCompany(Invoice $invoice, ?int $companyId = null): void
    {
        $cid = $companyId ?? (int) session('current_company_id');
        if ((int) $invoice->company_id !== $cid) {
            abort(404);
        }
    }

    /**
     * Standalone invoices (no job) store which customer or employee is billed for address/VAT on the PDF.
     *
     * @param  array<string, mixed>  $validated
     * @return array{billing_customer_id: int|null, billing_employee_id: int|null}
     */
    private function resolveBillingPartyIds(int $companyId, ?Job $job, array $validated): array
    {
        if ($job !== null) {
            return [
                'billing_customer_id' => null,
                'billing_employee_id' => null,
            ];
        }

        if (($validated['type'] ?? null) === Invoice::TYPE_CUSTOMER) {
            if (empty($validated['billing_customer_id'])) {
                throw ValidationException::withMessages([
                    'billing_customer_id' => [__('Please select a customer.')],
                ]);
            }

            $exists = Customer::where('company_id', $companyId)
                ->whereKey($validated['billing_customer_id'])
                ->exists();

            if (! $exists) {
                throw ValidationException::withMessages([
                    'billing_customer_id' => [__('Invalid customer.')],
                ]);
            }

            return [
                'billing_customer_id' => (int) $validated['billing_customer_id'],
                'billing_employee_id' => null,
            ];
        }

        if (empty($validated['billing_employee_id'])) {
            throw ValidationException::withMessages([
                'billing_employee_id' => [__('Please select an employee.')],
            ]);
        }

        $exists = Employee::where('company_id', $companyId)
            ->whereKey($validated['billing_employee_id'])
            ->exists();

        if (! $exists) {
            throw ValidationException::withMessages([
                'billing_employee_id' => [__('Invalid employee.')],
            ]);
        }

        return [
            'billing_customer_id' => null,
            'billing_employee_id' => (int) $validated['billing_employee_id'],
        ];
    }
}
