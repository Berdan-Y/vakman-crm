<?php

use App\Models\Job;
use Carbon\Carbon;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->string('payment_method', 16)->default('card')->after('type');
            $table->string('invoice_number')->nullable()->after('payment_method');
        });

        $this->backfillInvoiceNumbers();
    }

    public function down(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->dropColumn(['payment_method', 'invoice_number']);
        });
    }

    private function backfillInvoiceNumbers(): void
    {
        $companyIds = Job::query()->distinct()->pluck('company_id');

        foreach ($companyIds as $companyId) {
            $rows = DB::table('invoices')
                ->join('crm_jobs', 'invoices.crm_job_id', '=', 'crm_jobs.id')
                ->where('crm_jobs.company_id', $companyId)
                ->orderBy('invoices.created_at')
                ->orderBy('invoices.id')
                ->select('invoices.id', 'invoices.created_at')
                ->get();

            $byDay = [];
            foreach ($rows as $row) {
                $day = Carbon::parse($row->created_at)->toDateString();
                $byDay[$day] ??= [];
                $byDay[$day][] = $row->id;
            }

            foreach ($byDay as $dateStr => $dayIds) {
                $d = Carbon::parse($dateStr)->format('Ymd');
                $n = 0;
                foreach ($dayIds as $id) {
                    $n++;
                    DB::table('invoices')->where('id', $id)->update([
                        'payment_method' => 'card',
                        'invoice_number' => 'INV-'.$d.'-'.$n,
                    ]);
                }
            }
        }
    }
};
