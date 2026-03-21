<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Meta / WhatsApp Cloud API
    |--------------------------------------------------------------------------
    */

    'api_version' => env('META_WHATSAPP_API_VERSION', 'v22.0'),
    'base_url' => 'https://graph.facebook.com',

    'app_id' => env('META_APP_ID'),
    'app_secret' => env('META_APP_SECRET'),

    'access_token' => env('META_WHATSAPP_ACCESS_TOKEN'),
    'phone_number_id' => env('META_WHATSAPP_PHONE_NUMBER_ID'),

    'webhook_verify_token' => env('META_WHATSAPP_WEBHOOK_VERIFY_TOKEN', 'vakman-crm-verify'),

    /*
    | Job notification template (optional).
    | When set, job notifications are sent as a template message instead of free-form text.
    | The language code must match the template's language in Meta exactly.
    */
    'job_notification_template' => env('META_WHATSAPP_JOB_TEMPLATE'),
    'job_notification_language' => env('META_WHATSAPP_JOB_TEMPLATE_LANGUAGE', 'en'),

    /*
    | Dutch labels for recommendation and job_info template variables.
    | Falls back to config('job_options') if not set.
    */
    'template_recommendation_labels' => [
        'emergency' => 'Spoed',
        'regular' => 'Regulier',
    ],
    'template_job_info_labels' => [
        'wait_at_neighbors' => 'Wachten bij buren',
        'wait_at_door' => 'Wachten bij de deur',
        'appointment_job' => 'Afspraak',
        'call_15_min_before' => '15 min van tevoren bellen',
        'wait_inside' => 'Binnen wachten',
    ],
];
