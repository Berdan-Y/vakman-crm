<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('invoices')
            ->where('status', 'draft')
            ->update(['invoice_number' => null]);
    }

    public function down(): void
    {
        // Cannot restore previous draft numbers
    }
};
