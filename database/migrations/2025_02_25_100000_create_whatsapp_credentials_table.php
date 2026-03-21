<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('whatsapp_credentials', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained('companies')->cascadeOnDelete();
            $table->string('meta_business_id')->nullable();
            $table->string('business_name')->nullable();
            $table->string('phone_number_id'); // WhatsApp Cloud API phone number ID
            $table->string('waba_phone_number')->nullable(); // E.164 display number
            $table->text('access_token'); // encrypted
            $table->timestamp('token_expires_at')->nullable();
            $table->boolean('is_verified')->default(false);
            $table->string('status')->default('active'); // active, revoked, expired
            $table->timestamps();

            $table->unique(['company_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('whatsapp_credentials');
    }
};
