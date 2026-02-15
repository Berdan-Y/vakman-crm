<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\Job;
use App\Services\DutchAddressLookupService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AddressLookupController extends Controller
{
    public function __construct(
        private DutchAddressLookupService $addressLookup
    ) {}

    public function index(): Response
    {
        return Inertia::render('address-search/index');
    }

    public function lookup(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'postcode' => ['required', 'string', 'max:10'],
            'house_number' => ['required', 'string', 'max:10'],
            'house_number_addition' => ['nullable', 'string', 'max:10'],
        ]);

        $address = $this->addressLookup->lookup(
            $validated['postcode'],
            $validated['house_number'],
            $validated['house_number_addition'] ?? null
        );

        if (! $address) {
            return response()->json([
                'success' => false,
                'message' => __('Address not found for this postcode and house number.'),
            ], 404);
        }

        $companyId = session('current_company_id');
        $zipCode = $address['postcode'];
        $houseNumber = $address['house_number'];

        $customers = Customer::where('company_id', $companyId)
            ->where('zip_code', $zipCode)
            ->where('house_number', $houseNumber)
            ->with(['jobs' => fn ($q) => $q->orderByDesc('date')->limit(20)])
            ->get();

        $jobsByCustomer = $customers->map(fn (Customer $c) => [
            'customer' => [
                'id' => $c->id,
                'name' => $c->name,
                'email' => $c->email,
                'phone' => $c->phone,
            ],
            'jobs' => $c->jobs->map(fn (Job $job) => [
                'id' => $job->id,
                'description' => $job->description,
                'date' => $job->date->format('Y-m-d'),
                'price' => (float) $job->price,
                'is_paid' => $job->is_paid,
                'invoice_number' => $job->invoice_number,
            ]),
        ]);

        return response()->json([
            'success' => true,
            'address' => $address,
            'customers' => $customers->map(fn (Customer $c) => [
                'id' => $c->id,
                'name' => $c->name,
                'email' => $c->email,
                'phone' => $c->phone,
                'street' => $c->street,
                'city' => $c->city,
                'zip_code' => $c->zip_code,
                'house_number' => $c->house_number,
            ]),
            'job_history' => $jobsByCustomer,
        ]);
    }
}
