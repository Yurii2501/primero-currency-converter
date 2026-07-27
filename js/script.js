document.addEventListener('DOMContentLoaded', function () {
    console.log('Primero Currency Converter загружен');

    const converters = document.querySelectorAll('.primero-currency-converter');

    if (!converters.length) {
        return;
    }

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
            updatedAt: 'Курс обновлён',
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

    converters.forEach(function (converter, converterIndex) {
        const form = converter.querySelector('.currency-converter-form');

        if (!form) {
            return;
        }

        const fromSelect = converter.querySelector(
            'select[name="from_currency"]'
        );

        const toSelect = converter.querySelector(
            'select[name="to_currency"]'
        );

        const amountInput = converter.querySelector(
            'input[name="amount"]'
        );

        const swapButton = converter.querySelector(
            '.swap-currencies-button'
        );

        const submitButton = converter.querySelector(
            '.convert-button'
        );

        const refreshButton = converter.querySelector(
            '.refresh-button'
        );

        const resultBox = converter.querySelector(
            '.ajax-result'
        );

        const themeToggle = converter.querySelector(
            '.theme-toggle'
        );

        const languageButtons = converter.querySelectorAll(
            '.language-button'
        );

        const chartCanvas = converter.querySelector(
            '.currency-chart'
        );

        const chartContainer = converter.querySelector(
            '.currency-chart-container'
        );

        const periodButtons = converter.querySelectorAll(
            '.chart-period-button'
        );

        const historyContainer = converter.querySelector(
            '.conversion-history-list'
        );

        const historyBlock = converter.querySelector(
            '.conversion-history'
        );

        const toast = converter.querySelector(
            '.primero-toast'
        );

        const rateUsd = converter.querySelector(
            '.rate-usd'
        );

        const rateEur = converter.querySelector(
            '.rate-eur'
        );

        const rateGbp = converter.querySelector(
            '.rate-gbp'
        );

        if (
            !fromSelect ||
            !toSelect ||
            !amountInput ||
            !submitButton ||
            !resultBox
        ) {
            return;
        }

        const storageSuffix = String(converterIndex);

        const fromCurrencyStorageKey =
            'primero-from-currency-' + storageSuffix;

        const toCurrencyStorageKey =
            'primero-to-currency-' + storageSuffix;

        const historyStorageKey =
            'primero-history-' + storageSuffix;

        let currentLanguage =
            localStorage.getItem('primero-language') || 'en';

        let currentText =
            translations[currentLanguage] || translations.en;

        let fromChoices = null;
        let toChoices = null;
        let currencyChart = null;
        let autoConvertTimer = null;

        let selectedHistoryDays = parseInt(
            currencyConverter.historyDays || 7,
            10
        );

        if (![7, 30, 90].includes(selectedHistoryDays)) {
            selectedHistoryDays = 7;
        }

        function setChoiceValue(choicesInstance, value) {
    if (!choicesInstance || !value) {
        return;
    }

    choicesInstance.setChoiceByValue(value);
}
        function initChoices() {
            if (
                typeof Choices === 'undefined'
            ) {
                return;
            }

            if (fromChoices) {
                fromChoices.destroy();
            }

            if (toChoices) {
                toChoices.destroy();
            }

            fromChoices = new Choices(fromSelect, {
                searchEnabled: true,
                itemSelectText: '',
                shouldSort: false
            });

            toChoices = new Choices(toSelect, {
                searchEnabled: true,
                itemSelectText: '',
                shouldSort: false
            });
        }

        function updateCurrencyLabels(language) {
    const currencyTranslations =
        currencyConverter.currencyTranslations || {};

    fromSelect.querySelectorAll('option').forEach(function (option) {
        const code = option.value;

        if (
            currencyTranslations[code] &&
            currencyTranslations[code][language]
        ) {
            option.textContent =
                currencyTranslations[code][language];
        }
    });

    toSelect.querySelectorAll('option').forEach(function (option) {
        const code = option.value;

        if (
            currencyTranslations[code] &&
            currencyTranslations[code][language]
        ) {
            option.textContent =
                currencyTranslations[code][language];
        }
    });
}

        function applyLanguage(language) {
            const current =
                translations[language] || translations.en;

            currentLanguage = language;
            currentText = current;

            const title = converter.querySelector(
                '.converter-title'
            );

            const amountLabel = converter.querySelector(
                '.amount-label'
            );

            const fromLabel = converter.querySelector(
                '.from-currency-label'
            );

            const toLabel = converter.querySelector(
                '.to-currency-label'
            );

            const historyTitle = converter.querySelector(
                '.history-title'
            );

            const chartTitle = converter.querySelector(
                '.chart-title'
            );

            const period7 = converter.querySelector(
                '.period-7'
            );

            const period30 = converter.querySelector(
                '.period-30'
            );

            const period90 = converter.querySelector(
                '.period-90'
            );

            if (title) {
                title.textContent = current.title;
            }

            if (amountLabel) {
                amountLabel.textContent =
                    current.amount + ':';
            }

            if (fromLabel) {
                fromLabel.textContent =
                    current.from + ':';
            }

            if (toLabel) {
                toLabel.textContent =
                    current.to + ':';
            }

            if (submitButton) {
                submitButton.textContent =
                    current.convert;
            }

            if (refreshButton) {
                refreshButton.innerHTML =
                    '🔄 ' + current.refresh;
            }

            if (historyTitle) {
                historyTitle.textContent =
                    '🕘 ' + current.history;
            }

            if (chartTitle) {
                chartTitle.textContent =
                    '📈 ' + current.chart;
            }

            if (period7) {
                period7.textContent =
                    current.period7;
            }

            if (period30) {
                period30.textContent =
                    current.period30;
            }

            if (period90) {
                period90.textContent =
                    current.period90;
            }

            amountInput.placeholder =
                current.placeholder;

            languageButtons.forEach(function (button) {
                button.classList.toggle(
                    'active',
                    button.dataset.lang === language
                );
            });

            updateCurrencyLabels(language);
        }

        function showLoading() {
            submitButton.disabled = true;
            submitButton.innerHTML =
                '⏳ ' + currentText.loading;

            if (refreshButton) {
                refreshButton.disabled = true;
            }

            resultBox.innerHTML =
                '<p>⏳ ' +
                currentText.loading +
                '</p>';
        }

        function hideLoading() {
            submitButton.disabled = false;
            submitButton.textContent =
                currentText.convert;

            if (refreshButton) {
                refreshButton.disabled = false;
            }
        }

        function showToast(message) {
            if (!toast) {
                return;
            }

            toast.textContent = message;
            toast.classList.add('show');

            setTimeout(function () {
                toast.classList.remove('show');
            }, 2500);
        }

        function getStoredHistory() {
            try {
                const savedHistory =
                    localStorage.getItem(historyStorageKey);

                const history =
                    JSON.parse(savedHistory || '[]');

                return Array.isArray(history)
                    ? history
                    : [];
            } catch (error) {
                console.error(
                    'Не удалось прочитать историю:',
                    error
                );

                return [];
            }
        }

        function saveConversionToHistory(text) {
            let history = getStoredHistory();

            history.unshift(text);
            history = history.slice(0, 5);

            localStorage.setItem(
                historyStorageKey,
                JSON.stringify(history)
            );

            renderConversionHistory();
        }

        function renderConversionHistory() {
            if (!historyContainer || !historyBlock) {
                return;
            }

            const history = getStoredHistory();

            historyContainer.innerHTML = '';

            if (!history.length) {
                historyBlock.style.display = 'none';
                return;
            }

            historyBlock.style.display = 'block';

            history.forEach(function (item) {
                const historyItem =
                    document.createElement('div');

                historyItem.className =
                    'conversion-history-item';

                historyItem.textContent = item;

                historyContainer.appendChild(
                    historyItem
                );
            });
        }

        function scheduleAutoConvert() {
            if (
                currencyConverter.autoConvert !== '1' &&
                currencyConverter.autoConvert !== 1
            ) {
                return;
            }

            clearTimeout(autoConvertTimer);

            autoConvertTimer = setTimeout(function () {
                const amount =
                    parseFloat(amountInput.value);

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

            setChoiceValue(fromChoices, toValue);
            setChoiceValue(toChoices, fromValue);

            if (!fromChoices) {
                fromSelect.value = toValue;
            }

            if (!toChoices) {
                toSelect.value = fromValue;
            }

            localStorage.setItem(
                fromCurrencyStorageKey,
                toValue
            );

            localStorage.setItem(
                toCurrencyStorageKey,
                fromValue
            );
        }

        function updateChart(labels, values) {
            if (!currencyChart) {
                return;
            }

            currencyChart.data.labels = labels;

            currencyChart.data.datasets[0].data =
                values;

            currencyChart.data.datasets[0].label =
                fromSelect.value +
                ' → ' +
                toSelect.value;

            currencyChart.update();
        }

        function updateChartTheme() {
            if (!currencyChart) {
                return;
            }

            const isDark =
                document.body.classList.contains(
                    'dark-theme'
                );

            currencyChart.options.scales = {
                x: {
                    ticks: {
                        color: isDark
                            ? '#e5e7eb'
                            : '#374151'
                    },
                    grid: {
                        color: isDark
                            ? '#374151'
                            : '#e5e7eb'
                    }
                },
                y: {
                    ticks: {
                        color: isDark
                            ? '#e5e7eb'
                            : '#374151'
                    },
                    grid: {
                        color: isDark
                            ? '#374151'
                            : '#e5e7eb'
                    }
                }
            };

            currencyChart.data.datasets[0].borderColor =
                isDark
                    ? '#60a5fa'
                    : '#2563eb';

            currencyChart.data.datasets[0].backgroundColor =
                isDark
                    ? 'rgba(96, 165, 250, .15)'
                    : 'rgba(37, 99, 235, .15)';

            currencyChart.update();
        }

        function setChartLoading(isLoading) {
            const activePeriodButton =
                converter.querySelector(
                    '.chart-period-button.active'
                );

            if (chartContainer) {
                chartContainer.classList.toggle(
                    'loading',
                    isLoading
                );
            }

            if (activePeriodButton) {
                activePeriodButton.classList.toggle(
                    'loading',
                    isLoading
                );
            }
        }

        function loadCurrencyHistory() {
            const formData = new FormData();

            formData.append(
                'action',
                'primero_currency_history'
            );

            formData.append(
                'nonce',
                currencyConverter.nonce
            );

            formData.append(
                'from_currency',
                fromSelect.value
            );

            formData.append(
                'to_currency',
                toSelect.value
            );

            formData.append(
                'days',
                selectedHistoryDays
            );

            setChartLoading(true);

            fetch(currencyConverter.ajaxUrl, {
                method: 'POST',
                body: formData
            })
                .then(function (response) {
                    if (!response.ok) {
                        throw new Error(
                            'HTTP error: ' +
                            response.status
                        );
                    }

                    return response.json();
                })
                .then(function (data) {
                    if (
                        !data.success ||
                        !data.data ||
                        !Array.isArray(data.data.history)
                    ) {
                        return;
                    }

                    const locale =
                        currentLanguage === 'ru'
                            ? 'ru-RU'
                            : currentLanguage === 'es'
                                ? 'es-ES'
                                : 'en-US';

                    const labels =
                        data.data.history.map(
                            function (item) {
                                const date =
                                    new Date(item.date);

                                return date.toLocaleDateString(
                                    locale,
                                    {
                                        day: 'numeric',
                                        month: 'short'
                                    }
                                );
                            }
                        );

                    const values =
                        data.data.history.map(
                            function (item) {
                                return Number(item.rate);
                            }
                        );

                    updateChart(labels, values);
                })
                .catch(function (error) {
                    console.error(
                        'Ошибка загрузки истории курса:',
                        error
                    );
                })
                .finally(function () {
                    setChartLoading(false);
                });
        }

        function updatePopularRates() {
            const formData = new FormData();

            formData.append(
                'action',
                'primero_get_rates'
            );

            formData.append(
                'nonce',
                currencyConverter.nonce
            );

            fetch(currencyConverter.ajaxUrl, {
                method: 'POST',
                body: formData
            })
                .then(function (response) {
                    if (!response.ok) {
                        throw new Error(
                            'HTTP error: ' +
                            response.status
                        );
                    }

                    return response.json();
                })
                .then(function (data) {
                    if (!data.success || !data.data) {
                        return;
                    }

                    const baseCurrency =
                        data.data.base_currency;

                    if (
                        rateUsd &&
                        Number.isFinite(
                            Number(data.data.USD)
                        )
                    ) {
                        rateUsd.textContent =
                            Number(data.data.USD)
                                .toFixed(2) +
                            ' ' +
                            baseCurrency;
                    }

                    if (
                        rateEur &&
                        Number.isFinite(
                            Number(data.data.EUR)
                        )
                    ) {
                        rateEur.textContent =
                            Number(data.data.EUR)
                                .toFixed(2) +
                            ' ' +
                            baseCurrency;
                    }

                    if (
                        rateGbp &&
                        Number.isFinite(
                            Number(data.data.GBP)
                        )
                    ) {
                        rateGbp.textContent =
                            Number(data.data.GBP)
                                .toFixed(2) +
                            ' ' +
                            baseCurrency;
                    }
                })
                .catch(function (error) {
                    console.error(
                        'Ошибка загрузки популярных курсов:',
                        error
                    );
                });
        }

        function initChart() {
            if (
                !chartCanvas ||
                typeof Chart === 'undefined'
            ) {
                return;
            }

            currencyChart = new Chart(chartCanvas, {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [
                        {
                            label:
                                fromSelect.value +
                                ' → ' +
                                toSelect.value,
                            data: [],
                            borderColor: '#2563eb',
                            backgroundColor:
                                'rgba(37,99,235,.15)',
                            fill: true,
                            tension: 0.35
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
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

        const savedFromCurrency =
            localStorage.getItem(
                fromCurrencyStorageKey
            );

        const savedToCurrency =
            localStorage.getItem(
                toCurrencyStorageKey
            );

        if (savedFromCurrency) {
            setChoiceValue(
                fromChoices,
                savedFromCurrency
            );

            if (!fromChoices) {
                fromSelect.value =
                    savedFromCurrency;
            }
        }

        if (savedToCurrency) {
            setChoiceValue(
                toChoices,
                savedToCurrency
            );

            if (!toChoices) {
                toSelect.value =
                    savedToCurrency;
            }
        }

        const savedTheme =
            localStorage.getItem('primero-theme');

        if (savedTheme === 'dark') {
            document.body.classList.add(
                'dark-theme'
            );
        } else {
            document.body.classList.remove(
                'dark-theme'
            );
        }

        if (themeToggle) {
            themeToggle.checked =
                savedTheme === 'dark';

            themeToggle.addEventListener(
                'change',
                function () {
                    const theme =
                        themeToggle.checked
                            ? 'dark'
                            : 'light';

                    localStorage.setItem(
                        'primero-theme',
                        theme
                    );

                    document.body.classList.toggle(
                        'dark-theme',
                        theme === 'dark'
                    );

                    window.dispatchEvent(
                        new CustomEvent(
                            'primeroThemeChanged',
                            {
                                detail: {
                                    theme: theme
                                }
                            }
                        )
                    );
                }
            );
        }

        window.addEventListener(
            'primeroThemeChanged',
            function (event) {
                const isDark =
                    event.detail.theme === 'dark';

                document.body.classList.toggle(
                    'dark-theme',
                    isDark
                );

                if (themeToggle) {
                    themeToggle.checked = isDark;
                }

                updateChartTheme();
            }
        );

        languageButtons.forEach(function (button) {
            button.addEventListener(
                'click',
                function () {
                    const language =
                        button.dataset.lang;

                    localStorage.setItem(
                        'primero-language',
                        language
                    );

                    window.dispatchEvent(
                        new CustomEvent(
                            'primeroLanguageChanged',
                            {
                                detail: {
                                    language: language
                                }
                            }
                        )
                    );
                }
            );
        });

        window.addEventListener(
            'primeroLanguageChanged',
            function (event) {
                applyLanguage(
                    event.detail.language
                );

                loadCurrencyHistory();
            }
        );

        fromSelect.addEventListener(
            'change',
            function () {
                localStorage.setItem(
                    fromCurrencyStorageKey,
                    fromSelect.value
                );

                scheduleAutoConvert();
                loadCurrencyHistory();
            }
        );

        toSelect.addEventListener(
            'change',
            function () {
                localStorage.setItem(
                    toCurrencyStorageKey,
                    toSelect.value
                );

                scheduleAutoConvert();
                loadCurrencyHistory();
            }
        );

        amountInput.addEventListener(
            'input',
            scheduleAutoConvert
        );

        if (swapButton) {
            swapButton.addEventListener(
                'click',
                function () {
                    swapCurrencies();
                    scheduleAutoConvert();
                    loadCurrencyHistory();
                }
            );
        }

        form.addEventListener(
            'submit',
            function (event) {
                event.preventDefault();

                showLoading();

                const formData =
                    new FormData(form);

                if (
                    event.submitter &&
                    event.submitter.name
                ) {
                    formData.append(
                        event.submitter.name,
                        event.submitter.value
                    );
                }

                formData.append(
                    'action',
                    'primero_convert_currency'
                );

                formData.append(
                    'nonce',
                    currencyConverter.nonce
                );

                fetch(currencyConverter.ajaxUrl, {
                    method: 'POST',
                    body: formData
                })
                    .then(function (response) {
                        if (!response.ok) {
                            throw new Error(
                                'HTTP error: ' +
                                response.status
                            );
                        }

                        return response.json();
                    })
                    .then(function (data) {
                        hideLoading();

                        if (!data.success) {
                            const message =
                                data.data &&
                                data.data.message
                                    ? data.data.message
                                    : currentText.requestFailed;

                            resultBox.innerHTML =
                                '<p class="primero-error-message">' +
                                '❌ ' +
                                currentText.error +
                                ': ' +
                                message +
                                '</p>';

                            return;
                        }

                        resultBox.innerHTML =
                            '<div class="conversion-result">' +
                                '<div class="conversion-result-title">' +
                                    '✅ ' +
                                    currentText.success +
                                '</div>' +
                                '<div class="conversion-result-row">' +
                                    '<span>' +
                                        data.data.amount +
                                        ' ' +
                                        data.data.from_currency +
                                    '</span>' +
                                    '<span class="conversion-arrow">' +
                                        '↓' +
                                    '</span>' +
                                    '<strong>' +
                                        data.data.converted +
                                        ' ' +
                                        data.data.to_currency +
                                    '</strong>' +
                                    '<small>' +
                                        '1 ' +
                                        data.data.from_currency +
                                        ' = ' +
                                        data.data.single_rate +
                                        ' ' +
                                        data.data.to_currency +
                                    '</small>' +
                                    '<small>' +
                                        '1 ' +
                                        data.data.to_currency +
                                        ' = ' +
                                        data.data.reverse_rate +
                                        ' ' +
                                        data.data.from_currency +
                                    '</small>' +
                                    '<small>' +
                                        currentText.updatedAt +
                                        ': ' +
                                        data.data.updated_at +
                                    '</small>' +
                                    '<small>' +
                                        currentText.source +
                                        ': ' +
                                        data.data.rate_source +
                                    '</small>' +
                                    '<button ' +
                                        'type="button" ' +
                                        'class="copy-result-button" ' +
                                        'data-copy="' +
                                            data.data.amount +
                                            ' ' +
                                            data.data.from_currency +
                                            ' = ' +
                                            data.data.converted +
                                            ' ' +
                                            data.data.to_currency +
                                        '">' +
                                        '📋 ' +
                                        currentText.copy +
                                    '</button>' +
                                '</div>' +
                            '</div>';

                        saveConversionToHistory(
                            data.data.amount +
                            ' ' +
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
                            '<p class="primero-error-message">' +
                            '❌ ' +
                            currentText.connectionError +
                            '.' +
                            '</p>';

                        console.error(error);
                    });
            }
        );

        resultBox.addEventListener(
            'click',
            function (event) {
                const copyButton =
                    event.target.closest(
                        '.copy-result-button'
                    );

                if (!copyButton) {
                    return;
                }

                const textToCopy =
                    copyButton.dataset.copy;

                if (!textToCopy) {
                    return;
                }

                function showCopied() {
                    copyButton.innerHTML =
                        '✅ ' +
                        currentText.copied;

                    showToast(
                        '✅ ' +
                        currentText.copiedMessage
                    );

                    setTimeout(function () {
                        copyButton.innerHTML =
                            '📋 ' +
                            currentText.copy;
                    }, 2000);
                }

                if (
                    navigator.clipboard &&
                    navigator.clipboard.writeText
                ) {
                    navigator.clipboard
                        .writeText(textToCopy)
                        .then(showCopied)
                        .catch(function (error) {
                            console.error(
                                'Ошибка копирования:',
                                error
                            );
                        });
                } else {
                    const tempInput =
                        document.createElement(
                            'textarea'
                        );

                    tempInput.value = textToCopy;
                    document.body.appendChild(
                        tempInput
                    );

                    tempInput.select();
                    document.execCommand('copy');

                    document.body.removeChild(
                        tempInput
                    );

                    showCopied();
                }
            }
        );

        periodButtons.forEach(function (button) {
            button.addEventListener(
                'click',
                function () {
                    selectedHistoryDays =
                        parseInt(
                            button.dataset.days,
                            10
                        );

                    periodButtons.forEach(
                        function (periodButton) {
                            periodButton.classList.remove(
                                'active'
                            );
                        }
                    );

                    button.classList.add('active');

                    loadCurrencyHistory();
                }
            );
        });

        periodButtons.forEach(function (button) {
            const buttonDays =
                parseInt(button.dataset.days, 10);

            button.classList.toggle(
                'active',
                buttonDays === selectedHistoryDays
            );
        });

        applyLanguage(currentLanguage);
        initChart();
        renderConversionHistory();
        updatePopularRates();
        loadCurrencyHistory();
    });
});