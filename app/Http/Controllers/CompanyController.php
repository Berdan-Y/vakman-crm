<?php

namespace App\Http\Controllers;

use App\Models\Company;
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

        if ($companies->isNotEmpty() && $currentCompanyId && $companies->contains('id', $currentCompanyId)) {
            return redirect()->route('dashboard');
        }

        if ($companies->count() === 1 && ! $currentCompanyId) {
            session(['current_company_id' => $companies->first()['id']]);

            return redirect()->route('dashboard');
        }

        return Inertia::render('companies/index', [
            'companies' => $companies,
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

        session(['current_company_id' => $company->id]);

        return redirect()->route('dashboard')
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

        session(['current_company_id' => $companyId]);

        return redirect()->route('dashboard')
            ->with('success', __('Company switched successfully.'));
    }
}
