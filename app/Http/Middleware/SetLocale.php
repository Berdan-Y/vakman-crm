<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SetLocale
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $locale = 'nl'; // Default to Dutch

        if ($request->user()) {
            $locale = $request->user()->locale ?? 'nl';
        }

        app()->setLocale($locale);

        return $next($request);
    }
}
