<?php

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}
/*
Plugin Name: Primero Currency Converter
Description: Modern AJAX currency converter with 160+ currencies, exchange rate history, multilingual support and dark mode.
Version: 1.0.0
Author: Primero Labs
Text Domain: primero-currency-converter
Domain Path: /languages
Requires at least: 6.5
Requires PHP: 8.0
License: GPL v2 or later
*/
require_once plugin_dir_path(__FILE__) . 'includes/helpers.php';
require_once plugin_dir_path(__FILE__) . 'includes/currencies.php';
require_once plugin_dir_path(__FILE__) . 'includes/api.php';
require_once plugin_dir_path(__FILE__) . 'includes/settings.php';
require_once plugin_dir_path(__FILE__) . 'includes/shortcode.php';

add_action('plugins_loaded', 'primero_currency_converter_load_textdomain');

function primero_currency_converter_load_textdomain() {
    load_plugin_textdomain(
        'primero-currency-converter',
        false,
        dirname(plugin_basename(__FILE__)) . '/languages'
    );
}

function primero_currency_converter_enqueue_styles() {

    wp_enqueue_style(
        'primero-currency-converter-style',
        plugin_dir_url(__FILE__) . 'css/style.css',
        [],
        '1.0'
    );

    wp_enqueue_style(
    'choices-css',
    'https://cdn.jsdelivr.net/npm/choices.js/public/assets/styles/choices.min.css',
    [],
    '11.1.0'
);


wp_enqueue_script(
    'choices-js',
    'https://cdn.jsdelivr.net/npm/choices.js/public/assets/scripts/choices.min.js',
    [],
    '11.1.0',
    true
);

wp_enqueue_script(
    'chart-js',
    'https://cdn.jsdelivr.net/npm/chart.js',
    [],
    '4.5.0',
    true
);

wp_enqueue_script(
    'primero-currency-converter-script',
    plugin_dir_url(__FILE__) . 'js/script.js',
    ['choices-js', 'chart-js'],
    '1.0',
    true
);

$currency_translations = require plugin_dir_path(__FILE__) . 'includes/currency-translations.php';

wp_localize_script(
    'primero-currency-converter-script',
    'currencyConverter',
    [
        'ajaxUrl' => admin_url('admin-ajax.php'),
        'nonce' => wp_create_nonce('primero_currency_nonce'),
        'autoConvert' => get_option('primero_currency_auto_convert', 1),
        'baseCurrency' => strtoupper(get_option('primero_currency_base_currency', 'ARS')),
        'currencyTranslations' => $currency_translations,
        'strings' => [
    'loading'             => __('Converting...', 'primero-currency-converter'),
    'copy'                => __('Copy', 'primero-currency-converter'),
    'copied'              => __('Copied', 'primero-currency-converter'),
    'copied_message'      => __('Result copied', 'primero-currency-converter'),
    'success'             => __('Conversion completed', 'primero-currency-converter'),
    'connection_error'    => __('Connection error', 'primero-currency-converter'),
    'updated_at'          => __('Rate updated', 'primero-currency-converter'),
    'source'              => __('Source', 'primero-currency-converter'),
    'error' => __('Error', 'primero-currency-converter'),
'request_failed' => __('Failed to complete request', 'primero-currency-converter'),
],
    ]
);

}

add_action(
    'wp_enqueue_scripts',
    'primero_currency_converter_enqueue_styles'
);

