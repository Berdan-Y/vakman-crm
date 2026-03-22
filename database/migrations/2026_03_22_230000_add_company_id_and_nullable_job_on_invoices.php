<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->foreignId('company_id')->nullable()->after('id')->constrained()->cascadeOnDelete();
        });

        foreach (DB::table('invoices')->orderBy('id')->cursor() as $row) {
            $companyId = DB::table('crm_jobs')->where('id', $row->crm_job_id)->value('company_id');
            if ($companyId !== null) {
                DB::table('invoices')->where('id', $row->id)->update(['company_id' => $companyId]);
            }
        }

        Schema::table('invoices', function (Blueprint $table) {
            $table->foreignId('company_id')->nullable(false)->change();
        });

        Schema::table('invoices', function (Blueprint $table) {
            $table->dropForeign(['crm_job_id']);
        });

        Schema::table('invoices', function (Blueprint $table) {
            $table->unsignedBigInteger('crm_job_id')->nullable()->change();
        });

        Schema::table('invoices', function (Blueprint $table) {
            $table->foreign('crm_job_id')->references('id')->on('crm_jobs')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->dropForeign(['crm_job_id']);
        });

        Schema::table('invoices', function (Blueprint $table) {
            $table->unsignedBigInteger('crm_job_id')->nullable(false)->change();
        });

        Schema::table('invoices', function (Blueprint $table) {
            $table->foreign('crm_job_id')->references('id')->on('crm_jobs')->cascadeOnDelete();
        });

        Schema::table('invoices', function (Blueprint $table) {
            $table->dropForeign(['company_id']);
            $table->dropColumn('company_id');
        });
    }
};
