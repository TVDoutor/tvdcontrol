<?php
session_start();
$pageTitle = 'Login - TVDControl';
?>

<?php include __DIR__ . '/../includes/head.php'; ?>

<div class="min-h-screen flex items-center justify-center px-4 py-12">
    <div class="max-w-md w-full space-y-8">
        <!-- Logo -->
        <div class="text-center">
            <div class="flex items-center justify-center gap-2 mb-2">
                <div class="flex items-center justify-center rounded-lg bg-primary/10 p-2">
                    <span class="material-symbols-outlined text-primary text-3xl">inventory_2</span>
                </div>
            </div>
            <h1 class="text-3xl font-bold text-text-main-light dark:text-text-main-dark">TVDControl</h1>
            <p class="text-sm text-text-sub-light dark:text-text-sub-dark mt-2">Sistema de Gerenciamento de Inventário</p>
        </div>

        <!-- Error Message -->
        <div id="error-message" class="hidden rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            Error message here
        </div>

        <!-- Login Form -->
        <div id="login-form" class="bg-surface-light dark:bg-surface-dark rounded-xl shadow-lg p-8">
            <h2 class="text-2xl font-semibold mb-6">Entrar</h2>
            
            <form id="loginForm" class="space-y-4">
                <div>
                    <label for="login-email" class="block text-sm font-medium mb-2">Email</label>
                    <input 
                        type="email" 
                        id="login-email" 
                        required
                        class="w-full px-4 py-2 rounded-lg border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="seu@email.com"
                    >
                </div>

                <div>
                    <label for="login-password" class="block text-sm font-medium mb-2">Senha</label>
                    <input 
                        type="password" 
                        id="login-password" 
                        required
                        class="w-full px-4 py-2 rounded-lg border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="••••••••"
                    >
                </div>

                <button 
                    type="submit" 
                    id="login-btn"
                    class="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
                >
                    Entrar
                </button>
            </form>

            <div class="mt-6 text-center space-y-2">
                <a href="/forgot-password" class="block text-text-sub-light dark:text-text-sub-dark hover:text-primary text-sm">
                    Esqueceu sua senha?
                </a>
                <button 
                    id="show-register-btn" 
                    class="text-primary hover:underline text-sm"
                >
                    Não tem conta? Criar conta
                </button>
            </div>
        </div>

        <!-- Register Form (Hidden by default) -->
        <div id="register-form" class="hidden bg-surface-light dark:bg-surface-dark rounded-xl shadow-lg p-8">
            <h2 class="text-2xl font-semibold mb-6">Criar Conta</h2>
            
            <form id="registerForm" class="space-y-4">
                <div>
                    <label for="register-name" class="block text-sm font-medium mb-2">Nome Completo</label>
                    <input 
                        type="text" 
                        id="register-name" 
                        required
                        class="w-full px-4 py-2 rounded-lg border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="João Silva"
                    >
                </div>

                <div>
                    <label for="register-email" class="block text-sm font-medium mb-2">Email</label>
                    <input 
                        type="email" 
                        id="register-email" 
                        required
                        class="w-full px-4 py-2 rounded-lg border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="seu@email.com"
                    >
                </div>

                <div>
                    <label for="register-password" class="block text-sm font-medium mb-2">Senha</label>
                    <input 
                        type="password" 
                        id="register-password" 
                        required
                        minlength="6"
                        class="w-full px-4 py-2 rounded-lg border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="••••••••"
                    >
                </div>

                <div>
                    <label for="register-password-confirm" class="block text-sm font-medium mb-2">Confirmar Senha</label>
                    <input 
                        type="password" 
                        id="register-password-confirm" 
                        required
                        minlength="6"
                        class="w-full px-4 py-2 rounded-lg border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="••••••••"
                    >
                </div>

                <button 
                    type="submit" 
                    id="register-btn"
                    class="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
                >
                    Criar Conta
                </button>
            </form>

            <div class="mt-6 text-center">
                <button 
                    id="show-login-btn" 
                    class="text-primary hover:underline text-sm"
                >
                    Já tem conta? Fazer login
                </button>
            </div>
        </div>
    </div>
</div>

<!-- JavaScript -->
<script src="/assets/js/api.js"></script>
<script src="/assets/js/auth.js"></script>
<script src="/assets/js/ui.js"></script>
<script>
    // Redirect if already logged in
    auth.redirectIfAuth();

    // Toggle between login and register forms
    document.getElementById('show-register-btn').addEventListener('click', () => {
        document.getElementById('login-form').classList.add('hidden');
        document.getElementById('register-form').classList.remove('hidden');
        ui.hideError();
    });

    document.getElementById('show-login-btn').addEventListener('click', () => {
        document.getElementById('register-form').classList.add('hidden');
        document.getElementById('login-form').classList.remove('hidden');
        ui.hideError();
    });

    // Login form submission
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        ui.hideError();

        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        const btn = document.getElementById('login-btn');

        ui.showLoading(btn, 'Entrando...');

        try {
            await auth.login(email, password);
            window.location.href = '/dashboard';
        } catch (error) {
            ui.showError(error.message || 'Erro ao fazer login');
            ui.hideLoading(btn);
        }
    });

    // Register form submission
    document.getElementById('registerForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        ui.hideError();

        const name = document.getElementById('register-name').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const passwordConfirm = document.getElementById('register-password-confirm').value;

        if (password !== passwordConfirm) {
            ui.showError('As senhas não coincidem');
            return;
        }

        if (password.length < 6) {
            ui.showError('A senha deve ter pelo menos 6 caracteres');
            return;
        }

        const btn = document.getElementById('register-btn');
        ui.showLoading(btn, 'Criando conta...');

        try {
            await auth.register(name, email, password);
            window.location.href = '/dashboard';
        } catch (error) {
            ui.showError(error.message || 'Erro ao criar conta');
            ui.hideLoading(btn);
        }
    });
</script>

</body>
</html>
