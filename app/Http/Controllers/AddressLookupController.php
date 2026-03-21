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

    public function autocomplete(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'postcode' => ['required', 'string', 'max:10'],
            'huisnummer' => ['required', 'string', 'max:10'],
            'huisletter' => ['nullable', 'string', 'max:10'],
        ]);

        $postcode = preg_replace('/\s+/', '', $validated['postcode']);
        $huisnummer = $validated['huisnummer'];
        $huisletter = $validated['huisletter'] ?? null;

        try {
            $params = [
                'postcode' => $postcode,
                'huisnummer' => $huisnummer,
            ];

            if ($huisletter) {
                $params['huisletter'] = $huisletter;
            }

            $response = \Illuminate\Support\Facades\Http::get(
                'https://openpostcode.nl/api/v2/address',
                $params
            );

            \Log::info('OpenPostcode API Response', [
                'status' => $response->status(),
                'body' => $response->json(),
                'postcode' => $postcode,
                'huisnummer' => $huisnummer,
                'huisletter' => $huisletter,
            ]);

            if ($response->status() === 200) {
                $data = $response->json();

                if (isset($data['results']) && is_array($data['results'])) {
                    $suggestions = array_map(function ($result) {
                        return [
                            'postcode' => $result['postcode'] ?? '',
                            'number' => $result['huisnummer'] ?? 0,
                            'letter' => $result['huisletter'] ?? '',
                            'addition' => $result['huisnummertoevoeging'] ?? '',
                            'street' => $result['straat'] ?? '',
                            'city' => [
                                'label' => $result['woonplaats'] ?? '',
                            ],
                        ];
                    }, $data['results']);

                    return response()->json([
                        'suggestions' => $suggestions,
                    ], 200);
                }
            }

            if ($response->status() === 409) {
                $data = $response->json();

                if (isset($data['results']) && is_array($data['results'])) {
                    $suggestions = array_map(function ($result) {
                        return [
                            'postcode' => $result['postcode'] ?? '',
                            'number' => $result['huisnummer'] ?? 0,
                            'letter' => $result['huisletter'] ?? '',
                            'addition' => $result['huisnummertoevoeging'] ?? '',
                            'street' => $result['straat'] ?? '',
                            'city' => [
                                'label' => $result['woonplaats'] ?? '',
                            ],
                        ];
                    }, $data['results']);

                    return response()->json([
                        'suggestions' => $suggestions,
                    ], 200);
                }
            }

            if ($response->status() === 404) {
                return response()->json([
                    'suggestions' => [],
                    'message' => 'Address not found',
                ], 404);
            }

            return response()->json([
                'suggestions' => [],
                'message' => 'Failed to fetch address',
            ], $response->status());

        } catch (\Exception $e) {
            \Log::error('OpenPostcode API Error', [
                'error' => $e->getMessage(),
                'postcode' => $postcode ?? null,
                'huisnummer' => $huisnummer ?? null,
                'huisletter' => $huisletter ?? null,
            ]);

            return response()->json([
                'suggestions' => [],
                'message' => 'Failed to fetch address',
            ], 500);
        }
    }

    public function findCustomers(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'postcode' => ['required', 'string', 'max:10'],
            'house_number' => ['required', 'string', 'max:10'],
        ]);

        $companyId = session('current_company_id');
        $zipCode = $validated['postcode'];
        $houseNumber = $validated['house_number'];

        $customers = Customer::where('company_id', $companyId)
            ->where('zip_code', $zipCode)
            ->where('house_number', $houseNumber)
            ->get();

        return response()->json([
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
        ]);
    }

    public function lookup(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'postcode' => ['required', 'string', 'max:10'],
            'house_number' => ['required', 'string', 'max:10'],
            'house_number_addition' => ['nullable', 'string', 'max:10'],
            'street' => ['nullable', 'string', 'max:255'],
            'city' => ['nullable', 'string', 'max:255'],
            'use_provided_address' => ['nullable', 'boolean'],
        ]);

        $useProvidedAddress = $validated['use_provided_address'] ?? false;

        if ($useProvidedAddress && isset($validated['street']) && isset($validated['city'])) {
            $address = [
                'street' => $validated['street'],
                'city' => $validated['city'],
                'postcode' => $validated['postcode'],
                'house_number' => $validated['house_number'].($validated['house_number_addition'] ?? ''),
            ];
        } else {
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
        }

        $companyId = session('current_company_id');
        $zipCode = $address['postcode'];
        $houseNumber = $address['house_number'];

        // Check user role
        $user = $request->user();
        $currentCompany = $user->companies()->where('company_id', $companyId)->first();
        $userRole = $currentCompany?->pivot->role;

        $customersQuery = Customer::where('company_id', $companyId)
            ->where('zip_code', $zipCode)
            ->where('house_number', $houseNumber);

        // If employee, filter jobs to only their own
        if ($userRole === 'employee') {
            $employee = \App\Models\Employee::where('company_id', $companyId)
                ->where('email', $user->email)
                ->first();

            if ($employee) {
                $customersQuery->with(['jobs' => function ($q) use ($employee) {
                    $q->where('employee_id', $employee->id)
                        ->orderByDesc('date')
                        ->limit(20);
                }]);
            } else {
                $customersQuery->with(['jobs' => fn ($q) => $q->whereRaw('1 = 0')]);
            }
        } else {
            $customersQuery->with(['jobs' => fn ($q) => $q->orderByDesc('date')->limit(20)]);
        }

        $customers = $customersQuery->get();

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
