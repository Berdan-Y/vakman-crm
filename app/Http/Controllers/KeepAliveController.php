<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;

class KeepAliveController extends Controller
{
    /**
     * Keep the session alive by touching it.
     * This is called periodically by the frontend to prevent session expiration
     * while the user is actively using the application.
     */
    public function __invoke(): JsonResponse
    {
        // Simply touching the session will extend its lifetime
        session()->put('last_activity', now());

        return response()->json([
            'status' => 'ok',
            'timestamp' => now()->toIso8601String(),
        ]);
    }
}
