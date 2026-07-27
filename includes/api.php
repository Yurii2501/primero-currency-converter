<?php

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

function get_currency_rates() {

    $fallback_rates = [
        'USD' => 1.0,
        'EUR' => 0.85,
        'GBP' => 0.73,
        'RUB' => 78.0,
        'ARS' => 1530.0,
    ];

    $cache_minutes = (int) get_option('primero_currency_cache_minutes', 60);

    $cached_rates = get_transient('primero_currency_rates');

    if ($cached_rates !== false) {
        return $cached_rates;
    }

    $api_source = get_option('primero_currency_api_source', 'fawaz');

    $sources = ($api_source === 'frankfurter')
        ? ['frankfurter', 'fawaz']
        : ['fawaz', 'frankfurter'];

    foreach ($sources as $source) {

        $rates = primero_fetch_rates_from_source($source);

        if (!empty($rates) && isset($rates['USD'])) {

            set_transient(
                'primero_currency_rates',
                $rates,
                $cache_minutes * MINUTE_IN_SECONDS
            );

            update_option(
                'primero_currency_rates_updated_at',
                current_time('mysql')
            );

            update_option(
                'primero_currency_last_api_source',
                $source
            );

            return $rates;
        }
    }

    return $fallback_rates;
}

function primero_fetch_rates_from_source($source) {

    if ($source === 'frankfurter') {

        $url = 'https://api.frankfurter.app/latest?from=USD';

    } else {

        $url = 'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json';
    }

    $response = wp_remote_get(
        $url,
        [
            'timeout' => 15,
        ]
    );

    if (is_wp_error($response)) {
        return [];
    }

    if (wp_remote_retrieve_response_code($response) !== 200) {
        return [];
    }

    $body = wp_remote_retrieve_body($response);

    $data = json_decode($body, true);

    if (!is_array($data)) {
        return [];
    }

    $rates = [
        'USD' => 1.0,
    ];

    $currencies = get_supported_currencies();

    if ($source === 'frankfurter') {

        if (!isset($data['rates'])) {
            return [];
        }

        foreach ($currencies as $code => $name) {

            if ($code === 'USD') {
                continue;
            }

            if (isset($data['rates'][$code])) {
                $rates[$code] = (float) $data['rates'][$code];
            }
        }

    } else {

        if (!isset($data['usd'])) {
            return [];
        }

        foreach ($currencies as $code => $name) {

            if ($code === 'USD') {
                continue;
            }

            $lower = strtolower($code);

            if (isset($data['usd'][$lower])) {
                $rates[$code] = (float) $data['usd'][$lower];
            }
        }
    }

    return $rates;
}

function get_currency_history( $from_currency, $to_currency, $days = 7 ) {

    $allowed_days = [ 7, 30, 90 ];

    $from_currency = strtoupper( sanitize_key( $from_currency ) );
    $to_currency   = strtoupper( sanitize_key( $to_currency ) );
    $days          = absint( $days );

    if ( ! in_array( $days, $allowed_days, true ) ) {
        $days = 7;
    }

    $currencies = get_supported_currencies();

    if (
        ! isset( $currencies[ $from_currency ] ) ||
        ! isset( $currencies[ $to_currency ] )
    ) {
        return [];
    }

    if ( $from_currency === $to_currency ) {

        $history = [];

        for ( $i = $days - 1; $i >= 0; $i-- ) {
            $history[] = [
                'date' => wp_date( 'Y-m-d', strtotime( "-{$i} days" ) ),
                'rate' => 1.0,
            ];
        }

        return $history;
    }

    $api_source = get_option(
        'primero_currency_api_source',
        'fawaz'
    );

    $cache_key = sprintf(
        'primero_history_%s_%s_%d_%s',
        strtolower( $from_currency ),
        strtolower( $to_currency ),
        $days,
        $api_source
    );

    $cached_history = get_transient( $cache_key );

    if ( false !== $cached_history && is_array( $cached_history ) ) {
        return $cached_history;
    }

    $history  = [];
    $from_key = strtolower( $from_currency );
    $to_key   = strtolower( $to_currency );

    for ( $i = $days - 1; $i >= 0; $i-- ) {

        $timestamp = strtotime( "-{$i} days" );
        $date      = wp_date( 'Y-m-d', $timestamp );

        if ( 'frankfurter' === $api_source ) {

            $url = add_query_arg(
                [
                    'from' => $from_currency,
                    'to'   => $to_currency,
                ],
                'https://api.frankfurter.app/' . rawurlencode( $date )
            );

        } else {

            $url = sprintf(
                'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@%s/v1/currencies/%s.json',
                rawurlencode( $date ),
                rawurlencode( $from_key )
            );
        }

        $response = wp_remote_get(
            $url,
            [
                'timeout' => 15,
            ]
        );

        if ( is_wp_error( $response ) ) {
            continue;
        }

        if ( 200 !== wp_remote_retrieve_response_code( $response ) ) {
            continue;
        }

        $body = wp_remote_retrieve_body( $response );
$data = json_decode( $body, true );

if (
    JSON_ERROR_NONE !== json_last_error() ||
    ! is_array( $data )
) {
    continue;
}

        if ( 'frankfurter' === $api_source ) {

            if (
                ! isset( $data['rates'][ $to_currency ] ) ||
                ! is_numeric( $data['rates'][ $to_currency ] )
            ) {
                continue;
            }

            $rate = (float) $data['rates'][ $to_currency ];

        } else {

            if (
                ! isset( $data[ $from_key ][ $to_key ] ) ||
                ! is_numeric( $data[ $from_key ][ $to_key ] )
            ) {
                continue;
            }

            $rate = (float) $data[ $from_key ][ $to_key ];
        }

        $history[] = [
            'date' => $date,
            'rate' => round( $rate, 6 ),
        ];
    }

    if ( ! empty( $history ) ) {
        set_transient(
            $cache_key,
            $history,
            6 * HOUR_IN_SECONDS
        );
    }

    return $history;
}