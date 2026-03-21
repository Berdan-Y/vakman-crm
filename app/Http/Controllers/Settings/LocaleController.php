<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class LocaleController extends Controller
{
    public function update(Request $request)
    {
        $validated = $request->validate([
            'locale' => ['required', Rule::in(['en', 'nl'])],
        ]);

        $request->user()->update([
            'locale' => $validated['locale'],
        ]);

        return back();
    }
}
