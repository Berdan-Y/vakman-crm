<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('whatsapp_message_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained('companies')->cascadeOnDelete();
            $table->foreignId('whatsapp_credential_id')->nullable()->constrained('whatsapp_credentials')->nullOnDelete();
            $table->string('recipient_phone', 20);
            $table->string('direction', 10); // outbound, inbound
            $table->string('message_type', 20)->default('text'); // text, template
            $table->text('body_or_template_name')->nullable();
            $table->json('template_variables')->nullable();
            $table->string('meta_message_id')->nullable();
            $table->string('status', 20)->default('sent'); // sent, delivered, read, failed
            $table->text('error_message')->nullable();
            $table->string('context_type')->nullable(); // e.g. App\Models\Job
            $table->unsignedBigInteger('context_id')->nullable();
            $table->timestamps();

            $table->index(['company_id', 'created_at']);
            $table->index(['recipient_phone', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('whatsapp_message_logs');
    }
};
