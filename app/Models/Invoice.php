<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Invoice extends Model
{
    use HasFactory;

    public const TYPE_CUSTOMER = 'customer';

    public const TYPE_EMPLOYEE = 'employee';

    public const STATUS_DRAFT = 'draft';

    public const STATUS_SENT = 'sent';

    public const STATUS_PAID = 'paid';

    protected $fillable = [
        'crm_job_id',
        'type',
        'recipient_email',
        'recipient_name',
        'amount',
        'subtotal',
        'tax_amount',
        'total_incl_tax',
        'status',
        'sent_at',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'subtotal' => 'decimal:2',
            'tax_amount' => 'decimal:2',
            'total_incl_tax' => 'decimal:2',
            'sent_at' => 'datetime',
        ];
    }

    public function job(): BelongsTo
    {
        return $this->belongsTo(Job::class, 'crm_job_id');
    }

    public function lines(): HasMany
    {
        return $this->hasMany(InvoiceLine::class)->orderBy('order');
    }
}
