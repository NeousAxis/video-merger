// Simple authentication system for PDF to Book Creator
// This will be upgraded with proper authentication later

export interface User {
  id: string;
  email?: string;
  sessionId: string;
  createdAt: string;
  isGuest: boolean;
}

class AuthService {
  private users: Map<string, User> = new Map();
  private sessions: Map<string, string> = new Map(); // sessionId -> userId

  // Generate user ID
  generateUserId(): string {
    return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Generate session ID
  generateSessionId(): string {
    return 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Create guest user
  createGuestUser(): User {
    const userId = this.generateUserId();
    const sessionId = this.generateSessionId();
    
    const user: User = {
      id: userId,
      sessionId,
      createdAt: new Date().toISOString(),
      isGuest: true
    };
    
    this.users.set(userId, user);
    this.sessions.set(sessionId, userId);
    
    return user;
  }

  // Get user by session ID
  getUserBySession(sessionId: string): User | null {
    const userId = this.sessions.get(sessionId);
    if (!userId) return null;
    
    return this.users.get(userId) || null;
  }

  // Validate session
  validateSession(sessionId: string): boolean {
    return this.sessions.has(sessionId);
  }

  // Clean up old sessions (older than 24 hours)
  cleanup(): void {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    for (const [userId, user] of this.users.entries()) {
      if (new Date(user.createdAt) < oneDayAgo) {
        this.sessions.delete(user.sessionId);
        this.users.delete(userId);
      }
    }
  }

  // Get or create session for request
  getOrCreateSession(req: any): User {
    const sessionId = req.headers['x-session-id'] || req.cookies?.sessionId;
    
    if (sessionId && this.validateSession(sessionId)) {
      const user = this.getUserBySession(sessionId);
      if (user) return user;
    }
    
    // Create new guest user
    return this.createGuestUser();
  }
}

// Export singleton instance
export const authService = new AuthService();

// Auto cleanup every hour
setInterval(() => {
  authService.cleanup();
}, 60 * 60 * 1000);