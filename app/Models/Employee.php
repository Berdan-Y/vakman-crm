<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Employee extends Model
{
    use HasFactory;

    protected $fillable = [
        'company_id',
        'user_id',
        'name',
        'email',
        'phone',
        'street',
        'house_number',
        'zip_code',
        'city',
        'kvk_number',
        'vat_number',
        'role',
        'join_date',
        'invitation_token',
        'invitation_sent_at',
        'invitation_accepted_at',
    ];

    protected function casts(): array
    {
        return [
            'join_date' => 'date',
            'invitation_sent_at' => 'datetime',
            'invitation_accepted_at' => 'datetime',
        ];
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function jobs(): HasMany
    {
        return $this->hasMany(Job::class, 'employee_id');
    }
}
