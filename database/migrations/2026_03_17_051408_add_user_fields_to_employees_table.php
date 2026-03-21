<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            $table->foreignId('user_id')->nullable()->after('company_id')->constrained('users')->nullOnDelete();
            $table->string('invitation_token')->nullable()->after('user_id');
            $table->timestamp('invitation_sent_at')->nullable()->after('invitation_token');
            $table->timestamp('invitation_accepted_at')->nullable()->after('invitation_sent_at');
        });
    }

    public function down(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
            $table->dropColumn(['user_id', 'invitation_token', 'invitation_sent_at', 'invitation_accepted_at']);
        });
    }
};
