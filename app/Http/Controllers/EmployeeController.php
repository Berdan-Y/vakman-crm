<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\Job;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class EmployeeController extends Controller
{
    public function index(Request $request): Response
    {
        $companyId = session('current_company_id');
        $employees = Employee::where('company_id', $companyId)
            ->orderBy('name')
            ->get()
            ->map(function (Employee $employee) {
                $jobs = $employee->jobs();
                $totalJobs = $jobs->count();
                $totalRevenue = (float) $jobs->where('is_paid', true)->sum('price');

                return [
                    'id' => $employee->id,
                    'name' => $employee->name,
                    'email' => $employee->email,
                    'phone' => $employee->phone,
                    'street' => $employee->street,
                    'house_number' => $employee->house_number,
                    'zip_code' => $employee->zip_code,
                    'city' => $employee->city,
                    'kvk_number' => $employee->kvk_number,
                    'vat_number' => $employee->vat_number,
                    'role' => strtolower($employee->role ?? 'employee'),
                    'join_date' => $employee->join_date?->format('Y-m-d'),
                    'total_jobs' => $totalJobs,
                    'total_revenue' => $totalRevenue,
                ];
            });

        return Inertia::render('employees/index', [
            'employees' => $employees,
        ]);
    }

    public function show(Request $request, Employee $employee): Response|RedirectResponse
    {
        $companyId = session('current_company_id');
        if ($employee->company_id !== $companyId) {
            abort(404);
        }

        $employee->load('jobs.customer');
        $jobs = $employee->jobs()->orderByDesc('date')->get();
        $totalRevenue = (float) $employee->jobs()->where('is_paid', true)->sum('price');

        return Inertia::render('employees/show', [
            'employee' => [
                'id' => $employee->id,
                'name' => $employee->name,
                'email' => $employee->email,
                'phone' => $employee->phone,
                'street' => $employee->street,
                'house_number' => $employee->house_number,
                'zip_code' => $employee->zip_code,
                'city' => $employee->city,
                'kvk_number' => $employee->kvk_number,
                'vat_number' => $employee->vat_number,
                'role' => strtolower($employee->role ?? 'employee'),
                'join_date' => $employee->join_date?->format('Y-m-d'),
                'total_jobs' => $jobs->count(),
                'total_revenue' => $totalRevenue,
                'user_id' => $employee->user_id,
                'has_account' => $employee->user_id !== null,
                'jobs' => $jobs->map(fn (Job $job) => [
                    'id' => $job->id,
                    'description' => $job->description,
                    'date' => $job->date->format('Y-m-d'),
                    'price' => (float) $job->price,
                    'is_paid' => $job->is_paid,
                    'invoice_number' => $job->invoice_number,
                    'customer' => $job->customer ? [
                        'id' => $job->customer->id,
                        'name' => $job->customer->name,
                        'phone' => $job->customer->phone,
                    ] : null,
                ]),
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('employees/create');
    }

    public function store(Request $request): RedirectResponse
    {
        $companyId = session('current_company_id');
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'street' => ['nullable', 'string', 'max:255'],
            'house_number' => ['nullable', 'string', 'max:32'],
            'zip_code' => ['nullable', 'string', 'max:16'],
            'city' => ['nullable', 'string', 'max:255'],
            'kvk_number' => ['nullable', 'string', 'max:64'],
            'vat_number' => ['nullable', 'string', 'max:64'],
            'join_date' => ['nullable', 'date'],
            'create_account' => ['boolean'],
            'role' => ['required', 'string', 'in:employee,admin'],
        ]);

        $employee = Employee::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'] ?? null,
            'street' => $validated['street'] ?? null,
            'house_number' => $validated['house_number'] ?? null,
            'zip_code' => $validated['zip_code'] ?? null,
            'city' => $validated['city'] ?? null,
            'kvk_number' => $validated['kvk_number'] ?? null,
            'vat_number' => $validated['vat_number'] ?? null,
            'join_date' => $validated['join_date'] ?? null,
            'company_id' => $companyId,
            'role' => $validated['role'] ?? 'employee',
        ]);

        // If create_account is checked, send invitation
        if (! empty($validated['create_account'])) {
            $token = \Illuminate\Support\Str::random(64);

            $employee->update([
                'invitation_token' => $token,
                'invitation_sent_at' => now(),
            ]);

            $invitationUrl = route('employee.invitation.accept', ['token' => $token]);
            $companyName = $employee->company->name;

            try {
                \Illuminate\Support\Facades\Mail::to($employee->email)
                    ->send(new \App\Mail\EmployeeInvitation($employee, $invitationUrl, $companyName));

                return redirect()->route('employees.index')
                    ->with('success', __('Employee created and invitation sent to '.$employee->email));
            } catch (\Exception $e) {
                \Log::error('Failed to send employee invitation: '.$e->getMessage());

                return redirect()->route('employees.index')
                    ->with('warning', __('Employee created but failed to send invitation email.'));
            }
        }

        return redirect()->route('employees.index')
            ->with('success', __('Employee created successfully.'));
    }

    public function edit(Request $request, Employee $employee): Response|RedirectResponse
    {
        $companyId = session('current_company_id');
        if ($employee->company_id !== $companyId) {
            abort(404);
        }

        return Inertia::render('employees/edit', [
            'employee' => [
                'id' => $employee->id,
                'name' => $employee->name,
                'email' => $employee->email,
                'phone' => $employee->phone,
                'street' => $employee->street,
                'house_number' => $employee->house_number,
                'zip_code' => $employee->zip_code,
                'city' => $employee->city,
                'kvk_number' => $employee->kvk_number,
                'vat_number' => $employee->vat_number,
                'role' => strtolower($employee->role ?? 'employee'),
                'join_date' => $employee->join_date?->format('Y-m-d'),
                'user_id' => $employee->user_id,
                'has_account' => $employee->user_id !== null,
            ],
        ]);
    }

    public function update(Request $request, Employee $employee): RedirectResponse
    {
        $companyId = session('current_company_id');
        if ($employee->company_id !== $companyId) {
            abort(404);
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'street' => ['nullable', 'string', 'max:255'],
            'house_number' => ['nullable', 'string', 'max:32'],
            'zip_code' => ['nullable', 'string', 'max:16'],
            'city' => ['nullable', 'string', 'max:255'],
            'kvk_number' => ['nullable', 'string', 'max:64'],
            'vat_number' => ['nullable', 'string', 'max:64'],
            'role' => ['required', 'string', 'in:employee,admin'],
            'join_date' => ['nullable', 'date'],
        ]);

        $employee->update($validated);

        // If employee has a linked user account, update their company role as well
        if ($employee->user_id) {
            $user = \App\Models\User::find($employee->user_id);
            if ($user) {
                $role = $validated['role'] === 'admin' ? \App\Models\User::ROLE_ADMIN : \App\Models\User::ROLE_EMPLOYEE;
                $user->companies()->updateExistingPivot($companyId, ['role' => $role]);
            }
        }

        return redirect()->route('employees.show', $employee->id)
            ->with('success', __('Employee updated successfully.'));
    }

    public function destroy(Request $request, Employee $employee): RedirectResponse
    {
        $companyId = session('current_company_id');
        if ($employee->company_id !== $companyId) {
            abort(404);
        }

        $employee->delete();

        return redirect()->route('employees.index')
            ->with('success', __('Employee deleted successfully.'));
    }
}
