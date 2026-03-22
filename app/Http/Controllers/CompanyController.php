<?php

namespace App\Http\Controllers;

use App\Models\Company;
use App\Models\JobType;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CompanyController extends Controller
{
    /**
     * @return array<string, array<int, string>>
     */
    private function companyValidationRules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'industry' => ['nullable', 'string', 'max:255'],
            'street_address' => ['nullable', 'string', 'max:255'],
            'postal_code' => ['nullable', 'string', 'max:32'],
            'city' => ['nullable', 'string', 'max:255'],
            'country' => ['nullable', 'string', 'max:255'],
            'tax_number' => ['nullable', 'string', 'max:64'],
            'kvk_number' => ['nullable', 'string', 'max:64'],
            'email' => ['nullable', 'email', 'max:255'],
            'account_holder' => ['nullable', 'string', 'max:255'],
            'bank_name' => ['nullable', 'string', 'max:255'],
            'bank_account_number' => ['nullable', 'string', 'max:64'],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function companyPayload(Request $request): array
    {
        return $request->validate($this->companyValidationRules());
    }

    public function index(Request $request): Response|RedirectResponse
    {
        $user = $request->user();

        if (! $user) {
            return redirect()->route('login');
        }

        $companies = $user->companies()
            ->orderBy('name')
            ->get()
            ->map(fn (Company $company) => $company->toInertiaArray((string) $company->pivot->role));

        $currentCompanyId = session('current_company_id');

        // If user has only one company and no current company set, auto-select it
        if ($companies->count() === 1 && ! $currentCompanyId) {
            session(['current_company_id' => $companies->first()['id']]);

            // Use full redirect to ensure fresh CSRF token
            return redirect('/dashboard');
        }

        return Inertia::render('companies/index', [
            'companies' => $companies,
            'currentCompanyId' => $currentCompanyId,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $user = $request->user();

        $company = Company::create($this->companyPayload($request));

        $company->users()->attach($user->id, ['role' => 'owner']);

        JobType::seedDefaultsForCompany((int) $company->id);

        session(['current_company_id' => $company->id]);

        // Use full redirect to ensure fresh CSRF token after company creation
        return redirect('/dashboard')
            ->with('success', __('Company created successfully.'));
    }

    public function edit(Request $request, Company $company): Response|RedirectResponse
    {
        $user = $request->user();

        if (! $user) {
            return redirect()->route('login');
        }

        $membership = $user->companies()->where('company_id', $company->id)->first();

        if (! $membership) {
            abort(403);
        }

        return Inertia::render('companies/edit', [
            'company' => $company->toInertiaArray((string) $membership->pivot->role),
        ]);
    }

    public function update(Request $request, Company $company): RedirectResponse
    {
        $user = $request->user();

        if (! $user) {
            return redirect()->route('login');
        }

        $belongs = $user->companies()->where('company_id', $company->id)->exists();

        if (! $belongs) {
            abort(403);
        }

        $company->update($this->companyPayload($request));

        return redirect()->route('companies.edit', $company)
            ->with('success', __('Company updated successfully.'));
    }

    public function switch(Request $request): RedirectResponse
    {
        $companyId = (int) $request->input('company_id');
        $user = $request->user();

        $belongsToCompany = $user->companies()->where('company_id', $companyId)->exists();

        if (! $belongsToCompany) {
            return back()->withErrors(['company_id' => __('You do not have access to this company.')]);
        }

        // Set the session
        $request->session()->put('current_company_id', $companyId);
        $request->session()->save();

        // Use a full redirect (not Inertia) to ensure fresh CSRF token
        // This prevents session expiration errors after switching companies
        return redirect('/dashboard');
    }
}
