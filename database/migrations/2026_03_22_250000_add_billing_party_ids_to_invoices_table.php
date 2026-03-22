<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->foreignId('billing_customer_id')
                ->nullable()
                ->after('recipient_vat_number')
                ->constrained('customers')
                ->nullOnDelete();
            $table->foreignId('billing_employee_id')
                ->nullable()
                ->after('billing_customer_id')
                ->constrained('employees')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->dropForeign(['billing_customer_id']);
            $table->dropForeign(['billing_employee_id']);
        });

        Schema::table('invoices', function (Blueprint $table) {
            $table->dropColumn(['billing_customer_id', 'billing_employee_id']);
        });
    }
};
