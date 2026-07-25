<?php

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

function convert_currency( $amount, $from_currency, $to_currency, $rates ) {

    $amount = (float) $amount;

    if ( $amount < 0 ) {
        return 0;
    }

    if (
        ! isset( $rates[ $from_currency ] ) ||
        ! isset( $rates[ $to_currency ] )
    ) {
        return 0;
    }

    if ( (float) $rates[ $from_currency ] <= 0 ) {
        return 0;
    }

    $usd_amount = $amount / (float) $rates[ $from_currency ];

    return round(
        $usd_amount * (float) $rates[ $to_currency ],
        6
    );
}

function get_favorite_currencies() {

    $value = get_option('primero_currency_favorite_currencies', 'USD,EUR,ARS');

    $currencies = explode(',', $value);

    $currencies = array_map('trim', $currencies);
    $currencies = array_map('strtoupper', $currencies);

    return array_filter($currencies);
}

    function get_supported_currencies() {

    $favorites = get_favorite_currencies();

    $currencies_file = plugin_dir_path( __FILE__ ) . 'currencies.php';

    if ( ! file_exists( $currencies_file ) ) {
        return [];
    }

    $currencies = require $currencies_file;

    if ( ! is_array( $currencies ) ) {
        return [];
    }

    $sorted = [];

    foreach ( $favorites as $code ) {
        $code = strtoupper( sanitize_key( $code ) );

        if ( isset( $currencies[ $code ] ) ) {
            $sorted[ $code ] = '⭐ ' . $currencies[ $code ];
        }
    }

    foreach ( $currencies as $code => $name ) {
        if ( ! isset( $sorted[ $code ] ) ) {
            $sorted[ $code ] = $name;
        }
    }

    return $sorted;
}

function get_api_supported_currencies() {

    $cached_currencies = get_transient('primero_supported_currencies');

    if ($cached_currencies !== false) {
        return $cached_currencies;
    } // $cached_currencies = get_transient('primero_supported_currencies');

// if ($cached_currencies !== false) {
//     return $cached_currencies;
// }

    $response = wp_remote_get(
        'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies.json'
    );

    if (is_wp_error($response)) {
        return get_supported_currencies();
    }

    $status_code = wp_remote_retrieve_response_code($response);

    if ($status_code !== 200) {
        return get_supported_currencies();
    }

    $body = wp_remote_retrieve_body($response);
    $data = json_decode($body, true);

    if (!is_array($data)) {
        return get_supported_currencies();
    }

    $currencies = [];

    foreach ($data as $code => $name) {
        $upper_code = strtoupper($code);
        $flags = [
    'USD' => '🇺🇸',
    'EUR' => '🇪🇺',
    'GBP' => '🇬🇧',
    'ARS' => '🇦🇷',
    'RUB' => '🇷🇺',
    'JPY' => '🇯🇵',
    'CNY' => '🇨🇳',
    'KGS' => '🇰🇬',
    'KZT' => '🇰🇿',
    'TRY' => '🇹🇷',
    'AED' => '🇦🇪',
    'UAH' => '🇺🇦',
    'BRL' => '🇧🇷',
    'CAD' => '🇨🇦',
    'AUD' => '🇦🇺',
    'CHF' => '🇨🇭',
    'INR' => '🇮🇳',
];

$flag = $flags[$upper_code] ?? '🌐';

$currencies[$upper_code] = $flag . ' ' . strtoupper($upper_code) . ' — ' . ucfirst($name);
    }

    set_transient(
        'primero_supported_currencies',
        $currencies,
        DAY_IN_SECONDS
    );

    return $currencies;
}