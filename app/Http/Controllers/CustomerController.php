<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CustomerController extends Controller
{
    public function show(Request $request, Customer $customer): Response
    {
        $companyId = session('current_company_id');
        if ($customer->company_id !== $companyId) {
            abort(404);
        }

        // Check user role
        $user = $request->user();
        $currentCompany = $user->companies()->where('company_id', $companyId)->first();
        $userRole = $currentCompany?->pivot->role;

        // Filter jobs for employees
        $jobsQuery = $customer->jobs()->with(['employee', 'jobType'])->orderByDesc('date')->orderByDesc('id');

        if ($userRole === 'employee') {
            $employee = \App\Models\Employee::where('company_id', $companyId)
                ->where('email', $user->email)
                ->first();

            if ($employee) {
                $jobsQuery->where('employee_id', $employee->id);
            } else {
                $jobsQuery->whereRaw('1 = 0'); // Return no jobs
            }
        }

        $jobs = $jobsQuery->get();

        $jobOptions = \Illuminate\Support\Arr::except(config('job_options'), ['job_types']);

        return Inertia::render('customers/show', [
            'customer' => [
                'id' => $customer->id,
                'name' => $customer->name,
                'email' => $customer->email,
                'phone' => $customer->phone,
                'street' => $customer->street,
                'city' => $customer->city,
                'zip_code' => $customer->zip_code,
                'house_number' => $customer->house_number,
            ],
            'jobs' => $jobs->map(fn ($job) => [
                'id' => $job->id,
                'description' => $job->description,
                'date' => $job->date->format('Y-m-d'),
                'scheduled_time' => $job->scheduled_time
                    ? (is_string($job->scheduled_time)
                        ? substr($job->scheduled_time, 0, 5)
                        : \Carbon\Carbon::parse($job->scheduled_time)->format('H:i'))
                    : null,
                'price' => (float) $job->price,
                'is_paid' => $job->is_paid,
                'invoice_number' => $job->invoice_number,
                'job_type' => $job->display_job_type,
                'recommendation' => $job->recommendation,
                'employee' => $job->employee ? [
                    'id' => $job->employee->id,
                    'name' => $job->employee->name,
                ] : null,
            ]),
            'jobOptions' => $jobOptions,
        ]);
    }
}
