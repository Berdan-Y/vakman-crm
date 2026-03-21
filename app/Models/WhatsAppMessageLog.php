<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class WhatsAppMessageLog extends Model
{
    protected $table = 'whatsapp_message_logs';

    protected $fillable = [
        'company_id',
        'whatsapp_credential_id',
        'recipient_phone',
        'direction',
        'message_type',
        'body_or_template_name',
        'template_variables',
        'meta_message_id',
        'status',
        'error_message',
        'context_type',
        'context_id',
    ];

    protected function casts(): array
    {
        return [
            'template_variables' => 'array',
        ];
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function credential(): BelongsTo
    {
        return $this->belongsTo(WhatsAppCredential::class, 'whatsapp_credential_id');
    }

    public function context(): MorphTo
    {
        return $this->morphTo('context', 'context_type', 'context_id');
    }
}
