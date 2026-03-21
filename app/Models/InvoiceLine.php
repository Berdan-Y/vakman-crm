<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InvoiceLine extends Model
{
    use HasFactory;

    protected $fillable = [
        'invoice_id',
        'description',
        'quantity',
        'unit_price',
        'total',
        'tax_rate',
        'tax_amount',
        'order',
    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'decimal:2',
            'unit_price' => 'decimal:2',
            'total' => 'decimal:2',
            'tax_rate' => 'decimal:2',
            'tax_amount' => 'decimal:2',
            'order' => 'integer',
        ];
    }

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class);
    }
}
