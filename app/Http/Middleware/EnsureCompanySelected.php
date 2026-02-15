<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureCompanySelected
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user) {
            return $next($request);
        }

        $companyId = session('current_company_id');

        if ($companyId) {
            $belongsToCompany = $user->companies()->where('company_id', $companyId)->exists();
            if ($belongsToCompany) {
                return $next($request);
            }
        }

        if ($user->companies()->exists()) {
            return redirect()->route('companies.index');
        }

        return redirect()->route('companies.index');
    }
}
