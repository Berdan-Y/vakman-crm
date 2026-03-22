<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('companies', function (Blueprint $table) {
            $table->string('street_address')->nullable()->after('industry');
            $table->string('postal_code', 32)->nullable()->after('street_address');
            $table->string('city')->nullable()->after('postal_code');
            $table->string('country')->nullable()->after('city');
            $table->string('tax_number', 64)->nullable()->after('country');
            $table->string('kvk_number', 64)->nullable()->after('tax_number');
            $table->string('email')->nullable()->after('kvk_number');
            $table->string('account_holder')->nullable()->after('email');
            $table->string('bank_name')->nullable()->after('account_holder');
            $table->string('bank_account_number', 64)->nullable()->after('bank_name');
        });
    }

    public function down(): void
    {
        Schema::table('companies', function (Blueprint $table) {
            $table->dropColumn([
                'street_address',
                'postal_code',
                'city',
                'country',
                'tax_number',
                'kvk_number',
                'email',
                'account_holder',
                'bank_name',
                'bank_account_number',
            ]);
        });
    }
};
