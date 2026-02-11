/**
 * UI Helper Functions
 */
const ui = {
    showError(message, elementId = 'error-message') {
        const errorEl = document.getElementById(elementId);
        if (errorEl) {
            errorEl.textContent = message;
            errorEl.classList.remove('hidden');

            // Auto-hide after 5 seconds
            setTimeout(() => {
                errorEl.classList.add('hidden');
            }, 5000);
        }
    },

    hideError(elementId = 'error-message') {
        const errorEl = document.getElementById(elementId);
        if (errorEl) {
            errorEl.classList.add('hidden');
        }
    },

    showLoading(buttonEl, loadingText = 'Carregando...') {
        if (buttonEl) {
            buttonEl.disabled = true;
            buttonEl.dataset.originalText = buttonEl.textContent;
            buttonEl.textContent = loadingText;
        }
    },

    hideLoading(buttonEl) {
        if (buttonEl && buttonEl.dataset.originalText) {
            buttonEl.disabled = false;
            buttonEl.textContent = buttonEl.dataset.originalText;
        }
    }
};
