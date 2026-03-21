<?php

namespace App\Http\Controllers;

use App\Models\Company;
use App\Models\JobType;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;
use Inertia\Response;

class CompanyController extends Controller
{
    public function index(Request $request): Response|RedirectResponse
    {
        $user = $request->user();

        if (! $user) {
            return redirect()->route('login');
        }

        $companies = $user->companies()
            ->orderBy('name')
            ->get()
            ->map(fn (Company $company) => [
                'id' => $company->id,
                'name' => $company->name,
                'industry' => $company->industry,
                'role' => $company->pivot->role,
            ]);

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

        Validator::make($request->all(), [
            'name' => ['required', 'string', 'max:255'],
            'industry' => ['nullable', 'string', 'max:255'],
        ])->validate();

        $company = Company::create([
            'name' => $request->input('name'),
            'industry' => $request->input('industry'),
        ]);

        $company->users()->attach($user->id, ['role' => 'owner']);

        JobType::seedDefaultsForCompany((int) $company->id);

        session(['current_company_id' => $company->id]);

        // Use full redirect to ensure fresh CSRF token after company creation
        return redirect('/dashboard')
            ->with('success', __('Company created successfully.'));
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
