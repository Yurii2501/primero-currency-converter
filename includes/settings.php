<?php

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

function primero_currency_converter_settings_page() {
    ?>
    <div class="wrap">
        <h1>Primero Currency Converter</h1>

        <form method="post" action="options.php">
            <?php
            settings_fields('primero_currency_converter_settings');
            do_settings_sections('primero_currency_converter_settings');
            submit_button();
            ?>
        </form>
    </div>
    <?php
}

function primero_currency_converter_register_settings() {

    register_setting(
        'primero_currency_converter_settings',
        'primero_currency_cache_minutes'
    );

    register_setting(
    'primero_currency_converter_settings',
    'primero_currency_auto_convert'
);

register_setting(
    'primero_currency_converter_settings',
    'primero_currency_favorite_currencies'
);

register_setting(
    'primero_currency_converter_settings',
    'primero_currency_history_days'
);

    add_settings_section(
        'primero_currency_converter_main_section',
        'Основные настройки',
        null,
        'primero_currency_converter_settings'
    );

    add_settings_field(
        'primero_currency_cache_minutes',
        'Время кэша курса (в минутах)',
        'primero_currency_cache_minutes_field',
        'primero_currency_converter_settings',
        'primero_currency_converter_main_section'
    );

    add_settings_field(
    'primero_currency_auto_convert',
    'Автоматическая конвертация',
    'primero_currency_auto_convert_field',
    'primero_currency_converter_settings',
    'primero_currency_converter_main_section'
);

add_settings_field(
    'primero_currency_favorite_currencies',
    'Избранные валюты',
    'primero_currency_favorite_currencies_field',
    'primero_currency_converter_settings',
    'primero_currency_converter_main_section'
);

add_settings_field(
    'primero_currency_history_days',
    'Период графика',
    'primero_currency_history_days_field',
    'primero_currency_converter_settings',
    'primero_currency_converter_main_section'
);

register_setting(
    'primero_currency_converter_settings',
    'primero_currency_base_currency'
);

add_settings_field(
    'primero_currency_base_currency',
    'Базовая валюта сайта',
    'primero_currency_base_currency_field',
    'primero_currency_converter_settings',
    'primero_currency_converter_main_section'
);

register_setting(
    'primero_currency_converter_settings',
    'primero_currency_api_source',
    [
        'sanitize_callback' => 'primero_sanitize_api_source',
        'default'           => 'fawaz',
    ]
);

add_settings_field(
    'primero_currency_api_source',
    'Источник курсов валют',
    'primero_currency_api_source_field',
    'primero_currency_converter_settings',
    'primero_currency_converter_main_section'
);

}


function primero_currency_cache_minutes_field() {

    $value = get_option('primero_currency_cache_minutes', 60);

    echo '<input 
        type="number" 
        name="primero_currency_cache_minutes" 
        value="' . esc_attr($value) . '" 
        min="1"
    >';
}

function primero_currency_converter_admin_menu() {

    add_options_page(
        'Primero Currency Converter',
        'Currency Converter',
        'manage_options',
        'primero-currency-converter',
        'primero_currency_converter_settings_page'
    );
}

function primero_currency_auto_convert_field() {

    $value = get_option('primero_currency_auto_convert', 1);

    echo '<label>
        <input
            type="checkbox"
            name="primero_currency_auto_convert"
            value="1"
            ' . checked(1, $value, false) . '
        >
        Включить автоматическую конвертацию
    </label>';
}

function primero_currency_favorite_currencies_field() {

    $value = get_option('primero_currency_favorite_currencies', 'USD,EUR,ARS');

    echo '<input
        type="text"
        name="primero_currency_favorite_currencies"
        value="' . esc_attr($value) . '"
        class="regular-text"
        placeholder="USD,EUR,ARS"
    >';

    echo '<p class="description">
        Укажи коды валют через запятую. Например: USD,EUR,ARS,RUB
    </p>';
}

function primero_currency_history_days_field() {

    $value = get_option('primero_currency_history_days', 7);

    echo '<select name="primero_currency_history_days">
        <option value="7" ' . selected($value, 7, false) . '>7 дней</option>
        <option value="30" ' . selected($value, 30, false) . '>30 дней</option>
        <option value="90" ' . selected($value, 90, false) . '>90 дней</option>
    </select>';
}

function primero_currency_base_currency_field() {

    $value = strtoupper(get_option('primero_currency_base_currency', 'ARS'));

    $currencies = get_supported_currencies();

    echo '<select name="primero_currency_base_currency">';

    foreach ($currencies as $code => $name) {
        echo '<option value="' . esc_attr($code) . '" ' . selected($value, $code, false) . '>';
        echo esc_html($name);
        echo '</option>';
    }

    echo '</select>';

    echo '<p class="description">
        Выберите валюту, относительно которой будут показываться популярные курсы.
    </p>';
}

function primero_currency_api_source_field() {

    $value = get_option( 'primero_currency_api_source', 'fawaz' );

    echo '<select name="primero_currency_api_source">';
    echo '<option value="fawaz" ' . selected( $value, 'fawaz', false ) . '>Fawaz Ahmed Currency API</option>';
    echo '<option value="frankfurter" ' . selected( $value, 'frankfurter', false ) . '>Frankfurter API</option>';
    echo '</select>';

    echo '<p class="description">Выберите источник данных для курсов валют.</p>';
}

function primero_sanitize_api_source( $value ) {

    $allowed_sources = [
        'fawaz',
        'frankfurter',
    ];

    if ( ! in_array( $value, $allowed_sources, true ) ) {
        return 'fawaz';
    }

    return $value;
}

add_action('admin_menu', 'primero_currency_converter_admin_menu');
add_action('admin_init', 'primero_currency_converter_register_settings');