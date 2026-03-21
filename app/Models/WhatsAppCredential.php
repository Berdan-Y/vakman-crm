<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Crypt;

class WhatsAppCredential extends Model
{
    protected $table = 'whatsapp_credentials';

    protected $fillable = [
        'company_id',
        'meta_business_id',
        'business_name',
        'phone_number_id',
        'waba_phone_number',
        'access_token',
        'token_expires_at',
        'is_verified',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'token_expires_at' => 'datetime',
            'is_verified' => 'boolean',
        ];
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function messageLogs(): HasMany
    {
        return $this->hasMany(WhatsAppMessageLog::class, 'whatsapp_credential_id');
    }

    public function getDecryptedAccessToken(): string
    {
        try {
            return Crypt::decryptString($this->access_token);
        } catch (\Throwable) {
            return (string) $this->access_token;
        }
    }

    public function setAccessTokenAttribute(string $value): void
    {
        $this->attributes['access_token'] = Crypt::encryptString($value);
    }

    public function isUsable(): bool
    {
        return $this->status === 'active'
            && $this->phone_number_id
            && $this->access_token
            && (! $this->token_expires_at || $this->token_expires_at->isFuture());
    }
}
