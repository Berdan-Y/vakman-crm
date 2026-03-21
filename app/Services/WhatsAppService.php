<?php

namespace App\Services;

use App\Models\Job;
use App\Models\WhatsAppCredential;
use App\Models\WhatsAppMessageLog;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class WhatsAppService
{
    protected string $baseUrl;

    public function __construct()
    {
        $version = config('whatsapp.api_version', 'v21.0');
        $this->baseUrl = config('whatsapp.base_url', 'https://graph.facebook.com').'/'.ltrim($version, '/');
    }

    /**
     * Get WhatsApp credentials for a company: DB first, then env fallback.
     */
    public function getCredentialsForCompany(?int $companyId): ?array
    {
        if ($companyId) {
            $credential = WhatsAppCredential::where('company_id', $companyId)->first();
            if ($credential && $credential->isUsable()) {
                return [
                    'phone_number_id' => $credential->phone_number_id,
                    'access_token' => $credential->getDecryptedAccessToken(),
                    'credential_id' => $credential->id,
                    'credential_source' => 'company',
                ];
            }
        }

        $token = config('whatsapp.access_token');
        $phoneNumberId = config('whatsapp.phone_number_id');
        if ($token && $phoneNumberId) {
            return [
                'phone_number_id' => $phoneNumberId,
                'access_token' => $token,
                'credential_id' => null,
                'credential_source' => 'env',
            ];
        }

        return null;
    }

    /**
     * Send a text message via WhatsApp Cloud API.
     *
     * @param  array{phone_number_id: string, access_token: string, credential_id: int|null}  $credentials
     */
    public function sendTextMessage(
        string $to,
        string $text,
        int $companyId,
        ?array $credentials = null,
        ?string $contextType = null,
        ?int $contextId = null
    ): array {
        $credentials = $credentials ?? $this->getCredentialsForCompany($companyId);
        if (! $credentials) {
            Log::warning('WhatsApp: No credentials available for company.', ['company_id' => $companyId]);

            return ['success' => false, 'message' => __('WhatsApp is not connected. Configure credentials in settings.')];
        }

        $phone = $this->toE164($this->normalizePhone($to));
        if (! $this->isValidPhone($phone)) {
            return ['success' => false, 'message' => __('Invalid recipient phone number.')];
        }

        $payload = [
            'messaging_product' => 'whatsapp',
            'recipient_type' => 'individual',
            'to' => $phone,
            'type' => 'text',
            'text' => [
                'preview_url' => false,
                'body' => $text,
            ],
        ];

        return $this->sendMessage($companyId, $credentials, $phone, $payload, 'text', $text, null, $contextType, $contextId);
    }

    /**
     * Send a template message with optional variable components.
     *
     * @param  array<string>  $bodyVariables
     * @param  array<string>  $headerVariables
     * @param  array<array{type: string, text?: string, payload?: string}>  $buttonPayloads
     */
    public function sendTemplateMessage(
        string $to,
        string $templateName,
        array $bodyVariables,
        int $companyId,
        ?array $credentials = null,
        string $languageCode = 'en',
        array $headerVariables = [],
        array $buttonPayloads = [],
        ?string $contextType = null,
        ?int $contextId = null,
    ): array {
        $credentials = $credentials ?? $this->getCredentialsForCompany($companyId);
        if (! $credentials) {
            return ['success' => false, 'message' => __('WhatsApp is not connected. Configure credentials in settings.')];
        }

        $phone = $this->toE164($this->normalizePhone($to));
        if (! $this->isValidPhone($phone)) {
            return ['success' => false, 'message' => __('Invalid recipient phone number.')];
        }

        $components = [];

        if (! empty($headerVariables)) {
            $isNamedHeader = ! empty($headerVariables) && ! array_is_list($headerVariables);
            $headerParams = [];
            foreach ($headerVariables as $key => $v) {
                $param = ['type' => 'text', 'text' => $this->sanitizeTemplateVariable((string) $v)];
                if ($isNamedHeader) {
                    $param['parameter_name'] = $key;
                }
                $headerParams[] = $param;
            }
            $components[] = ['type' => 'header', 'parameters' => $headerParams];
        }

        if (! empty($bodyVariables)) {
            $maxBodyParamLength = 1024;
            $isNamed = ! array_is_list($bodyVariables);
            $params = [];
            foreach ($bodyVariables as $key => $v) {
                $text = $this->sanitizeTemplateVariable(mb_substr((string) $v, 0, $maxBodyParamLength));
                $param = ['type' => 'text', 'text' => $text];
                if ($isNamed) {
                    $param['parameter_name'] = $key;
                }
                $params[] = $param;
            }
            $components[] = [
                'type' => 'body',
                'parameters' => $params,
            ];
        }

        if (! empty($buttonPayloads)) {
            $components[] = [
                'type' => 'button',
                'sub_type' => 'quick_reply',
                'index' => '0',
                'parameters' => array_map(fn ($b) => [
                    'type' => 'payload',
                    'payload' => $b['payload'] ?? $b['text'] ?? '',
                ], $buttonPayloads),
            ];
        }

        $template = [
            'name' => $templateName,
            'language' => [
                'code' => $languageCode,
                'policy' => 'deterministic',
            ],
        ];
        if (! empty($components)) {
            $template['components'] = $components;
        }

        $payload = [
            'messaging_product' => 'whatsapp',
            'to' => $phone,
            'type' => 'template',
            'template' => $template,
        ];

        return $this->sendMessage(
            $companyId,
            $credentials,
            $phone,
            $payload,
            'template',
            null,
            ['name' => $templateName, 'variables' => $bodyVariables],
            $contextType,
            $contextId
        );
    }

    /**
     * Send job details to the assigned employee via WhatsApp.
     * Uses Cloud API when credentials exist; otherwise logs (mock) and returns message.
     */
    public function sendJobToEmployee(Job $job): array
    {
        $job->load(['customer', 'employee', 'jobType']);
        if (! $job->employee) {
            return ['success' => false, 'message' => __('No employee assigned to this job.')];
        }

        $phone = $this->toE164($this->normalizePhone($job->employee->phone ?? ''));
        if (! $this->isValidPhone($phone)) {
            return ['success' => false, 'message' => __('Employee has no valid phone number for WhatsApp.')];
        }

        $companyId = (int) $job->company_id;
        $credentials = $this->getCredentialsForCompany($companyId);

        $message = $this->formatJobMessage($job);

        if ($credentials) {
            $templateName = config('whatsapp.job_notification_template');
            if ($templateName) {
                return $this->sendTemplateMessage(
                    $phone,
                    $templateName,
                    $this->getJobTemplateBodyVariables($job),
                    $companyId,
                    $credentials,
                    config('whatsapp.job_notification_language', 'en'),
                    [],
                    [],
                    Job::class,
                    (int) $job->id,
                );
            }

            return $this->sendTextMessage(
                $phone,
                $message,
                $companyId,
                $credentials,
                Job::class,
                (int) $job->id
            );
        }

        Log::channel('stack')->info('WhatsApp mock send (no credentials)', [
            'to' => $phone,
            'job_id' => $job->id,
            'company_id' => $companyId,
        ]);
        if (config('app.debug')) {
            info('[WhatsApp Mock] To: '.$phone."\nMessage:\n".$message);
        }

        return ['success' => true, 'message' => __('Job details would be sent after connecting WhatsApp in settings.')];
    }

    /**
     * Execute send request and log result.
     */
    protected function sendMessage(
        int $companyId,
        array $credentials,
        string $recipientPhone,
        array $payload,
        string $messageType,
        ?string $bodyText,
        ?array $templateInfo,
        ?string $contextType,
        ?int $contextId
    ): array {
        $url = $this->baseUrl.'/'.$credentials['phone_number_id'].'/messages';

        try {
            $response = Http::withToken($credentials['access_token'])
                ->timeout(15)
                ->post($url, $payload);

            $data = $response->json();
            $metaMessageId = $data['messages'][0]['id'] ?? null;

            if ($response->successful() && $metaMessageId) {
                $this->logMessage($companyId, $credentials['credential_id'] ?? null, $recipientPhone, 'outbound', $messageType, $bodyText, $templateInfo, $metaMessageId, 'sent', null, $contextType, $contextId);
                Log::info('WhatsApp message sent', [
                    'to' => $recipientPhone,
                    'message_id' => $metaMessageId,
                ]);

                return [
                    'success' => true,
                    'message' => __('Message sent.'),
                    'message_id' => $metaMessageId,
                ];
            }

            $errorMessage = $data['error']['message'] ?? $response->body();
            $errorCode = $data['error']['code'] ?? $response->status();
            $this->logMessage($companyId, $credentials['credential_id'] ?? null, $recipientPhone, 'outbound', $messageType, $bodyText, $templateInfo, null, 'failed', $errorMessage, $contextType, $contextId);
            Log::warning('WhatsApp send failed', ['to' => $recipientPhone, 'error' => $errorMessage, 'code' => $errorCode]);

            return ['success' => false, 'message' => $errorMessage ?: __('Failed to send message.')];
        } catch (\Throwable $e) {
            $this->logMessage($companyId, $credentials['credential_id'] ?? null, $recipientPhone, 'outbound', $messageType, $bodyText, $templateInfo, null, 'failed', $e->getMessage(), $contextType, $contextId);
            Log::error('WhatsApp send exception', ['to' => $recipientPhone, 'exception' => $e->getMessage()]);

            return ['success' => false, 'message' => $e->getMessage()];
        }
    }

    protected function logMessage(
        int $companyId,
        ?int $credentialId,
        string $recipientPhone,
        string $direction,
        string $messageType,
        ?string $bodyOrTemplate,
        ?array $templateVariables,
        ?string $metaMessageId,
        string $status,
        ?string $errorMessage,
        ?string $contextType,
        ?int $contextId
    ): void {
        WhatsAppMessageLog::create([
            'company_id' => $companyId,
            'whatsapp_credential_id' => $credentialId,
            'recipient_phone' => $recipientPhone,
            'direction' => $direction,
            'message_type' => $messageType,
            'body_or_template_name' => $bodyOrTemplate ?? ($templateVariables['name'] ?? null),
            'template_variables' => $templateVariables,
            'meta_message_id' => $metaMessageId,
            'status' => $status,
            'error_message' => $errorMessage,
            'context_type' => $contextType,
            'context_id' => $contextId,
        ]);
    }

    /**
     * Named body variables for the job_confirmation template.
     * Keys must match the content variable names defined in Meta.
     */
    private function getJobTemplateBodyVariables(Job $job): array
    {
        $empty = '-';
        $recommendationLabels = config('whatsapp.template_recommendation_labels') ?? config('job_options.recommendation', []);
        $jobInfoLabels = config('whatsapp.template_job_info_labels') ?? config('job_options.job_info', []);
        $recommendation = $job->recommendation ? ($recommendationLabels[$job->recommendation] ?? $job->recommendation) : $empty;
        $jobInfo = is_array($job->job_info) && count($job->job_info) > 0
            ? implode(', ', array_map(fn ($key) => $jobInfoLabels[$key] ?? $key, $job->job_info))
            : $empty;
        $jobType = $empty;
        if ($job->jobType) {
            $jobType = $job->jobType->is_other && $job->job_type_other
                ? $job->job_type_other
                : $job->jobType->name;
        }
        $scheduledTime = $job->scheduled_time
            ? (is_string($job->scheduled_time) ? substr($job->scheduled_time, 0, 5) : $job->scheduled_time->format('H:i'))
            : $empty;
        $description = $job->description ? trim(preg_replace('/\s+/', ' ', $job->description)) : $empty;

        $address = str_replace("\u{2014}", '-', $this->formatAddress($job->customer));
        if (trim($address) === '' || trim($address) === '-') {
            $address = $empty;
        }

        return [
            'employee' => (string) ($job->employee?->name ?? $empty),
            'job_recommendation' => (string) $recommendation,
            'job_info' => (string) $jobInfo,
            'job_type' => (string) $jobType,
            'job_details' => (string) $description,
            'job_date' => (string) $job->date->format('d-m-Y'),
            'job_time' => (string) $scheduledTime,
            'job_address' => (string) $address,
            'customer' => (string) ($job->customer?->name ?? $empty),
            'customer_phone' => (string) ($job->customer?->phone ?? $empty),
            'discussed_price' => (string) number_format((float) $job->price, 2, '.', ''),
        ];
    }

    private function formatJobMessage(Job $job): string
    {
        $lines = [
            '🔧 *Job #'.$job->id.'*',
            '',
            $job->description ?: 'No description',
            '',
            '👤 *Customer:* '.($job->customer?->name ?? '—'),
            $job->customer?->phone ? '📞 '.$job->customer->phone : null,
            $job->customer?->email ? '📧 '.$job->customer->email : null,
            '',
            '📍 *Address:*',
            $this->formatAddress($job->customer),
            '',
            '📅 *Date:* '.$job->date->format('d-m-Y'),
            $job->scheduled_time ? '🕐 *Time:* '.(is_string($job->scheduled_time) ? substr($job->scheduled_time, 0, 5) : $job->scheduled_time->format('H:i')) : null,
            '💰 *Price:* € '.number_format((float) $job->price, 2, ',', '.'),
            '',
            'Please confirm receipt and arrival.',
        ];

        return implode("\n", array_filter($lines));
    }

    private function formatAddress($customer): string
    {
        if (! $customer) {
            return '—';
        }

        $streetHouseNumber = $customer->street.' '.$customer->house_number;
        if ($customer->house_number_addition) {
            $streetHouseNumber.$customer->house_number_addition;
        }

        $parts = array_filter([
            $streetHouseNumber,
            $customer->zip_code,
            $customer->city,
        ]);

        return implode(', ', $parts) ?: '—';
    }

    /**
     * Sanitize a template body variable for Meta: remove control chars and formatting chars, ensure non-empty.
     */
    private function sanitizeTemplateVariable(string $value): string
    {
        $sanitized = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $value);
        $sanitized = str_replace(['*', '_', '`'], ' ', $sanitized);
        $sanitized = trim(preg_replace('/\s+/', ' ', $sanitized));

        return $sanitized === '' ? '-' : $sanitized;
    }

    public function normalizePhone(string $phone): string
    {
        return preg_replace('/\D/', '', $phone);
    }

    /**
     * Convert normalized digits to E.164 for WhatsApp API.
     * Dutch local format (06xxxxxxxx) becomes 316xxxxxxxx.
     */
    public function toE164(string $normalized): string
    {
        if (strlen($normalized) === 10 && str_starts_with($normalized, '0')) {
            return '31'.substr($normalized, 1);
        }

        return $normalized;
    }

    public function isValidPhone(string $normalized): bool
    {
        if (strlen($normalized) < 10) {
            return false;
        }

        return true;
    }
}
