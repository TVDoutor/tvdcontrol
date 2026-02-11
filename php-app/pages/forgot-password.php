<?php
session_start();
$pageTitle = 'Recuperar Senha - TVDControl';
?>

<?php include __DIR__ . '/../includes/head.php'; ?>

<div class="min-h-screen flex items-center justify-center px-4 py-12">
    <div class="max-w-md w-full space-y-8">
        <!-- Logo -->
        <div class="text-center">
            <div class="flex items-center justify-center gap-2 mb-2">
                <div class="flex items-center justify-center rounded-lg bg-primary/10 p-2">
                    <span class="material-symbols-outlined text-primary text-3xl">lock_reset</span>
                </div>
            </div>
            <h1 class="text-3xl font-bold text-text-main-light dark:text-text-main-dark">Recuperar Senha</h1>
            <p class="text-sm text-text-sub-light dark:text-text-sub-dark mt-2">Digite seu email para receber instruções</p>
        </div>

        <!-- Success Message -->
        <div id="success-message" class="hidden rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            Email enviado com sucesso! Verifique sua caixa de entrada.
        </div>

        <!-- Error Message -->
        <div id="error-message" class="hidden rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            Error message here
        </div>

        <!-- Forgot Password Form -->
        <div class="bg-surface-light dark:bg-surface-dark rounded-xl shadow-lg p-8">
            <form id="forgotPasswordForm" class="space-y-4">
                <div>
                    <label for="email" class="block text-sm font-medium mb-2">Email</label>
                    <input 
                        type="email" 
                        id="email" 
                        required
                        class="w-full px-4 py-2 rounded-lg border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="seu@email.com"
                    >
                </div>

                <button 
                    type="submit" 
                    id="submit-btn"
                    class="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
                >
                    Enviar Instruções
                </button>
            </form>

            <div class="mt-6 text-center space-y-2">
                <a href="/login" class="block text-primary hover:underline text-sm">
                    Voltar para o login
                </a>
            </div>
        </div>
    </div>
</div>

<!-- JavaScript -->
<script src="/assets/js/api.js"></script>
<script src="/assets/js/ui.js"></script>
<script>
    document.getElementById('forgotPasswordForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        ui.hideError();
        document.getElementById('success-message').classList.add('hidden');

        const email = document.getElementById('email').value;
        const btn = document.getElementById('submit-btn');

        ui.showLoading(btn, 'Enviando...');

        try {
            const response = await api.post('auth/forgot-password', { email });
            
            // Show success message
            const successEl = document.getElementById('success-message');
            
            // If we got a reset link (development mode), show it
            if (response.reset_link) {
                successEl.innerHTML = `
                    <p class="font-semibold mb-2">✅ Token gerado com sucesso!</p>
                    <p class="text-xs mb-2">Em produção, isso seria enviado por email.</p>
                    <p class="text-xs mb-2"><strong>Para desenvolvimento:</strong></p>
                    <a href="${response.reset_link}" class="block text-blue-600 hover:underline break-all">
                        ${window.location.origin}${response.reset_link}
                    </a>
                    <p class="text-xs mt-2 text-gray-600">Clique no link acima para redefinir sua senha</p>
                `;
            } else {
                successEl.textContent = 'Email enviado com sucesso! Verifique sua caixa de entrada.';
            }
            
            successEl.classList.remove('hidden');
            document.getElementById('forgotPasswordForm').reset();
            
            ui.hideLoading(btn);
        } catch (error) {
            ui.showError(error.message || 'Erro ao enviar email de recuperação');
            ui.hideLoading(btn);
        }
    });
</script>

</body>
</html>
