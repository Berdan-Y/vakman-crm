<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\Job;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CalendarController extends Controller
{
    public function index(Request $request): Response
    {
        $companyId = (int) session('current_company_id');
        $user = $request->user();
        $currentCompany = $user->companies()->where('company_id', $companyId)->first();
        $userRole = $currentCompany?->pivot->role;

        $year = (int) $request->input('year', now()->year);
        $month = (int) $request->input('month', now()->month);

        if ($year < 2000 || $year > 2100) {
            $year = now()->year;
        }
        if ($month < 1 || $month > 12) {
            $month = now()->month;
        }

        $start = Carbon::createFromDate($year, $month, 1)->startOfDay();
        $end = (clone $start)->endOfMonth();

        $query = Job::where('company_id', $companyId)
            ->with(['customer', 'employee', 'jobType'])
            ->whereBetween('date', [$start->toDateString(), $end->toDateString()])
            ->orderBy('date')
            ->orderBy('scheduled_time');

        if ($userRole === 'employee') {
            $employee = Employee::where('company_id', $companyId)
                ->where('email', $user->email)
                ->first();

            if (! $employee) {
                return Inertia::render('calendar/index', [
                    'year' => $year,
                    'month' => $month,
                    'jobs' => [],
                    'canSeeAll' => $userRole !== 'employee',
                ]);
            }

            $query->where('employee_id', $employee->id);
        }

        $jobs = $query->get()->map(function (Job $job) {
            $time = null;
            if ($job->scheduled_time) {
                $time = is_string($job->scheduled_time)
                    ? substr($job->scheduled_time, 0, 5)
                    : Carbon::parse($job->scheduled_time)->format('H:i');
            }

            $title = $this->calendarJobTitle($job);

            return [
                'id' => $job->id,
                'date' => $job->date->format('Y-m-d'),
                'time' => $time,
                'title' => $title,
                'customer_name' => $job->customer?->name,
                'employee_name' => $job->employee?->name,
            ];
        });

        return Inertia::render('calendar/index', [
            'year' => $year,
            'month' => $month,
            'jobs' => $jobs,
            'canSeeAll' => $userRole !== 'employee',
        ]);
    }

    private function calendarJobTitle(Job $job): string
    {
        $parts = array_filter([
            $job->customer?->name,
            $job->display_job_type,
        ]);

        if ($parts !== []) {
            return implode(' · ', $parts);
        }

        if ($job->description) {
            return \Illuminate\Support\Str::limit(trim((string) $job->description), 80);
        }

        return 'Job #'.$job->id;
    }
}
