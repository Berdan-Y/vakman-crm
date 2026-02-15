<?php

namespace App\Http\Controllers;

use App\Models\Job;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $companyId = session('current_company_id');
        if (! $companyId) {
            return Inertia::render('dashboard', [
                'stats' => $this->emptyStats(),
                'period' => $this->defaultPeriod(),
            ]);
        }

        $period = $request->input('period', 'month');
        $date = $request->input('date', now()->format('Y-m-d'));
        [$start, $end] = $this->periodRange($period, $date);

        $jobsQuery = Job::where('company_id', $companyId)
            ->whereBetween('date', [$start, $end]);

        $jobsCompleted = (clone $jobsQuery)->count();
        $totalRevenue = (clone $jobsQuery)->where('is_paid', true)->sum('price');
        $unpaidBills = (clone $jobsQuery)->where('is_paid', false)->sum('price');

        return Inertia::render('dashboard', [
            'stats' => [
                'jobs_completed' => $jobsCompleted,
                'total_revenue' => (float) $totalRevenue,
                'unpaid_bills' => (float) $unpaidBills,
            ],
            'period' => [
                'type' => $period,
                'label' => $this->periodLabel($period, $start, $end),
                'start' => $start->format('Y-m-d'),
                'end' => $end->format('Y-m-d'),
            ],
        ]);
    }

    private function emptyStats(): array
    {
        return [
            'jobs_completed' => 0,
            'total_revenue' => 0.0,
            'unpaid_bills' => 0.0,
        ];
    }

    private function defaultPeriod(): array
    {
        $start = now()->startOfMonth();
        $end = now()->endOfMonth();

        return [
            'type' => 'month',
            'label' => $this->periodLabel('month', $start, $end),
            'start' => $start->format('Y-m-d'),
            'end' => $end->format('Y-m-d'),
        ];
    }

    private function periodRange(string $period, string $date): array
    {
        $dt = Carbon::parse($date);

        return match ($period) {
            'week' => [$dt->copy()->startOfWeek(), $dt->copy()->endOfWeek()],
            'year' => [$dt->copy()->startOfYear(), $dt->copy()->endOfYear()],
            default => [$dt->copy()->startOfMonth(), $dt->copy()->endOfMonth()],
        };
    }

    private function periodLabel(string $period, Carbon $start, Carbon $end): string
    {
        return match ($period) {
            'week' => "Week of {$start->format('M j')}",
            'year' => $start->format('Y'),
            default => $start->format('F Y'),
        };
    }
}
