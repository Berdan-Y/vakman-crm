<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->decimal('subtotal', 12, 2)->default(0)->after('amount');
            $table->decimal('tax_amount', 12, 2)->default(0)->after('subtotal');
            $table->decimal('total_incl_tax', 12, 2)->default(0)->after('tax_amount');
        });
    }

    public function down(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->dropColumn(['subtotal', 'tax_amount', 'total_incl_tax']);
        });
    }
};
