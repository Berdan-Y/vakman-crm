<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class JobType extends Model
{
    protected $fillable = [
        'company_id',
        'name',
        'sort_order',
        'is_other',
    ];

    protected function casts(): array
    {
        return [
            'is_other' => 'boolean',
        ];
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function jobs(): HasMany
    {
        return $this->hasMany(Job::class, 'job_type_id');
    }

    public static function seedDefaultsForCompany(int $companyId): void
    {
        $defaults = config('job_options.job_types', []);
        $sort = 0;
        foreach ($defaults as $name) {
            static::firstOrCreate(
                ['company_id' => $companyId, 'name' => $name],
                [
                    'sort_order' => $sort++,
                    'is_other' => $name === 'Other',
                ]
            );
        }
    }
}
