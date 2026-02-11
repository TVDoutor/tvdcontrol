<?php
session_start();
$pageTitle = 'Redefinir Senha - TVDControl';

// Get token from URL
$token = $_GET['token'] ?? '';
?>

<?php include __DIR__ . '/../includes/head.php'; ?>

<div class="min-h-screen flex items-center justify-center px-4 py-12">
    <div class="max-w-md w-full space-y-8">
        <!-- Logo -->
        <div class="text-center">
            <div class="flex items-center justify-center gap-2 mb-2">
                <div class="flex items-center justify-center rounded-lg bg-primary/10 p-2">
                    <span class="material-symbols-outlined text-primary text-3xl">vpn_key</span>
                </div>
            </div>
            <h1 class="text-3xl font-bold text-text-main-light dark:text-text-main-dark">Redefinir Senha</h1>
            <p class="text-sm text-text-sub-light dark:text-text-sub-dark mt-2">Digite sua nova senha</p>
        </div>

        <!-- Error Message -->
        <div id="error-message" class="hidden rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            Error message here
        </div>

        <?php if (empty($token)): ?>
            <!-- No Token -->
            <div class="bg-surface-light dark:bg-surface-dark rounded-xl shadow-lg p-8 text-center">
                <p class="text-red-600 mb-4">Token inválido ou expirado</p>
                <a href="/forgot-password" class="text-primary hover:underline">
                    Solicitar nova recuperação
                </a>
            </div>
        <?php else: ?>
            <!-- Reset Password Form -->
            <div class="bg-surface-light dark:bg-surface-dark rounded-xl shadow-lg p-8">
                <form id="resetPasswordForm" class="space-y-4">
                    <input type="hidden" id="token" value="<?php echo htmlspecialchars($token); ?>">
                    
                    <div>
                        <label for="password" class="block text-sm font-medium mb-2">Nova Senha</label>
                        <input 
                            type="password" 
                            id="password" 
                            required
                            minlength="6"
                            class="w-full px-4 py-2 rounded-lg border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark focus:outline-none focus:ring-2 focus:ring-primary"
                            placeholder="••••••••"
                        >
                    </div>

                    <div>
                        <label for="password-confirm" class="block text-sm font-medium mb-2">Confirmar Senha</label>
                        <input 
                            type="password" 
                            id="password-confirm" 
                            required
                            minlength="6"
                            class="w-full px-4 py-2 rounded-lg border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark focus:outline-none focus:ring-2 focus:ring-primary"
                            placeholder="••••••••"
                        >
                    </div>

                    <button 
                        type="submit" 
                        id="submit-btn"
                        class="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
                    >
                        Redefinir Senha
                    </button>
                </form>

                <div class="mt-6 text-center">
                    <a href="/login" class="text-primary hover:underline text-sm">
                        Voltar para o login
                    </a>
                </div>
            </div>
        <?php endif; ?>
    </div>
</div>

<!-- JavaScript -->
<script src="/assets/js/api.js"></script>
<script src="/assets/js/ui.js"></script>
<script>
    const form = document.getElementById('resetPasswordForm');
    
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            ui.hideError();

            const token = document.getElementById('token').value;
            const password = document.getElementById('password').value;
            const passwordConfirm = document.getElementById('password-confirm').value;

            if (password !== passwordConfirm) {
                ui.showError('As senhas não coincidem');
                return;
            }

            if (password.length < 6) {
                ui.showError('A senha deve ter pelo menos 6 caracteres');
                return;
            }

            const btn = document.getElementById('submit-btn');
            ui.showLoading(btn, 'Redefinindo...');

            try {
                await api.post('auth/reset-password', { token, password });
                
                alert('Senha redefinida com sucesso! Você será redirecionado para o login.');
                window.location.href = '/login';
            } catch (error) {
                ui.showError(error.message || 'Erro ao redefinir senha');
                ui.hideLoading(btn);
            }
        });
    }
</script>

</body>
</html>
