/**
 * Authentication utilities
 */
const auth = {
    async login(email, password) {
        try {
            const data = await api.post('auth/login', { email, password });

            // Check if we got a successful response with token
            if (data && data.token) {
                api.setToken(data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                return data;
            }

            // If no token but no error thrown, something is wrong
            throw new Error('Resposta inválida do servidor');
        } catch (error) {
            // Re-throw the error to be handled by the form
            throw error;
        }
    },

    async register(name, email, password) {
        try {
            const data = await api.post('auth/register', { name, email, password });

            // Check if we got a successful response with token
            if (data && data.token) {
                api.setToken(data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                return data;
            }

            // If no token but no error thrown, something is wrong
            throw new Error('Resposta inválida do servidor');
        } catch (error) {
            // Re-throw the error to be handled by the form
            throw error;
        }
    },

    logout() {
        api.removeToken();
        window.location.href = '/login';
    },

    getUser() {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    },

    isAuthenticated() {
        return !!api.getToken();
    },

    redirectIfNotAuth(redirectTo = '/login') {
        if (!this.isAuthenticated()) {
            window.location.href = redirectTo;
        }
    },

    redirectIfAuth(redirectTo = '/dashboard') {
        if (this.isAuthenticated()) {
            window.location.href = redirectTo;
        }
    }
};
