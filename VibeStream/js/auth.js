// ==================== Authentication Manager ====================
// Handles user login, registration, and session management

class AuthManager {
    constructor() {
        this.usersPath = 'users.json';
        this.users = null;
        this.currentUser = null;
    }

    async init() {
        await this.loadUsers();
        this.loadSession();
    }

    // ==================== User Database ====================
    async loadUsers() {
        try {
            const response = await fetch(this.usersPath);
            if (!response.ok) {
                throw new Error('Failed to load users.json');
            }
            const data = await response.json();
            this.users = data.users || [];
            return this.users;
        } catch (error) {
            console.error('Error loading users:', error);
            this.users = [];
            return [];
        }
    }

    // ==================== Authentication ====================
    async login(username, password) {
        if (!this.users) {
            await this.loadUsers();
        }

        const user = this.users.find(u =>
            u.username === username && u.password === password
        );

        if (user) {
            // Create session (exclude password)
            this.currentUser = {
                id: user.id,
                username: user.username,
                name: user.name
            };
            this.saveSession();
            return { success: true, user: this.currentUser };
        } else {
            return { success: false, error: 'Invalid username or password' };
        }
    }

    async register(username, password, name) {
        if (!this.users) {
            await this.loadUsers();
        }

        // Check if username exists
        const exists = this.users.find(u => u.username === username);
        if (exists) {
            return { success: false, error: 'Username already exists' };
        }

        // Validate inputs
        if (!username || !password || !name) {
            return { success: false, error: 'All fields are required' };
        }

        if (username.length < 3) {
            return { success: false, error: 'Username must be at least 3 characters' };
        }

        if (password.length < 6) {
            return { success: false, error: 'Password must be at least 6 characters' };
        }

        // Create new user
        const newUser = {
            id: `user_${Date.now()}`,
            username: username,
            password: password,
            name: name,
            createdAt: new Date().toISOString()
        };

        // Note: In real app, this would save to backend
        // For demo, we just add to memory (lost on refresh)
        this.users.push(newUser);

        // Auto-login
        this.currentUser = {
            id: newUser.id,
            username: newUser.username,
            name: newUser.name
        };
        this.saveSession();

        return { success: true, user: this.currentUser };
    }

    logout() {
        this.currentUser = null;
        this.clearSession();
        window.location.href = 'auth.html';
    }

    // ==================== Session Management ====================
    saveSession() {
        if (this.currentUser) {
            localStorage.setItem('vibestream_current_user', JSON.stringify(this.currentUser));
        }
    }

    loadSession() {
        try {
            const saved = localStorage.getItem('vibestream_current_user');
            if (saved) {
                this.currentUser = JSON.parse(saved);
            }
        } catch (error) {
            console.error('Error loading session:', error);
            this.clearSession();
        }
    }

    clearSession() {
        localStorage.removeItem('vibestream_current_user');
        this.currentUser = null;
    }

    // ==================== Utility ====================
    getCurrentUser() {
        return this.currentUser;
    }

    isAuthenticated() {
        return this.currentUser !== null;
    }

    requireAuth() {
        if (!this.isAuthenticated()) {
            window.location.href = 'auth.html';
            return false;
        }
        return true;
    }

    getCurrentUserId() {
        return this.currentUser ? this.currentUser.id : null;
    }
}

// Export for use in other modules
window.AuthManager = AuthManager;
