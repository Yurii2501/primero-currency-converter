<?php

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

function currency_converter_shortcode() {


$amount_value = '';
$from_value = 'USD';
$to_value = 'ARS';


    $nonce = wp_nonce_field(
    'currency_converter_action',
    'currency_converter_nonce',
    true,
    false
);

$currencies = get_supported_currencies();

$from_options = '';
$to_options = '';

foreach ($currencies as $code => $name) {
    $from_options .= '<option value="' . esc_attr($code) . '" ' . selected($from_value, $code, false) . '>' . esc_html($name) . '</option>';

    $to_options .= '<option value="' . esc_attr($code) . '" ' . selected($to_value, $code, false) . '>' . esc_html($name) . '</option>';
}

return '
<div class="primero-currency-converter">

<form method="post" class="currency-converter-form">'
. $nonce .
'

<div class="popular-rates">
    <div class="popular-rate-card">
        <span>🇺🇸 USD</span>
        <strong id="rateUsd">—</strong>
    </div>

    <div class="popular-rate-card">
        <span>🇪🇺 EUR</span>
        <strong id="rateEur">—</strong>
    </div>

    <div class="popular-rate-card">
        <span>🇬🇧 GBP</span>
        <strong id="rateGbp">—</strong>
    </div>
</div>

<div class="converter-header">
    <h2 id="converterTitle">' . esc_html__('Currency Converter', 'primero-currency-converter') . '</h2>

    <div class="language-switcher">
        <button type="button" class="language-button active" data-lang="en">EN</button>
        <button type="button" class="language-button" data-lang="ru">RU</button>
        <button type="button" class="language-button" data-lang="es">ES</button>
    </div>

    <label class="theme-switch">
        <input type="checkbox" id="themeToggle">
        <span class="theme-slider"></span>
    </label>
</div>
<label id="amountLabel">' . esc_html__('Amount', 'primero-currency-converter') . ':</label><br>

<input
    name="amount"
    type="number"
    placeholder="' . esc_attr__('Enter amount', 'primero-currency-converter') . '"
    required
    value="' . esc_attr($amount_value) . '"
>
        <br><br>
<div class="currency-select-group">

    <label id="fromCurrencyLabel">' . esc_html__('From currency', 'primero-currency-converter') . ':</label>

    <select name="from_currency" required>
        ' . $from_options . '
    </select>

    <div class="swap-container">
        <button
            type="button"
            class="swap-currencies-button"
            aria-label="' . esc_attr__('Swap currencies', 'primero-currency-converter') . '"
        >
            ⇅
        </button>
    </div>

    <label id="toCurrencyLabel">' . esc_html__('To currency', 'primero-currency-converter') . ':</label>
    <select name="to_currency" required>
        ' . $to_options . '
    </select>

</div>

<br>

<button
    type="submit"
    class="convert-button"
    id="convertButton"
>
    ' . esc_html__('Convert', 'primero-currency-converter') . '
</button>

<button
    type="submit"
    class="refresh-button"
    id="refreshButton"
    name="refresh_rates"
    value="1"
>
    🔄 ' . esc_html__('Refresh rates', 'primero-currency-converter') . '
</button>
    
</form>

<div class="ajax-result"></div>

<div class="conversion-history">
    <h4 id="historyTitle">🕘 ' . esc_html__('Last conversions', 'primero-currency-converter') . '</h4>
    <div id="conversionHistory"></div>
</div>

' . $result . '

<div class="currency-chart-container">
    <div class="chart-header">
        <h3 id="chartTitle">📈 ' . esc_html__('Exchange rate history', 'primero-currency-converter') . '</h3>

        <div class="chart-period-buttons">
            <button type="button" class="chart-period-button active" data-days="7" id="period7">7D</button>
<button type="button" class="chart-period-button" data-days="30" id="period30">30D</button>
<button type="button" class="chart-period-button" data-days="90" id="period90">90D</button>
        </div>
    </div>

    <canvas id="currencyChart"></canvas>
</div>

<div id="primeroToast" class="primero-toast"></div>

</div>';
}

