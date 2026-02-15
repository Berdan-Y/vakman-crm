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

        $jobs = $customer->jobs()->with('employee')->orderByDesc('date')->orderByDesc('id')->get();

        $jobOptions = config('job_options');

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
                'job_type' => $job->job_type,
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
