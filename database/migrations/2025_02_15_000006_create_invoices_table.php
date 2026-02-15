<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('invoices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('crm_job_id')->constrained('crm_jobs')->cascadeOnDelete();
            $table->string('type'); // customer, employee
            $table->string('recipient_email');
            $table->string('recipient_name');
            $table->decimal('amount', 12, 2)->default(0);
            $table->string('status')->default('draft'); // draft, sent, paid
            $table->timestamp('sent_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('invoices');
    }
};
