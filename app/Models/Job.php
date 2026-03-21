<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Job extends Model
{
    use HasFactory;

    protected $table = 'crm_jobs';

    protected $fillable = [
        'company_id',
        'customer_id',
        'employee_id',
        'description',
        'price',
        'is_paid',
        'date',
        'scheduled_time',
        'recommendation',
        'job_info',
        'job_type_id',
        'job_type_other',
        'invoice_number',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'is_paid' => 'boolean',
            'date' => 'date',
            'job_info' => 'array',
        ];
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    public function jobType(): BelongsTo
    {
        return $this->belongsTo(JobType::class, 'job_type_id');
    }

    public function getDisplayJobTypeAttribute(): ?string
    {
        if (! $this->jobType) {
            return null;
        }

        if ($this->jobType->is_other && $this->job_type_other) {
            return $this->job_type_other;
        }

        return $this->jobType->name;
    }

    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class, 'crm_job_id');
    }
}