function primero_convert_currency_ajax_handler() {

    check_ajax_referer( 'primero_currency_nonce', 'nonce' );

    $currencies = get_supported_currencies();

    $amount = isset( $_POST['amount'] )
        ? (float) wp_unslash( $_POST['amount'] )
        : 0;

    $from_currency = isset( $_POST['from_currency'] )
        ? strtoupper( sanitize_text_field( wp_unslash( $_POST['from_currency'] ) ) )
        : '';

    $to_currency = isset( $_POST['to_currency'] )
        ? strtoupper( sanitize_text_field( wp_unslash( $_POST['to_currency'] ) ) )
        : '';

    if ( $amount <= 0 ) {
        wp_send_json_error( [
            'message' => 'Amount must be greater than zero.',
        ] );
    }

    if (
        ! isset( $currencies[ $from_currency ] ) ||
        ! isset( $currencies[ $to_currency ] )
    ) {
        wp_send_json_error( [
            'message' => 'Unsupported currency.',
        ] );
    }

    $rates = get_currency_rates();

    $converted = convert_currency(
        $amount,
        $from_currency,
        $to_currency,
        $rates
    );

    $single_rate = convert_currency(
        1,
        $from_currency,
        $to_currency,
        $rates
    );

    $reverse_rate = convert_currency(
        1,
        $to_currency,
        $from_currency,
        $rates
    );

    wp_send_json_success( [
        'amount'        => number_format( $amount, 2, '.', ' ' ),
        'from_currency' => esc_html( $from_currency ),
        'to_currency'   => esc_html( $to_currency ),
        'converted'     => number_format( $converted, 2, '.', ' ' ),
        'single_rate'   => number_format( $single_rate, 4, '.', ' ' ),
        'reverse_rate'  => number_format( $reverse_rate, 6, '.', ' ' ),
        'updated_at'    => esc_html( get_option( 'primero_currency_rates_updated_at', '' ) ),
        'rate_source'   => esc_html( get_option( 'primero_currency_last_api_source', 'fawaz' ) ),
    ] );
}
add_action('wp_ajax_primero_convert_currency', 'primero_convert_currency_ajax_handler');
add_action('wp_ajax_nopriv_primero_convert_currency', 'primero_convert_currency_ajax_handler');

function primero_currency_history_ajax_handler() {

    check_ajax_referer( 'primero_currency_nonce', 'nonce' );

    $currencies = get_supported_currencies();

    $from_currency = isset( $_POST['from_currency'] )
        ? strtoupper( sanitize_text_field( wp_unslash( $_POST['from_currency'] ) ) )
        : '';

    $to_currency = isset( $_POST['to_currency'] )
        ? strtoupper( sanitize_text_field( wp_unslash( $_POST['to_currency'] ) ) )
        : '';

    if (
        ! isset( $currencies[ $from_currency ] ) ||
        ! isset( $currencies[ $to_currency ] )
    ) {
        wp_send_json_error( [
            'message' => 'Unsupported currency.',
        ] );
    }

    $days = isset( $_POST['days'] )
        ? absint( $_POST['days'] )
        : absint( get_option( 'primero_currency_history_days', 7 ) );

    if ( ! in_array( $days, [ 7, 30, 90 ], true ) ) {
        $days = 7;
    }

    $history = get_currency_history(
        $from_currency,
        $to_currency,
        $days
    );

    wp_send_json_success( [
        'history' => $history,
    ] );
}
add_action('wp_ajax_primero_currency_history', 'primero_currency_history_ajax_handler');
add_action('wp_ajax_nopriv_primero_currency_history', 'primero_currency_history_ajax_handler');

function primero_get_rates_ajax_handler() {

    check_ajax_referer('primero_currency_nonce', 'nonce');

    $rates = get_currency_rates();

    $base_currency = strtoupper(get_option('primero_currency_base_currency', 'ARS'));

wp_send_json_success([
    'USD' => convert_currency(1, 'USD', $base_currency, $rates),
    'EUR' => convert_currency(1, 'EUR', $base_currency, $rates),
    'GBP' => convert_currency(1, 'GBP', $base_currency, $rates),
    'base_currency' => $base_currency,
]);

}

add_action('wp_ajax_primero_get_rates', 'primero_get_rates_ajax_handler');
add_action('wp_ajax_nopriv_primero_get_rates', 'primero_get_rates_ajax_handler');

add_shortcode('primero_currency_converter', 'currency_converter_shortcode');

