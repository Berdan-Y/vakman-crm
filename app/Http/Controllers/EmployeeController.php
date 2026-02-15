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
                    'role' => $employee->role,
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
                'role' => $employee->role,
                'join_date' => $employee->join_date?->format('Y-m-d'),
                'total_jobs' => $jobs->count(),
                'total_revenue' => $totalRevenue,
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
            'join_date' => ['nullable', 'date'],
        ]);

        Employee::create([
            ...$validated,
            'company_id' => $companyId,
            'role' => 'Employee',
        ]);

        return redirect()->route('employees.index')
            ->with('success', __('Employee created successfully.'));
    }
}
