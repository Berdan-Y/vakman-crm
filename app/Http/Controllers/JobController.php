<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\Employee;
use App\Models\Invoice;
use App\Models\Job;
use App\Models\JobType;
use App\Models\WhatsAppMessageLog;
use App\Services\DutchAddressLookupService;
use App\Services\WhatsAppService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class JobController extends Controller
{
    public function __construct(
        private DutchAddressLookupService $addressLookup,
        private WhatsAppService $whatsApp
    ) {}

    public function index(Request $request): Response
    {
        $companyId = session('current_company_id');
        $user = $request->user();
        $currentCompany = $user->companies()->where('company_id', $companyId)->first();
        $userRole = $currentCompany?->pivot->role;

        $query = Job::where('company_id', $companyId)
            ->with(['customer', 'employee', 'invoices', 'jobType'])
            ->orderByDesc('date');

        // If employee, only show their own jobs
        if ($userRole === 'employee') {
            $employee = Employee::where('company_id', $companyId)
                ->where('email', $user->email)
                ->first();

            if ($employee) {
                $query->where('employee_id', $employee->id);
            } else {
                // If no employee record, return empty
                return Inertia::render('jobs/index', [
                    'jobs' => [],
                    'employees' => [],
                    'filters' => [
                        'status' => $request->input('status'),
                        'employee_id' => $request->input('employee_id'),
                        'date_from' => $request->input('date_from'),
                        'date_to' => $request->input('date_to'),
                    ],
                ]);
            }
        }

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

        $jobs = $query->get()->map(function (Job $job) {
            $customerInvoicesTotal = $job->invoices
                ->where('type', 'customer')
                ->sum('amount');

            $displayPrice = $customerInvoicesTotal > 0 ? $customerInvoicesTotal : (float) $job->price;

            return [
                'id' => $job->id,
                'description' => $job->description,
                'date' => $job->date->format('Y-m-d'),
                'scheduled_time' => $job->scheduled_time
                    ? (is_string($job->scheduled_time)
                        ? substr($job->scheduled_time, 0, 5)
                        : \Carbon\Carbon::parse($job->scheduled_time)->format('H:i'))
                    : null,
                'job_type' => $job->display_job_type,
                'price' => $displayPrice,
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
            ];
        });

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

        $job->load(['customer', 'employee', 'invoices', 'jobType']);

        $invoiceDisplayRef = $job->invoices
            ->sortBy('id')
            ->first(fn (Invoice $i) => filled($i->invoice_number))?->invoice_number
            ?? $job->invoice_number;

        $whatsappSentAt = WhatsAppMessageLog::where('context_type', Job::class)
            ->where('context_id', $job->id)
            ->where('direction', 'outbound')
            ->where('status', 'sent')
            ->latest()
            ->value('created_at');

        $jobOptions = Arr::except(config('job_options'), ['job_types']);

        $customerInvoicesTotal = $job->invoices
            ->where('type', 'customer')
            ->sum('amount');

        $displayPrice = $customerInvoicesTotal > 0 ? $customerInvoicesTotal : (float) $job->price;

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
                'job_type' => $job->display_job_type,
                'job_type_other' => $job->job_type_other,
                'price' => $displayPrice,
                'base_price' => (float) $job->price,
                'is_paid' => $job->is_paid,
                'invoice_number' => $invoiceDisplayRef,
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
                    'payment_method' => $inv->payment_method,
                    'invoice_number' => $inv->invoice_number,
                    'recipient_name' => $inv->recipient_name,
                    'recipient_email' => $inv->recipient_email,
                    'amount' => (float) $inv->amount,
                    'status' => $inv->status,
                    'created_at' => $inv->created_at->toIso8601String(),
                    'sent_at' => $inv->sent_at?->toIso8601String(),
                ]),
                'whatsapp_sent_at' => $whatsappSentAt?->toIso8601String(),
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
            'jobOptions' => Arr::except(config('job_options'), ['job_types']),
            'jobTypes' => $this->jobTypesForCompany((int) $companyId),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $companyId = (int) session('current_company_id');
        $validated = $request->validate([
            'customer_id' => ['nullable', 'integer', 'exists:customers,id'],
            'name' => ['required_without:customer_id', 'string', 'max:255'],
            'email' => ['nullable', 'string', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'zip_code' => ['required', 'string', 'max:10'],
            'house_number' => ['required', 'string', 'max:10'],
            'street' => ['nullable', 'string', 'max:255'],
            'city' => ['nullable', 'string', 'max:255'],
            'description' => ['required', 'string'],
            'price' => ['required', 'numeric', 'min:0'],
            'employee_id' => ['required', 'integer', 'exists:employees,id'],
            'date' => ['required', 'date'],
            'scheduled_time' => ['required', 'string', 'regex:/^\d{1,2}:\d{2}$/'],
            'recommendation' => ['nullable', 'string', 'in:emergency,regular'],
            'job_info' => ['nullable', 'string', 'in:wait_at_neighbors,wait_at_door,appointment_job,call_15_min_before,wait_inside'],
            'job_type_id' => [
                'required',
                'integer',
                Rule::exists('job_types', 'id')->where('company_id', $companyId),
            ],
            'job_type_other' => ['nullable', 'string', 'max:255'],
            'send_notification' => ['nullable', 'boolean'],
        ]);

        $jobType = JobType::where('company_id', $companyId)
            ->findOrFail($validated['job_type_id']);
        $validated = $this->validatedJobTypeOther($validated, $jobType);

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
            'job_type_id' => $validated['job_type_id'],
            'job_type_other' => $validated['job_type_other'] ?? null,
            'invoice_number' => null,
            'is_paid' => false,
        ]);

        if (! empty($validated['send_notification']) && $job->employee) {
            $this->whatsApp->sendJobToEmployee($job);
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

    public function edit(Request $request, Job $job): Response
    {
        $companyId = session('current_company_id');
        if ($job->company_id !== $companyId) {
            abort(404);
        }

        $job->load('customer');

        $employees = Employee::where('company_id', $companyId)
            ->orderBy('name')
            ->get(['id', 'name', 'email', 'phone']);

        return Inertia::render('jobs/edit', [
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
                'job_info' => is_array($job->job_info) && count($job->job_info) > 0 ? $job->job_info[0] : '',
                'job_type_id' => $job->job_type_id,
                'job_type_other' => $job->job_type_other,
                'price' => (float) $job->price,
                'employee_id' => $job->employee_id,
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
            ],
            'employees' => $employees,
            'jobOptions' => Arr::except(config('job_options'), ['job_types']),
            'jobTypes' => $this->jobTypesForCompany((int) $companyId),
        ]);
    }

    public function update(Request $request, Job $job): RedirectResponse
    {
        $companyId = (int) session('current_company_id');
        if ($job->company_id !== $companyId) {
            abort(404);
        }

        $validated = $request->validate([
            'description' => ['required', 'string'],
            'price' => ['required', 'numeric', 'min:0'],
            'employee_id' => ['required', 'integer', 'exists:employees,id'],
            'date' => ['required', 'date'],
            'scheduled_time' => ['required', 'string', 'regex:/^\d{1,2}:\d{2}$/'],
            'recommendation' => ['nullable', 'string', 'in:emergency,regular'],
            'job_info' => ['nullable', 'string', 'in:wait_at_neighbors,wait_at_door,appointment_job,call_15_min_before,wait_inside'],
            'job_type_id' => [
                'required',
                'integer',
                Rule::exists('job_types', 'id')->where('company_id', $companyId),
            ],
            'job_type_other' => ['nullable', 'string', 'max:255'],
        ]);

        $jobType = JobType::where('company_id', $companyId)
            ->findOrFail($validated['job_type_id']);
        $validated = $this->validatedJobTypeOther($validated, $jobType);

        $scheduledTime = null;
        if (! empty($validated['scheduled_time'])) {
            $scheduledTime = \Carbon\Carbon::createFromFormat('H:i', $validated['scheduled_time'])->format('H:i:s');
        }

        $job->update([
            'description' => $validated['description'] ?? null,
            'price' => $validated['price'],
            'employee_id' => $validated['employee_id'] ?? null,
            'date' => $validated['date'],
            'scheduled_time' => $scheduledTime,
            'recommendation' => $validated['recommendation'] ?? null,
            'job_info' => ! empty($validated['job_info']) ? [$validated['job_info']] : null,
            'job_type_id' => $validated['job_type_id'],
            'job_type_other' => $validated['job_type_other'] ?? null,
        ]);

        return redirect()->route('jobs.show', $job)
            ->with('success', __('Job updated successfully.'));
    }

    public function destroy(Request $request, Job $job): RedirectResponse
    {
        $companyId = session('current_company_id');
        if ($job->company_id !== $companyId) {
            abort(404);
        }

        $job->delete();

        return redirect()->route('jobs.index')
            ->with('success', __('Job deleted successfully.'));
    }

    public function sendWhatsApp(Request $request, Job $job): \Illuminate\Http\JsonResponse
    {
        $companyId = session('current_company_id');
        if ($job->company_id !== $companyId) {
            abort(404);
        }
        $result = $this->whatsApp->sendJobToEmployee($job);
        if ($result['success']) {
            $result['sent_at'] = now()->toIso8601String();
        }

        return response()->json($result, $result['success'] ? 200 : 422);
    }

    /**
     * @return array<int, array{id: int, name: string, is_other: bool}>
     */
    private function jobTypesForCompany(int $companyId): array
    {
        $types = JobType::query()
            ->where('company_id', $companyId)
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get(['id', 'name', 'is_other']);

        if ($types->isEmpty()) {
            JobType::seedDefaultsForCompany($companyId);
            $types = JobType::query()
                ->where('company_id', $companyId)
                ->orderBy('sort_order')
                ->orderBy('name')
                ->get(['id', 'name', 'is_other']);
        }

        return $types
            ->map(fn (JobType $t) => [
                'id' => $t->id,
                'name' => $t->name,
                'is_other' => $t->is_other,
            ])
            ->values()
            ->all();
    }

    /**
     * @param  array<string, mixed>  $validated
     * @return array<string, mixed>
     */
    private function validatedJobTypeOther(array $validated, JobType $jobType): array
    {
        if ($jobType->is_other) {
            if (trim((string) ($validated['job_type_other'] ?? '')) === '') {
                throw ValidationException::withMessages([
                    'job_type_other' => [__('Please specify the job type.')],
                ]);
            }
        } else {
            $validated['job_type_other'] = null;
        }

        return $validated;
    }
}
