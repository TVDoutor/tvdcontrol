<?php
session_start();
$pageTitle = 'Dashboard - TVDControl';
?>

<?php include __DIR__ . '/../includes/head.php'; ?>

<div class="min-h-screen bg-background-light dark:bg-background-dark">
    <!-- Header -->
    <header class="bg-surface-light dark:bg-surface-dark border-b border-border-light dark:border-border-dark px-6 py-4">
        <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
                <div class="flex items-center justify-center rounded-lg bg-primary/10 p-1">
                    <span class="material-symbols-outlined text-primary text-xl">inventory_2</span>
                </div>
                <span class="font-bold text-lg">TVDControl</span>
            </div>

            <div class="flex items-center gap-4">
                <span id="user-name" class="text-sm font-medium">Carregando...</span>
                <button 
                    id="logout-btn"
                    class="px-4 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 transition-colors"
                >
                    Sair
                </button>
            </div>
        </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-6 py-8">
        <h1 class="text-3xl font-bold mb-8">Dashboard</h1>

        <!-- Stats Grid -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div class="bg-surface-light dark:bg-surface-dark rounded-xl p-6 border border-border-light dark:border-border-dark">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm text-text-sub-light dark:text-text-sub-dark">Total de Itens</p>
                        <p id="total-items" class="text-3xl font-bold mt-2">--</p>
                    </div>
                    <span class="material-symbols-outlined text-primary text-4xl">inventory</span>
                </div>
            </div>

            <div class="bg-surface-light dark:bg-surface-dark rounded-xl p-6 border border-border-light dark:border-border-dark">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm text-text-sub-light dark:text-text-sub-dark">Em Uso</p>
                        <p id="in-use-items" class="text-3xl font-bold mt-2">--</p>
                    </div>
                    <span class="material-symbols-outlined text-blue-500 text-4xl">assignment_ind</span>
                </div>
            </div>

            <div class="bg-surface-light dark:bg-surface-dark rounded-xl p-6 border border-border-light dark:border-border-dark">
                <div>
                    <p class="text-sm text-text-sub-light dark:text-text-sub-dark">Disponíveis</p>
                    <p id="available-items" class="text-3xl font-bold mt-2">--</p>
                </div>
                <span class="material-symbols-outlined text-green-500 text-4xl">check_circle</span>
            </div>
        </div>

        <!-- Quick Links -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <a href="/inventory" class="block bg-surface-light dark:bg-surface-dark rounded-xl p-6 border border-border-light dark:border-border-dark hover:border-primary transition-colors">
                <div class="flex items-center gap-4">
                    <span class="material-symbols-outlined text-primary text-3xl">list_alt</span>
                    <div>
                        <h3 class="font-semibold text-lg">Inventário</h3>
                        <p class="text-sm text-text-sub-light dark:text-text-sub-dark">Ver todos os itens</p>
                    </div>
                </div>
            </a>

            <a id="users-link" href="/users" class="hidden block bg-surface-light dark:bg-surface-dark rounded-xl p-6 border border-border-light dark:border-border-dark hover:border-primary transition-colors">
                <div class="flex items-center gap-4">
                    <span class="material-symbols-outlined text-primary text-3xl">group</span>
                    <div>
                        <h3 class="font-semibold text-lg">Usuários</h3>
                        <p class="text-sm text-text-sub-light dark:text-text-sub-dark">Gerenciar usuários (Admin)</p>
                    </div>
                </div>
            </a>
        </div>
    </main>
</div>

<!-- JavaScript -->
<script src="/assets/js/api.js"></script>
<script src="/assets/js/auth.js"></script>
<script>
    // Require authentication auth.redirectIfNotAuth();

    // Load user info
    const user = auth.getUser();
    if (user) {
        document.getElementById('user-name').textContent = user.name;
        
        // Show users link if admin
        if (user.role === 'Administrador') {
            document.getElementById('users-link').classList.remove('hidden');
        }
    }

    // Logout button
    document.getElementById('logout-btn').addEventListener('click', () => {
        auth.logout();
    });

    // Load dashboard stats
    async function loadStats() {
        try {
            const items = await api.get('items');
            
            document.getElementById('total-items').textContent = items.length;
            document.getElementById('in-use-items').textContent = items.filter(i => i.status === 'in_use').length;
            document.getElementById('available-items').textContent = items.filter(i => i.status === 'available').length;
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    }

    loadStats();
</script>

</body>
</html>
