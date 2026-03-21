<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\Employee;
use App\Models\Job;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ReportController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('reports/index');
    }

    public function revenueByEmployee(Request $request): Response
    {
        $companyId = session('current_company_id');
        $user = $request->user();
        $currentCompany = $user->companies()->where('company_id', $companyId)->first();
        $userRole = $currentCompany?->pivot->role;

        // Only owners and admins can see all employee revenue
        if ($userRole === 'employee') {
            abort(403, 'Unauthorized');
        }

        [$dateFrom, $dateTo, $period] = $this->getDateRange($request);

        $employees = Employee::where('company_id', $companyId)->get();

        $data = $employees->map(function ($employee) use ($dateFrom, $dateTo) {
            $jobs = $employee->jobs()
                ->whereBetween('date', [$dateFrom, $dateTo])
                ->with('invoices')
                ->get();

            $jobsCount = $jobs->count();

            $totalRevenue = $jobs->sum(function ($job) {
                if (! $job->is_paid) {
                    return 0;
                }

                $customerInvoicesTotal = $job->invoices
                    ->where('type', 'customer')
                    ->sum('amount');

                return $customerInvoicesTotal > 0 ? $customerInvoicesTotal : (float) $job->price;
            });

            return [
                'id' => $employee->id,
                'name' => $employee->name,
                'total_revenue' => (float) $totalRevenue,
                'jobs_count' => $jobsCount,
            ];
        })->filter(fn ($e) => $e['jobs_count'] > 0)
            ->sortByDesc('total_revenue')
            ->values();

        return Inertia::render('reports/revenue-by-employee', [
            'data' => $data,
            'period' => $period,
            'dateFrom' => $dateFrom,
            'dateTo' => $dateTo,
        ]);
    }

    public function jobsByStatus(Request $request): Response
    {
        $companyId = session('current_company_id');
        $user = $request->user();
        $currentCompany = $user->companies()->where('company_id', $companyId)->first();
        $userRole = $currentCompany?->pivot->role;

        [$dateFrom, $dateTo, $period] = $this->getDateRange($request);

        $baseQuery = Job::where('company_id', $companyId)
            ->whereBetween('date', [$dateFrom, $dateTo]);

        // If employee, filter to their own jobs only
        if ($userRole === 'employee') {
            // Find the employee record for this user
            $employee = Employee::where('company_id', $companyId)
                ->where('email', $user->email)
                ->first();

            if ($employee) {
                $baseQuery->where('employee_id', $employee->id);
            } else {
                // If no employee record, return empty data
                return Inertia::render('reports/jobs-by-status', [
                    'data' => ['paid' => 0, 'unpaid' => 0],
                    'period' => $period,
                    'dateFrom' => $dateFrom,
                    'dateTo' => $dateTo,
                ]);
            }
        }

        $data = [
            'paid' => (clone $baseQuery)->where('is_paid', true)->count(),
            'unpaid' => (clone $baseQuery)->where('is_paid', false)->count(),
        ];

        return Inertia::render('reports/jobs-by-status', [
            'data' => $data,
            'period' => $period,
            'dateFrom' => $dateFrom,
            'dateTo' => $dateTo,
        ]);
    }

    public function monthlyRevenue(Request $request): Response
    {
        $companyId = session('current_company_id');
        $user = $request->user();
        $currentCompany = $user->companies()->where('company_id', $companyId)->first();
        $userRole = $currentCompany?->pivot->role;

        [$dateFrom, $dateTo, $period] = $this->getDateRange($request);

        $jobsQuery = Job::where('company_id', $companyId)
            ->where('is_paid', true)
            ->whereBetween('date', [$dateFrom, $dateTo]);

        // If employee, filter to their own jobs only
        if ($userRole === 'employee') {
            $employee = Employee::where('company_id', $companyId)
                ->where('email', $user->email)
                ->first();

            if ($employee) {
                $jobsQuery->where('employee_id', $employee->id);
            } else {
                return Inertia::render('reports/monthly-revenue', [
                    'data' => [],
                    'period' => $period,
                    'dateFrom' => $dateFrom,
                    'dateTo' => $dateTo,
                ]);
            }
        }

        $jobs = $jobsQuery->with('invoices')->get(['id', 'date', 'price']);

        $data = $jobs
            ->groupBy(fn ($j) => Carbon::parse($j->date)->format('Y-m'))
            ->map(fn ($jobs, $month) => [
                'month' => Carbon::parse($month.'-01')->format('M Y'),
                'monthKey' => $month,
                'total' => (float) $jobs->sum(function ($job) {
                    $customerInvoicesTotal = $job->invoices
                        ->where('type', 'customer')
                        ->sum('amount');

                    return $customerInvoicesTotal > 0 ? $customerInvoicesTotal : (float) $job->price;
                }),
            ])
            ->sortBy('monthKey')
            ->values()
            ->all();

        return Inertia::render('reports/monthly-revenue', [
            'data' => $data,
            'period' => $period,
            'dateFrom' => $dateFrom,
            'dateTo' => $dateTo,
        ]);
    }

    public function customerJobs(Request $request): Response
    {
        $companyId = session('current_company_id');
        $user = $request->user();
        $currentCompany = $user->companies()->where('company_id', $companyId)->first();
        $userRole = $currentCompany?->pivot->role;

        [$dateFrom, $dateTo, $period] = $this->getDateRange($request);

        // Only owners and admins can see all customer jobs
        if ($userRole === 'employee') {
            abort(403, 'Unauthorized');
        }

        $customerQuery = Customer::where('company_id', $companyId);

        $data = $customerQuery
            ->whereHas('jobs', function ($q) use ($dateFrom, $dateTo) {
                $q->whereBetween('date', [$dateFrom, $dateTo]);
            })
            ->withCount(['jobs as jobs_count' => function ($q) use ($dateFrom, $dateTo) {
                $q->whereBetween('date', [$dateFrom, $dateTo]);
            }])
            ->orderByDesc('jobs_count')
            ->limit(20)
            ->get()
            ->map(fn ($c) => [
                'id' => $c->id,
                'name' => $c->name,
                'jobs_count' => $c->jobs_count,
            ]);

        return Inertia::render('reports/customer-jobs', [
            'data' => $data,
            'period' => $period,
            'dateFrom' => $dateFrom,
            'dateTo' => $dateTo,
        ]);
    }

    public function employeePerformance(Request $request): Response
    {
        $companyId = session('current_company_id');
        $user = $request->user();
        $currentCompany = $user->companies()->where('company_id', $companyId)->first();
        $userRole = $currentCompany?->pivot->role;

        [$dateFrom, $dateTo, $period] = $this->getDateRange($request);

        // If employee, only show their own performance
        if ($userRole === 'employee') {
            $employee = Employee::where('company_id', $companyId)
                ->where('email', $user->email)
                ->first();

            if (! $employee) {
                return Inertia::render('reports/employee-performance', [
                    'data' => collect([]),
                    'period' => $period,
                    'dateFrom' => $dateFrom,
                    'dateTo' => $dateTo,
                ]);
            }

            $employees = collect([$employee]);
        } else {
            // Owners and admins see all employees
            $employees = Employee::where('company_id', $companyId)->get();
        }

        $data = $employees->map(function ($employee) use ($dateFrom, $dateTo) {
            $jobs = $employee->jobs()
                ->whereBetween('date', [$dateFrom, $dateTo])
                ->with('invoices')
                ->get();

            $jobsCount = $jobs->count();

            $totalRevenue = $jobs->sum(function ($job) {
                if (! $job->is_paid) {
                    return 0;
                }

                $customerInvoicesTotal = $job->invoices
                    ->where('type', 'customer')
                    ->sum('amount');

                return $customerInvoicesTotal > 0 ? $customerInvoicesTotal : (float) $job->price;
            });

            return [
                'id' => $employee->id,
                'name' => $employee->name,
                'jobs_count' => $jobsCount,
                'total_revenue' => (float) $totalRevenue,
            ];
        })->filter(fn ($e) => $e['jobs_count'] > 0)
            ->sortByDesc('jobs_count')
            ->values();

        return Inertia::render('reports/employee-performance', [
            'data' => $data,
            'period' => $period,
            'dateFrom' => $dateFrom,
            'dateTo' => $dateTo,
        ]);
    }

    private function getDateRange(Request $request): array
    {
        $period = $request->input('period', 'month');
        $dateFrom = $request->input('date_from');
        $dateTo = $request->input('date_to');

        // If custom period and date range is provided
        if ($period === 'custom' && $dateFrom && $dateTo) {
            return [$dateFrom, $dateTo, 'custom'];
        }

        // Calculate based on period (week, month, year)
        $now = now();

        [$start, $end] = match ($period) {
            'week' => [$now->copy()->startOfWeek()->format('Y-m-d'), $now->copy()->endOfWeek()->format('Y-m-d')],
            'year' => [$now->copy()->startOfYear()->format('Y-m-d'), $now->copy()->endOfYear()->format('Y-m-d')],
            default => [$now->copy()->startOfMonth()->format('Y-m-d'), $now->copy()->endOfMonth()->format('Y-m-d')],
        };

        return [$start, $end, $period];
    }
}
