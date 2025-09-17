interface User {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  passwordHash: string;
  createdAt: string;
  lastLogin: string;
}

interface AuthSession {
  userId: string;
  username: string;
  firstName: string;
  lastName: string;
  sessionId: string;
  createdAt: string;
  expiresAt: string;
}

interface LoginResult {
  success: boolean;
  user?: Omit<User, 'passwordHash'>;
  session?: AuthSession;
  error?: string;
}

interface SignupResult {
  success: boolean;
  user?: Omit<User, 'passwordHash'>;
  error?: string;
}

class AuthService {
  private currentSession: AuthSession | null = null;
  private inactivityTimer: NodeJS.Timeout | null = null;
  private readonly SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours
  private readonly INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes

  constructor() {
    this.initializeAuth();
    this.setupInactivityTimer();
  }

  private getUsers(): User[] {
    try {
      const users = localStorage.getItem('task_manager_users');
      return users ? JSON.parse(users) : [];
    } catch (error) {
      console.warn('Failed to parse users:', error);
      return [];
    }
  }

  private saveUsers(users: User[]): void {
    localStorage.setItem('task_manager_users', JSON.stringify(users));
  }

  private findUserByUsername(username: string): User | null {
    const users = this.getUsers();
    return users.find(u => u.username === username.toLowerCase()) || null;
  }

  private addUser(user: User): void {
    const users = this.getUsers();
    users.push(user);
    this.saveUsers(users);
  }

  private updateUser(id: string, updates: Partial<User>): void {
    const users = this.getUsers();
    const index = users.findIndex(u => u.id === id);
    if (index !== -1) {
      users[index] = { ...users[index], ...updates };
      this.saveUsers(users);
    }
  }

  private async initializeAuth(): Promise<void> {
    try {
      // Check for existing session
      const sessionData = localStorage.getItem('task_manager_session');
      if (sessionData) {
        const session: AuthSession = JSON.parse(sessionData);
        
        // Check if session is still valid
        if (new Date(session.expiresAt) > new Date()) {
          this.currentSession = session;
          this.resetInactivityTimer();
        } else {
          // Session expired, clean up
          this.logout();
        }
      }
    } catch (error) {
      console.error('Failed to initialize auth:', error);
      this.logout();
    }
  }

  private async hashPassword(password: string): Promise<string> {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(password + 'task_manager_salt_2024');
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (error) {
      // Fallback for environments without crypto.subtle
      console.warn('Using fallback password hashing');
      return btoa(password + 'task_manager_salt_2024');
    }
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }

  private generateSessionId(): string {
    return 'session_' + this.generateId() + '_' + Date.now();
  }

  private validateInput(firstName: string, lastName: string, username: string, password: string): string[] {
    const errors: string[] = [];

    if (!firstName || firstName.trim().length < 2) {
      errors.push('First name must be at least 2 characters');
    }

    if (!lastName || lastName.trim().length < 2) {
      errors.push('Last name must be at least 2 characters');
    }

    if (!username || username.trim().length < 3) {
      errors.push('Username must be at least 3 characters');
    }

    if (!password || password.length < 6) {
      errors.push('Password must be at least 6 characters');
    }

    // Check for valid characters
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      errors.push('Username can only contain letters, numbers, and underscores');
    }

    return errors;
  }

  private setupInactivityTimer(): void {
    // Reset timer on user activity
    const resetTimer = () => this.resetInactivityTimer();
    
    document.addEventListener('mousedown', resetTimer);
    document.addEventListener('keypress', resetTimer);
    document.addEventListener('touchstart', resetTimer);
    document.addEventListener('scroll', resetTimer);
  }

  private resetInactivityTimer(): void {
    if (!this.currentSession) return;

    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
    }

    this.inactivityTimer = setTimeout(() => {
      console.log('Session expired due to inactivity');
      this.logout();
    }, this.INACTIVITY_TIMEOUT);
  }

  async signup(firstName: string, lastName: string, username: string, password: string): Promise<SignupResult> {
    try {
      // Validate input
      const validationErrors = this.validateInput(firstName, lastName, username, password);
      if (validationErrors.length > 0) {
        return { success: false, error: validationErrors.join(', ') };
      }

      // Check if username already exists
      const existingUser = this.findUserByUsername(username);
      if (existingUser) {
        return { success: false, error: 'Username already exists' };
      }

      // Hash password
      const passwordHash = await this.hashPassword(password);

      // Create new user
      const newUser: User = {
        id: this.generateId(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        username: username.trim().toLowerCase(),
        passwordHash,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      };

      // Store user
      this.addUser(newUser);

      // Return user without password hash
      const { passwordHash: _, ...userWithoutPassword } = newUser;
      return { success: true, user: userWithoutPassword };

    } catch (error) {
      console.error('Signup error:', error);
      return { success: false, error: 'Failed to create account. Please try again.' };
    }
  }

  async login(username: string, password: string): Promise<LoginResult> {
    try {
      if (!username || !password) {
        return { success: false, error: 'Username and password are required' };
      }

      // Find user
      const user = this.findUserByUsername(username);
      if (!user) {
        return { success: false, error: 'Invalid username or password' };
      }

      // Verify password
      const passwordHash = await this.hashPassword(password);
      if (user.passwordHash !== passwordHash) {
        return { success: false, error: 'Invalid username or password' };
      }

      // Update last login
      this.updateUser(user.id, {
        lastLogin: new Date().toISOString()
      });

      // Create session
      const session: AuthSession = {
        userId: user.id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        sessionId: this.generateSessionId(),
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + this.SESSION_DURATION).toISOString()
      };

      // Store session
      localStorage.setItem('task_manager_session', JSON.stringify(session));
      this.currentSession = session;
      this.resetInactivityTimer();

      // Return user without password hash
      const { passwordHash: _, ...userWithoutPassword } = user;
      return { success: true, user: userWithoutPassword, session };

    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Login failed. Please try again.' };
    }
  }

  logout(): void {
    try {
      // Clear session
      localStorage.removeItem('task_manager_session');
      this.currentSession = null;

      // Clear inactivity timer
      if (this.inactivityTimer) {
        clearTimeout(this.inactivityTimer);
        this.inactivityTimer = null;
      }

      // Trigger logout event
      window.dispatchEvent(new CustomEvent('auth:logout'));
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  isAuthenticated(): boolean {
    if (!this.currentSession) return false;
    
    // Check if session is still valid
    if (new Date(this.currentSession.expiresAt) <= new Date()) {
      this.logout();
      return false;
    }

    return true;
  }

  getCurrentUser(): AuthSession | null {
    return this.isAuthenticated() ? this.currentSession : null;
  }

  getCurrentUserId(): string | null {
    return this.currentSession?.userId || null;
  }

  // Get user-specific data storage key
  getUserStoragePrefix(): string | null {
    if (!this.isAuthenticated() || !this.currentSession) return null;
    return `user_${this.currentSession.userId}`;
  }

  // Switch between user accounts
  async switchAccount(): Promise<void> {
    this.logout();
    // The app will redirect to login automatically
  }

  // Get all stored accounts (for account switching)
  async getStoredAccounts(): Promise<Array<{ username: string; firstName: string; lastName: string }>> {
    try {
      const users = this.getUsers();
      return users.map((user: User) => ({
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName
      }));
    } catch (error) {
      console.error('Failed to get stored accounts:', error);
      return [];
    }
  }
}

// Create singleton instance
export const authService = new AuthService();
export default AuthService;