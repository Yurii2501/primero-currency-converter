<?php

if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
	exit;
}

/*
 * Delete plugin options.
 */

delete_option( 'primero_currency_cache_minutes' );
delete_option( 'primero_currency_base_currency' );
delete_option( 'primero_currency_api_source' );
delete_option( 'primero_currency_rates_updated_at' );
delete_option( 'primero_currency_last_api_source' );
delete_option( 'primero_currency_history_days' );

/*
 * Delete cached data.
 */

delete_transient( 'primero_currency_rates' );