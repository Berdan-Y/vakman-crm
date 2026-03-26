<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('crm_jobs', function (Blueprint $table): void {
            $table->boolean('price_includes_tax')
                ->default(false)
                ->after('price');
        });
    }

    public function down(): void
    {
        Schema::table('crm_jobs', function (Blueprint $table): void {
            $table->dropColumn('price_includes_tax');
        });
    }
};
