<?php

namespace App\Models;

use Carbon\CarbonInterface;
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

    public const PAYMENT_CARD = 'card';

    public const PAYMENT_CASH = 'cash';

    protected $fillable = [
        'company_id',
        'crm_job_id',
        'type',
        'payment_method',
        'invoice_number',
        'recipient_email',
        'recipient_name',
        'recipient_vat_number',
        'billing_customer_id',
        'billing_employee_id',
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

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function job(): BelongsTo
    {
        return $this->belongsTo(Job::class, 'crm_job_id');
    }

    public function billingCustomer(): BelongsTo
    {
        return $this->belongsTo(Customer::class, 'billing_customer_id');
    }

    public function billingEmployee(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'billing_employee_id');
    }

    public function lines(): HasMany
    {
        return $this->hasMany(InvoiceLine::class)->orderBy('order');
    }

    /**
     * Next reference for card invoices sent on $sentAt: INV-YYYYMMDD-n.
     * Only sent invoices (with sent_at and a number) count; drafts never receive a number.
     */
    public static function generateNextReferenceNumber(self $invoice, CarbonInterface $sentAt): string
    {
        $invoice->loadMissing('job');
        $companyId = (int) ($invoice->company_id ?? $invoice->job?->company_id);
        $date = $sentAt->copy()->startOfDay();
        $prefix = 'INV-'.$date->format('Ymd').'-';

        $query = self::query()
            ->where('company_id', $companyId)
            ->whereDate('sent_at', $date->toDateString())
            ->where('payment_method', self::PAYMENT_CARD)
            ->whereNotNull('invoice_number')
            ->whereNotNull('sent_at');

        if ($invoice->exists) {
            $query->where('id', '!=', $invoice->id);
        }

        $max = 0;
        foreach ($query->pluck('invoice_number') as $ref) {
            if (preg_match('/-(\d+)$/', (string) $ref, $m)) {
                $max = max($max, (int) $m[1]);
            }
        }

        return $prefix.($max + 1);
    }

    /**
     * Assign a card reference when the invoice is sent (not for drafts or cash).
     */
    public function assignCardInvoiceNumberIfNeeded(CarbonInterface $sentAt): void
    {
        if ($this->payment_method !== self::PAYMENT_CARD) {
            $this->invoice_number = null;

            return;
        }

        if ($this->invoice_number !== null) {
            return;
        }

        $this->invoice_number = self::generateNextReferenceNumber($this, $sentAt);
    }
}
