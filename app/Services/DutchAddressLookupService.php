<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class DutchAddressLookupService
{
    public function lookup(string $postcode, string $houseNumber, ?string $houseNumberAddition = null): ?array
    {
        $postcode = $this->normalizePostcode($postcode);
        $houseNumber = trim($houseNumber);
        $addition = $houseNumberAddition ? trim($houseNumberAddition) : null;

        if (config('services.postcode.key')) {
            return $this->fetchFromApi($postcode, $houseNumber, $addition);
        }

        return $this->mockLookup($postcode, $houseNumber, $addition);
    }

    private function normalizePostcode(string $postcode): string
    {
        $postcode = strtoupper(preg_replace('/\s+/', '', $postcode));

        if (preg_match('/^(\d{4})\s*([A-Z]{2})$/i', $postcode, $m)) {
            return $m[1].' '.$m[2];
        }
        if (strlen($postcode) === 6 && ctype_digit(substr($postcode, 0, 4)) && ctype_alpha(substr($postcode, 4, 2))) {
            return substr($postcode, 0, 4).' '.substr($postcode, 4, 2);
        }

        return $postcode;
    }

    private function fetchFromApi(string $postcode, string $houseNumber, ?string $addition): ?array
    {
        $url = rtrim(config('services.postcode.url'), '/');
        $path = '/rest/addresses/'.$postcode.'/'.$houseNumber;
        if ($addition) {
            $path .= '/'.$addition;
        }

        $response = Http::withBasicAuth(config('services.postcode.key'), config('services.postcode.secret', ''))
            ->get($url.$path);

        if (! $response->successful()) {
            return null;
        }

        $data = $response->json();
        if (! $data) {
            return null;
        }

        return [
            'street' => $data['street'] ?? '',
            'city' => $data['city'] ?? '',
            'municipality' => $data['municipality'] ?? '',
            'province' => $data['province'] ?? '',
            'postcode' => $postcode,
            'house_number' => $houseNumber.($addition ? ' '.$addition : ''),
        ];
    }

    /**
     * Mock response for development when no API key is configured.
     */
    private function mockLookup(string $postcode, string $houseNumber, ?string $addition): ?array
    {
        $normalized = $this->normalizePostcode($postcode);
        $isValid = strlen($normalized) === 7 && preg_match('/^\d{4}\s[A-Z]{2}$/', $normalized);

        if (! $isValid || ! $houseNumber) {
            return null;
        }

        $streets = [
            '1012 AB' => ['Damrak', 'Amsterdam'],
            '3011 AA' => ['Coolsingel', 'Rotterdam'],
            '3511 AB' => ['Oudegracht', 'Utrecht'],
            '5611 AB' => ['Stratumseind', 'Eindhoven'],
        ];
        [$street, $city] = $streets[$normalized] ?? ['Hoofdstraat', 'Amsterdam'];

        return [
            'street' => $street,
            'city' => $city,
            'municipality' => $city,
            'province' => 'Noord-Holland',
            'postcode' => $normalized,
            'house_number' => $houseNumber.($addition ? ' '.$addition : ''),
        ];
    }
}
