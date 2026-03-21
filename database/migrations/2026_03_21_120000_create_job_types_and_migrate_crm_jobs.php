<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('job_types', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->boolean('is_other')->default(false);
            $table->timestamps();

            $table->unique(['company_id', 'name']);
        });

        Schema::table('crm_jobs', function (Blueprint $table) {
            $table->foreignId('job_type_id')->nullable()->after('job_info')->constrained('job_types')->restrictOnDelete();
        });

        foreach (DB::table('companies')->pluck('id') as $companyId) {
            \App\Models\JobType::seedDefaultsForCompany((int) $companyId);
        }

        $jobs = DB::table('crm_jobs')
            ->select('id', 'company_id', 'job_type')
            ->whereNotNull('job_type')
            ->get();

        foreach ($jobs as $job) {
            $typeId = DB::table('job_types')
                ->where('company_id', $job->company_id)
                ->where('name', $job->job_type)
                ->value('id');

            if (! $typeId) {
                $typeId = DB::table('job_types')->insertGetId([
                    'company_id' => $job->company_id,
                    'name' => $job->job_type,
                    'sort_order' => 1000,
                    'is_other' => $job->job_type === 'Other',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            DB::table('crm_jobs')->where('id', $job->id)->update(['job_type_id' => $typeId]);
        }

        Schema::table('crm_jobs', function (Blueprint $table) {
            $table->dropColumn('job_type');
        });
    }

    public function down(): void
    {
        Schema::table('crm_jobs', function (Blueprint $table) {
            $table->string('job_type')->nullable()->after('job_info');
        });

        $jobs = DB::table('crm_jobs')
            ->join('job_types', 'crm_jobs.job_type_id', '=', 'job_types.id')
            ->select('crm_jobs.id', 'job_types.name')
            ->get();

        foreach ($jobs as $row) {
            DB::table('crm_jobs')->where('id', $row->id)->update(['job_type' => $row->name]);
        }

        Schema::table('crm_jobs', function (Blueprint $table) {
            $table->dropForeign(['job_type_id']);
            $table->dropColumn('job_type_id');
        });

        Schema::dropIfExists('job_types');
    }
};
