<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Company extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'industry',
        'street_address',
        'postal_code',
        'city',
        'country',
        'tax_number',
        'kvk_number',
        'email',
        'account_holder',
        'bank_name',
        'bank_account_number',
    ];

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'company_user')
            ->withPivot('role')
            ->withTimestamps();
    }

    public function owners(): BelongsToMany
    {
        return $this->users()->wherePivot('role', 'owner');
    }

    public function employees(): HasMany
    {
        return $this->hasMany(Employee::class);
    }

    public function customers(): HasMany
    {
        return $this->hasMany(Customer::class);
    }

    public function jobs(): HasMany
    {
        return $this->hasMany(Job::class, 'company_id');
    }

    public function jobTypes(): HasMany
    {
        return $this->hasMany(JobType::class);
    }

    public function whatsappCredential(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(WhatsAppCredential::class, 'company_id');
    }

    /**
     * @return array<string, mixed>
     */
    public function toInertiaArray(string $role): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'industry' => $this->industry,
            'street_address' => $this->street_address,
            'postal_code' => $this->postal_code,
            'city' => $this->city,
            'country' => $this->country,
            'tax_number' => $this->tax_number,
            'kvk_number' => $this->kvk_number,
            'email' => $this->email,
            'account_holder' => $this->account_holder,
            'bank_name' => $this->bank_name,
            'bank_account_number' => $this->bank_account_number,
            'role' => $role,
        ];
    }
}
