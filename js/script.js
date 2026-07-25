document.addEventListener('DOMContentLoaded', function () {
    console.log('Primero Currency Converter загружен');

    const form = document.querySelector('.currency-converter-form');
    if (!form) return;

    const fromSelect = document.querySelector('select[name="from_currency"]');
    const toSelect = document.querySelector('select[name="to_currency"]');
    const amountInput = document.querySelector('input[name="amount"]');
    const swapButton = document.querySelector('.swap-currencies-button');
    const submitButton = form.querySelector('.convert-button');
    const resultBox = document.querySelector('.ajax-result');
    const themeToggle = document.getElementById('themeToggle');
    const languageButtons = document.querySelectorAll('.language-button');
    const chartCanvas = document.getElementById('currencyChart');

    const translations = {
        en: {
            title: 'Currency Converter',
            amount: 'Amount',
            from: 'From currency',
            to: 'To currency',
            convert: 'Convert',
            refresh: 'Refresh rates',
            history: 'Last conversions',
            chart: 'Exchange rate history',
            period7: '7D',
            period30: '30D',
            period90: '90D',
            placeholder: 'Enter amount',
            copy: 'Copy',
            copied: 'Copied',
            copiedMessage: 'Result copied',
            updatedAt: 'Rate updated',
            source: 'Source',
            success: 'Conversion completed',
            error: 'Error',
            requestFailed: 'Failed to complete request',
            connectionError: 'Connection error',
            loading: 'Converting...'
        },
        ru: {
            title: 'Конвертер валют',
            amount: 'Сумма',
            from: 'Из валюты',
            to: 'В валюту',
            convert: 'Конвертировать',
            refresh: 'Обновить курс',
            history: 'Последние конвертации',
            chart: 'Динамика курса',
            period7: '7Д',
            period30: '30Д',
            period90: '90Д',
            placeholder: 'Введите сумму',
            copy: 'Копировать',
            copied: 'Скопировано',
            copiedMessage: 'Результат скопирован',
            updatedAt: 'Курс обновлен',
            source: 'Источник',
            success: 'Конвертация выполнена',
            error: 'Ошибка',
            requestFailed: 'Не удалось выполнить запрос',
            connectionError: 'Ошибка соединения',
            loading: 'Конвертация...'
        },
        es: {
            title: 'Conversor de divisas',
            amount: 'Cantidad',
            from: 'De moneda',
            to: 'A moneda',
            convert: 'Convertir',
            refresh: 'Actualizar tasas',
            history: 'Últimas conversiones',
            chart: 'Historial del tipo de cambio',
            period7: '7D',
            period30: '30D',
            period90: '90D',
            placeholder: 'Ingrese el monto',
            copy: 'Copiar',
            copied: 'Copiado',
            copiedMessage: 'Resultado copiado',
            updatedAt: 'Tasa actualizada',
            source: 'Fuente',
            success: 'Conversión completada',
            error: 'Error',
            requestFailed: 'No se pudo completar la solicitud',
            connectionError: 'Error de conexión',
            loading: 'Convirtiendo...'
        }
    };

    let currentLanguage = localStorage.getItem('primero-language') || 'en';
    let currentText = translations[currentLanguage] || translations.en;

    let fromChoices = null;
    let toChoices = null;
    let currencyChart = null;
    let autoConvertTimer = null;
    let selectedHistoryDays = 7;

    function initChoices() {
        if (fromChoices) fromChoices.destroy();
        if (toChoices) toChoices.destroy();

        fromChoices = new Choices(fromSelect, {
            searchEnabled: true,
            itemSelectText: '',
            shouldSort: false,
        });

        toChoices = new Choices(toSelect, {
            searchEnabled: true,
            itemSelectText: '',
            shouldSort: false,
        });
    }

    function updateCurrencyLabels(lang) {
        const currencyTranslations = currencyConverter.currencyTranslations || {};
        const fromValue = fromSelect.value;
        const toValue = toSelect.value;

        document
            .querySelectorAll('select[name="from_currency"] option, select[name="to_currency"] option')
            .forEach(function (option) {
                const code = option.value;

                if (currencyTranslations[code] && currencyTranslations[code][lang]) {
                    option.textContent = currencyTranslations[code][lang];
                }
            });

        initChoices();

        if (fromValue) fromChoices.setChoiceByValue(fromValue);
        if (toValue) toChoices.setChoiceByValue(toValue);
    }

    function applyLanguage(lang) {
        const current = translations[lang] || translations.en;

        currentLanguage = lang;
        currentText = current;

        const title = document.getElementById('converterTitle');
        const amount = document.getElementById('amountLabel');
        const from = document.getElementById('fromCurrencyLabel');
        const to = document.getElementById('toCurrencyLabel');
        const convert = document.getElementById('convertButton');
        const refresh = document.getElementById('refreshButton');
        const historyTitle = document.getElementById('historyTitle');
        const chartTitle = document.getElementById('chartTitle');
        const period7 = document.getElementById('period7');
        const period30 = document.getElementById('period30');
        const period90 = document.getElementById('period90');

        if (title) title.textContent = current.title;
        if (amount) amount.textContent = current.amount + ':';
        if (from) from.textContent = current.from + ':';
        if (to) to.textContent = current.to + ':';
        if (convert) convert.textContent = current.convert;
        if (refresh) refresh.innerHTML = '🔄 ' + current.refresh;
        if (historyTitle) historyTitle.textContent = '🕘 ' + current.history;
        if (chartTitle) chartTitle.textContent = '📈 ' + current.chart;
        if (period7) period7.textContent = current.period7;
        if (period30) period30.textContent = current.period30;
        if (period90) period90.textContent = current.period90;
        if (amountInput) amountInput.placeholder = current.placeholder;

        languageButtons.forEach(function (button) {
            button.classList.toggle('active', button.dataset.lang === lang);
        });

        updateCurrencyLabels(lang);
        localStorage.setItem('primero-language', lang);
    }

    function showLoading() {
        submitButton.disabled = true;
        submitButton.innerHTML = '⏳ ' + currentText.loading;
        resultBox.innerHTML = '<p>⏳ ' + currentText.loading + '</p>';
    }

    function hideLoading() {
        submitButton.disabled = false;
        submitButton.textContent = currentText.convert;
    }

    function showToast(message) {
        const toast = document.getElementById('primeroToast');

        if (!toast) return;

        toast.innerHTML = message;
        toast.classList.add('show');

        setTimeout(function () {
            toast.classList.remove('show');
        }, 2500);
    }

    function saveConversionToHistory(text) {
        let history = JSON.parse(localStorage.getItem('primero-history') || '[]');

        history.unshift(text);
        history = history.slice(0, 5);

        localStorage.setItem('primero-history', JSON.stringify(history));
        renderConversionHistory();
    }

    function renderConversionHistory() {
        const historyContainer = document.getElementById('conversionHistory');
        const historyBlock = document.querySelector('.conversion-history');

        if (!historyContainer || !historyBlock) return;

        const history = JSON.parse(localStorage.getItem('primero-history') || '[]');

        if (history.length === 0) {
            historyBlock.style.display = 'none';
            return;
        }

        historyBlock.style.display = 'block';

        historyContainer.innerHTML = history.map(function (item) {
            return '<div class="conversion-history-item">' + item + '</div>';
        }).join('');
    }

    function scheduleAutoConvert() {
        if (currencyConverter.autoConvert !== '1' && currencyConverter.autoConvert !== 1) {
            return;
        }

        clearTimeout(autoConvertTimer);

        autoConvertTimer = setTimeout(function () {
            const amount = parseFloat(amountInput.value);

            if (!amount || amount <= 0) {
                resultBox.innerHTML = '';
                return;
            }

            form.requestSubmit();
        }, 500);
    }

    function swapCurrencies() {
        const fromValue = fromSelect.value;
        const toValue = toSelect.value;

        fromChoices.setChoiceByValue(toValue);
        toChoices.setChoiceByValue(fromValue);

        localStorage.setItem('primero-from-currency', toValue);
        localStorage.setItem('primero-to-currency', fromValue);
    }

    function updateChart(labels, values) {
        if (!currencyChart) return;

        currencyChart.data.labels = labels;
        currencyChart.data.datasets[0].data = values;
        currencyChart.update();
    }

    function updateChartTheme() {
        if (!currencyChart) return;

        const isDark = document.body.classList.contains('dark-theme');

        currencyChart.options.scales = {
            x: {
                ticks: {
                    color: isDark ? '#e5e7eb' : '#374151'
                },
                grid: {
                    color: isDark ? '#374151' : '#e5e7eb'
                }
            },
            y: {
                ticks: {
                    color: isDark ? '#e5e7eb' : '#374151'
                },
                grid: {
                    color: isDark ? '#374151' : '#e5e7eb'
                }
            }
        };

        currencyChart.data.datasets[0].borderColor = isDark ? '#60a5fa' : '#2563eb';
        currencyChart.data.datasets[0].backgroundColor = isDark
            ? 'rgba(96, 165, 250, .15)'
            : 'rgba(37, 99, 235, .15)';

        currencyChart.update();
    }

    function loadCurrencyHistory() {
        const formData = new FormData();

        formData.append('action', 'primero_currency_history');
        formData.append('nonce', currencyConverter.nonce);
        formData.append('from_currency', fromSelect.value);
        formData.append('to_currency', toSelect.value);
        formData.append('days', selectedHistoryDays);

        document.querySelector('.currency-chart-container')?.classList.add('loading');
        document.querySelector('.chart-period-button.active')?.classList.add('loading');

        fetch(currencyConverter.ajaxUrl, {
            method: 'POST',
            body: formData
        })
            .then(function (response) {
                return response.json();
            })
            .then(function (data) {
                document.querySelector('.currency-chart-container')?.classList.remove('loading');
                document.querySelector('.chart-period-button.active')?.classList.remove('loading');

                if (!data.success) return;

                const locale = currentLanguage === 'ru' ? 'ru-RU' : currentLanguage === 'es' ? 'es-ES' : 'en-US';

                const labels = data.data.history.map(function (item) {
                    const date = new Date(item.date);

                    return date.toLocaleDateString(locale, {
                        day: 'numeric',
                        month: 'short'
                    });
                });

                const values = data.data.history.map(function (item) {
                    return item.rate;
                });

                updateChart(labels, values);
            });
    }

    function updatePopularRates() {
        const formData = new FormData();

        formData.append('action', 'primero_get_rates');
        formData.append('nonce', currencyConverter.nonce);

        fetch(currencyConverter.ajaxUrl, {
            method: 'POST',
            body: formData
        })
            .then(function (response) {
                return response.json();
            })
            .then(function (data) {
                if (!data.success) return;

                document.getElementById('rateUsd').textContent =
                    data.data.USD.toFixed(2) + ' ' + data.data.base_currency;

                document.getElementById('rateEur').textContent =
                    data.data.EUR.toFixed(2) + ' ' + data.data.base_currency;

                document.getElementById('rateGbp').textContent =
                    data.data.GBP.toFixed(2) + ' ' + data.data.base_currency;
            });
    }

    function initChart() {
        if (!chartCanvas) return;

        currencyChart = new Chart(chartCanvas, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: fromSelect.value + ' → ' + toSelect.value,
                    data: [],
                    borderColor: '#2563eb',
                    backgroundColor: 'rgba(37,99,235,.15)',
                    fill: true,
                    tension: 0.35
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });

        updateChartTheme();
    }

    initChoices();

    const savedFromCurrency = localStorage.getItem('primero-from-currency');
    const savedToCurrency = localStorage.getItem('primero-to-currency');

    if (savedFromCurrency) {
        fromChoices.setChoiceByValue(savedFromCurrency);
    }

    if (savedToCurrency) {
        toChoices.setChoiceByValue(savedToCurrency);
    }

    applyLanguage(currentLanguage);

    if (themeToggle) {
        const savedTheme = localStorage.getItem('primero-theme');

        if (savedTheme === 'dark') {
            document.body.classList.add('dark-theme');
            themeToggle.checked = true;
        }

        themeToggle.addEventListener('change', function () {
            if (themeToggle.checked) {
                document.body.classList.add('dark-theme');
                localStorage.setItem('primero-theme', 'dark');
            } else {
                document.body.classList.remove('dark-theme');
                localStorage.setItem('primero-theme', 'light');
            }

            updateChartTheme();
        });
    }

    languageButtons.forEach(function (button) {
        button.addEventListener('click', function () {
            applyLanguage(button.dataset.lang);
            loadCurrencyHistory();
        });
    });

    fromSelect.addEventListener('change', function () {
        localStorage.setItem('primero-from-currency', fromSelect.value);
        scheduleAutoConvert();
        loadCurrencyHistory();
    });

    toSelect.addEventListener('change', function () {
        localStorage.setItem('primero-to-currency', toSelect.value);
        scheduleAutoConvert();
        loadCurrencyHistory();
    });

    amountInput.addEventListener('input', scheduleAutoConvert);

    swapButton.addEventListener('click', function () {
        swapCurrencies();
        scheduleAutoConvert();
        loadCurrencyHistory();
    });

    form.addEventListener('submit', function (event) {
        event.preventDefault();

        showLoading();

        const formData = new FormData(form);

        formData.append('action', 'primero_convert_currency');
        formData.append('nonce', currencyConverter.nonce);

        fetch(currencyConverter.ajaxUrl, {
            method: 'POST',
            body: formData
        })
            .then(function (response) {
                return response.json();
            })
            .then(function (data) {
                hideLoading();

                if (!data.success) {
                    resultBox.innerHTML =
                        '<p style="color:red;">❌ ' +
                        (currentText.error || 'Error') + ': ' +
                        (data.data?.message || currentText.requestFailed) +
                        '</p>';

                    return;
                }

                resultBox.innerHTML =
                    '<div class="conversion-result">' +
                    '<div class="conversion-result-title">✅ ' + currentText.success + '</div>' +
                    '<div class="conversion-result-row">' +
                    '<span>' + data.data.amount + ' ' + data.data.from_currency + '</span>' +
                    '<span class="conversion-arrow">↓</span>' +
                    '<strong>' + data.data.converted + ' ' + data.data.to_currency + '</strong>' +
                    '<small>1 ' + data.data.from_currency + ' = ' +
                    data.data.single_rate + ' ' + data.data.to_currency + '</small>' +
                    '<small>1 ' + data.data.to_currency + ' = ' +
                    data.data.reverse_rate + ' ' + data.data.from_currency + '</small>' +
                    '<small>' + currentText.updatedAt + ': ' + data.data.updated_at + '</small>' +
                    '<small>' + currentText.source + ': ' + data.data.rate_source + '</small>' +
                    '<button type="button" class="copy-result-button" data-copy="' +
                    data.data.amount + ' ' + data.data.from_currency + ' = ' +
                    data.data.converted + ' ' + data.data.to_currency +
                    '">📋 ' + currentText.copy + '</button>' +
                    '</div>' +
                    '</div>';

                saveConversionToHistory(
                    data.data.amount + ' ' +
                    data.data.from_currency +
                    ' → ' +
                    data.data.converted +
                    ' ' +
                    data.data.to_currency
                );

                loadCurrencyHistory();
                updatePopularRates();
            })
            .catch(function (error) {
                hideLoading();

                resultBox.innerHTML =
                    '<p style="color:red;">❌ ' + currentText.connectionError + '.</p>';

                console.error(error);
            });
    });

    resultBox.addEventListener('click', function (event) {
        const copyButton = event.target.closest('.copy-result-button');

        if (!copyButton) return;

        const textToCopy = copyButton.dataset.copy;

        if (!textToCopy) return;

        function showCopied() {
            copyButton.innerHTML = '✅ ' + currentText.copied;
            showToast('✅ ' + currentText.copiedMessage);

            setTimeout(function () {
                copyButton.innerHTML = '📋 ' + currentText.copy;
            }, 2000);
        }

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(textToCopy).then(showCopied);
        } else {
            const tempInput = document.createElement('textarea');
            tempInput.value = textToCopy;
            document.body.appendChild(tempInput);
            tempInput.select();
            document.execCommand('copy');
            document.body.removeChild(tempInput);

            showCopied();
        }
    });

    document.querySelectorAll('.chart-period-button').forEach(function (button) {
        button.addEventListener('click', function () {
            selectedHistoryDays = parseInt(button.dataset.days, 10);

            document.querySelectorAll('.chart-period-button').forEach(function (btn) {
                btn.classList.remove('active');
            });

            button.classList.add('active');

            loadCurrencyHistory();
        });
    });

    initChart();
    renderConversionHistory();
    updatePopularRates();
    loadCurrencyHistory();
});