<?php

namespace App\Http\Controllers;

use App\Models\WhatsAppCredential;
use App\Services\WhatsAppService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class WhatsAppController extends Controller
{
    public function __construct(
        private WhatsAppService $whatsApp
    ) {}

    /**
     * Connect a business WhatsApp number: store credentials for the current company.
     * Expects phone_number_id, access_token, and optional meta_business_id, business_name, waba_phone_number.
     */
    public function connect(Request $request): JsonResponse
    {
        $companyId = session('current_company_id');
        if (! $companyId) {
            return response()->json(['success' => false, 'message' => __('No company selected.')], 422);
        }

        $validated = $request->validate([
            'phone_number_id' => ['required', 'string', 'max:255'],
            'access_token' => ['required', 'string'],
            'meta_business_id' => ['nullable', 'string', 'max:255'],
            'business_name' => ['nullable', 'string', 'max:255'],
            'waba_phone_number' => ['nullable', 'string', 'max:30'],
        ]);

        $accessToken = trim($validated['access_token']);

        $credential = WhatsAppCredential::updateOrCreate(
            ['company_id' => $companyId],
            [
                'meta_business_id' => $validated['meta_business_id'] ?? null,
                'business_name' => $validated['business_name'] ?? null,
                'phone_number_id' => trim($validated['phone_number_id']),
                'waba_phone_number' => $validated['waba_phone_number'] ? trim($validated['waba_phone_number']) : null,
                'access_token' => $accessToken,
                'status' => 'active',
                'is_verified' => ! empty($validated['meta_business_id']),
            ]
        );

        Log::info('WhatsApp credentials connected', ['company_id' => $companyId]);

        return response()->json([
            'success' => true,
            'message' => __('WhatsApp connected successfully.'),
            'credential' => [
                'id' => $credential->id,
                'phone_number_id' => $credential->phone_number_id,
                'waba_phone_number' => $credential->waba_phone_number,
                'business_name' => $credential->business_name,
            ],
        ]);
    }

    /**
     * Disconnect WhatsApp for the current company.
     */
    public function disconnect(Request $request): JsonResponse
    {
        $companyId = session('current_company_id');
        if (! $companyId) {
            return response()->json(['success' => false, 'message' => __('No company selected.')], 422);
        }

        $deleted = WhatsAppCredential::where('company_id', $companyId)->delete();
        if ($deleted) {
            Log::info('WhatsApp credentials disconnected', ['company_id' => $companyId]);
        }

        return response()->json([
            'success' => true,
            'message' => __('WhatsApp disconnected.'),
        ]);
    }

    /**
     * Get current connection status for the company.
     * "Connected" means this company has a stored credential (Settings → Integrations).
     * When false, the UI shows the connect form even if .env fallback exists for sending.
     */
    public function status(Request $request): JsonResponse
    {
        $companyId = session('current_company_id');
        $credential = $companyId ? WhatsAppCredential::where('company_id', $companyId)->first() : null;

        return response()->json([
            'connected' => (bool) $credential,
            'credential' => $credential ? [
                'id' => $credential->id,
                'phone_number_id' => $credential->phone_number_id,
                'waba_phone_number' => $credential->waba_phone_number,
                'business_name' => $credential->business_name,
                'is_verified' => $credential->is_verified,
                'status' => $credential->status,
            ] : null,
        ]);
    }

    /**
     * Send a WhatsApp message: text or template with variables.
     */
    public function send(Request $request): JsonResponse
    {
        $companyId = session('current_company_id');
        if (! $companyId) {
            return response()->json(['success' => false, 'message' => __('No company selected.')], 422);
        }

        $validated = $request->validate([
            'to' => ['required', 'string', 'max:30'],
            'message' => ['required_without:template_name', 'nullable', 'string', 'max:4096'],
            'template_name' => ['required_without:message', 'nullable', 'string', 'max:255'],
            'template_language' => ['nullable', 'string', 'max:10'],
            'template_body_variables' => ['nullable', 'array'],
            'template_body_variables.*' => ['string', 'max:1000'],
        ]);

        if (! empty($validated['template_name'])) {
            $result = $this->whatsApp->sendTemplateMessage(
                $validated['to'],
                $validated['template_name'],
                $validated['template_body_variables'] ?? [],
                $companyId,
                null,
                $validated['template_language'] ?? 'en'
            );
        } else {
            $result = $this->whatsApp->sendTextMessage(
                $validated['to'],
                $validated['message'] ?? '',
                $companyId
            );
        }

        return response()->json($result, $result['success'] ? 200 : 422);
    }

    /**
     * Webhook: GET for Meta verification.
     */
    public function webhookVerify(Request $request): \Illuminate\Http\Response|string
    {
        $mode = $request->query('hub_mode');
        $token = $request->query('hub_verify_token');
        $challenge = $request->query('hub_challenge');

        $expectedToken = config('whatsapp.webhook_verify_token');
        if ($mode === 'subscribe' && $token === $expectedToken) {
            Log::info('WhatsApp webhook verified');

            return response($challenge, 200)->header('Content-Type', 'text/plain');
        }

        abort(403);
    }

    /**
     * Webhook: POST for incoming events from Meta.
     */
    public function webhook(Request $request): JsonResponse
    {
        $payload = $request->all();

        if (isset($payload['object']) && $payload['object'] === 'whatsapp_business_account') {
            foreach ($payload['entry'] ?? [] as $entry) {
                foreach ($entry['changes'] ?? [] as $change) {
                    if (($change['field'] ?? '') === 'messages') {
                        $value = $change['value'] ?? [];
                        $messages = $value['messages'] ?? [];
                        foreach ($messages as $message) {
                            $this->handleIncomingMessage($message, $value);
                        }
                    }
                }
            }
        }

        return response()->json(['ok' => true]);
    }

    protected function handleIncomingMessage(array $message, array $value): void
    {
        try {
            $from = $message['from'] ?? null;
            $id = $message['id'] ?? null;
            $type = $message['type'] ?? 'unknown';
            $timestamp = $message['timestamp'] ?? null;

            Log::info('WhatsApp incoming message', [
                'from' => $from,
                'message_id' => $id,
                'type' => $type,
            ]);

            // Optional: persist inbound to whatsapp_message_logs if you have company/credential mapping from value
            // $phoneNumberId = $value['metadata']['phone_number_id'] ?? null;
        } catch (\Throwable $e) {
            Log::error('WhatsApp webhook handle error', ['message' => $e->getMessage()]);
        }
    }
}
