<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->string('vat_number', 64)->nullable()->after('city');
        });

        Schema::table('employees', function (Blueprint $table) {
            $table->string('street')->nullable()->after('phone');
            $table->string('house_number', 32)->nullable()->after('street');
            $table->string('zip_code', 16)->nullable()->after('house_number');
            $table->string('city')->nullable()->after('zip_code');
            $table->string('vat_number', 64)->nullable()->after('kvk_number');
        });

        Schema::table('invoices', function (Blueprint $table) {
            $table->string('recipient_vat_number', 64)->nullable()->after('recipient_name');
        });
    }

    public function down(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->dropColumn('vat_number');
        });

        Schema::table('employees', function (Blueprint $table) {
            $table->dropColumn(['street', 'house_number', 'zip_code', 'city', 'vat_number']);
        });

        Schema::table('invoices', function (Blueprint $table) {
            $table->dropColumn('recipient_vat_number');
        });
    }
};
