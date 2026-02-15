<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\Employee;
use App\Models\Job;
use App\Services\DutchAddressLookupService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class JobController extends Controller
{
    public function __construct(
        private DutchAddressLookupService $addressLookup
    ) {}

    public function index(Request $request): Response
    {
        $companyId = session('current_company_id');
        $query = Job::where('company_id', $companyId)
            ->with(['customer', 'employee'])
            ->orderByDesc('date');

        if ($request->filled('status')) {
            if ($request->input('status') === 'paid') {
                $query->where('is_paid', true);
            } elseif ($request->input('status') === 'unpaid') {
                $query->where('is_paid', false);
            }
        }
        if ($request->filled('employee_id')) {
            $query->where('employee_id', $request->input('employee_id'));
        }
        if ($request->filled('date_from')) {
            $query->where('date', '>=', $request->input('date_from'));
        }
        if ($request->filled('date_to')) {
            $query->where('date', '<=', $request->input('date_to'));
        }

        $jobs = $query->get()->map(fn (Job $job) => [
            'id' => $job->id,
            'description' => $job->description,
            'date' => $job->date->format('Y-m-d'),
            'scheduled_time' => $job->scheduled_time
                ? (is_string($job->scheduled_time)
                    ? substr($job->scheduled_time, 0, 5)
                    : \Carbon\Carbon::parse($job->scheduled_time)->format('H:i'))
                : null,
            'job_type' => $job->job_type,
            'price' => (float) $job->price,
            'is_paid' => $job->is_paid,
            'invoice_number' => $job->invoice_number,
            'customer' => $job->customer ? [
                'id' => $job->customer->id,
                'name' => $job->customer->name,
            ] : null,
            'employee' => $job->employee ? [
                'id' => $job->employee->id,
                'name' => $job->employee->name,
            ] : null,
        ]);

        $employees = Employee::where('company_id', $companyId)
            ->orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('jobs/index', [
            'jobs' => $jobs,
            'employees' => $employees,
            'filters' => [
                'status' => $request->input('status'),
                'employee_id' => $request->input('employee_id'),
                'date_from' => $request->input('date_from'),
                'date_to' => $request->input('date_to'),
            ],
        ]);
    }

    public function show(Request $request, Job $job): Response|RedirectResponse
    {
        $companyId = session('current_company_id');
        if ($job->company_id !== $companyId) {
            abort(404);
        }

        $job->load(['customer', 'employee', 'invoices']);

        $jobOptions = config('job_options');

        return Inertia::render('jobs/show', [
            'jobOptions' => $jobOptions,
            'job' => [
                'id' => $job->id,
                'description' => $job->description,
                'date' => $job->date->format('Y-m-d'),
                'scheduled_time' => $job->scheduled_time
                    ? (is_string($job->scheduled_time)
                        ? substr($job->scheduled_time, 0, 5)
                        : \Carbon\Carbon::parse($job->scheduled_time)->format('H:i'))
                    : null,
                'recommendation' => $job->recommendation,
                'job_info' => $job->job_info ?? [],
                'job_type' => $job->job_type,
                'job_type_other' => $job->job_type_other,
                'price' => (float) $job->price,
                'is_paid' => $job->is_paid,
                'invoice_number' => $job->invoice_number,
                'customer' => $job->customer ? [
                    'id' => $job->customer->id,
                    'name' => $job->customer->name,
                    'email' => $job->customer->email,
                    'phone' => $job->customer->phone,
                    'street' => $job->customer->street,
                    'city' => $job->customer->city,
                    'zip_code' => $job->customer->zip_code,
                    'house_number' => $job->customer->house_number,
                ] : null,
                'employee' => $job->employee ? [
                    'id' => $job->employee->id,
                    'name' => $job->employee->name,
                    'email' => $job->employee->email,
                    'phone' => $job->employee->phone,
                    'role' => $job->employee->role,
                ] : null,
                'invoices' => $job->invoices->map(fn ($inv) => [
                    'id' => $inv->id,
                    'type' => $inv->type,
                    'recipient_name' => $inv->recipient_name,
                    'recipient_email' => $inv->recipient_email,
                    'amount' => (float) $inv->amount,
                    'status' => $inv->status,
                    'created_at' => $inv->created_at->toIso8601String(),
                    'sent_at' => $inv->sent_at?->toIso8601String(),
                ]),
            ],
        ]);
    }

    public function create(Request $request): Response
    {
        $companyId = session('current_company_id');
        $employees = Employee::where('company_id', $companyId)
            ->orderBy('name')
            ->get(['id', 'name', 'email', 'phone']);

        return Inertia::render('jobs/create', [
            'employees' => $employees,
            'jobOptions' => config('job_options'),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $companyId = session('current_company_id');
        $validated = $request->validate([
            'customer_id' => ['nullable', 'integer', 'exists:customers,id'],
            'name' => ['required_without:customer_id', 'string', 'max:255'],
            'email' => ['nullable', 'string', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'zip_code' => ['required', 'string', 'max:10'],
            'house_number' => ['required', 'string', 'max:10'],
            'street' => ['nullable', 'string', 'max:255'],
            'city' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'price' => ['required', 'numeric', 'min:0'],
            'employee_id' => ['nullable', 'integer', 'exists:employees,id'],
            'date' => ['required', 'date'],
            'scheduled_time' => ['nullable', 'string', 'regex:/^\d{1,2}:\d{2}$/'],
            'recommendation' => ['nullable', 'string', 'in:emergency,regular'],
            'job_info' => ['nullable', 'string', 'in:wait_at_neighbors,wait_at_door,appointment_job,call_15_min_before,wait_inside'],
            'job_type' => ['nullable', 'string', 'max:255'],
            'job_type_other' => ['nullable', 'string', 'max:255'],
            'send_notification' => ['nullable', 'boolean'],
        ]);

        $customer = null;
        if (! empty($validated['customer_id'])) {
            $customer = Customer::where('company_id', $companyId)
                ->findOrFail($validated['customer_id']);
        } else {
            $customer = Customer::create([
                'company_id' => $companyId,
                'name' => $validated['name'],
                'email' => $validated['email'] ?? null,
                'phone' => $validated['phone'] ?? null,
                'zip_code' => $validated['zip_code'],
                'house_number' => $validated['house_number'],
                'street' => $validated['street'] ?? null,
                'city' => $validated['city'] ?? null,
            ]);
        }

        $invoiceNumber = 'INV-'.now()->format('Ymd').'-'.(Job::where('company_id', $companyId)->whereDate('created_at', today())->count() + 1);

        $scheduledTime = null;
        if (! empty($validated['scheduled_time'])) {
            $scheduledTime = \Carbon\Carbon::createFromFormat('H:i', $validated['scheduled_time'])->format('H:i:s');
        }

        $job = Job::create([
            'company_id' => $companyId,
            'customer_id' => $customer->id,
            'employee_id' => $validated['employee_id'] ?? null,
            'description' => $validated['description'] ?? null,
            'price' => $validated['price'],
            'date' => $validated['date'],
            'scheduled_time' => $scheduledTime,
            'recommendation' => $validated['recommendation'] ?? null,
            'job_info' => ! empty($validated['job_info']) ? [$validated['job_info']] : null,
            'job_type' => $validated['job_type'] ?? null,
            'job_type_other' => $validated['job_type_other'] ?? null,
            'invoice_number' => $invoiceNumber,
            'is_paid' => false,
        ]);

        if (! empty($validated['send_notification']) && $job->employee) {
            // WhatsApp notification will be implemented in Feature 7
            // For now we just redirect; the job is created
        }

        return redirect()->route('jobs.show', $job)
            ->with('success', __('Job created successfully.'));
    }

    public function markPaid(Request $request, Job $job): RedirectResponse
    {
        $companyId = session('current_company_id');
        if ($job->company_id !== $companyId) {
            abort(404);
        }
        $job->update(['is_paid' => true]);

        return back()->with('success', __('Job marked as paid.'));
    }
}
