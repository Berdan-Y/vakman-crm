<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('crm_jobs', function (Blueprint $table) {
            $table->time('scheduled_time')->nullable()->after('date');
            $table->string('recommendation')->nullable()->after('scheduled_time');
            $table->json('job_info')->nullable()->after('recommendation');
            $table->string('job_type')->nullable()->after('job_info');
            $table->string('job_type_other')->nullable()->after('job_type');
        });
    }

    public function down(): void
    {
        Schema::table('crm_jobs', function (Blueprint $table) {
            $table->dropColumn([
                'scheduled_time',
                'recommendation',
                'job_info',
                'job_type',
                'job_type_other',
            ]);
        });
    }
};
