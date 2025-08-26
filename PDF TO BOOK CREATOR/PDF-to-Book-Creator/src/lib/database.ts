// Simple file-based storage system for PDF to Book Creator
// This will be upgraded to a proper database later

export interface StoredFile {
  id: string;
  filename: string;
  originalName: string;
  size: number;
  uploadDate: string;
  type: 'pdf' | 'cover';
  userId?: string;
}

export interface UserSession {
  id: string;
  createdAt: string;
  files: StoredFile[];
  projects: ProjectData[];
}

export interface ProjectData {
  id: string;
  name: string;
  pdfFile?: StoredFile;
  coverFile?: StoredFile;
  bookFormat?: string;
  status: 'draft' | 'processing' | 'completed';
  createdAt: string;
  updatedAt: string;
}

class SimpleStorage {
  private sessions: Map<string, UserSession> = new Map();
  private files: Map<string, StoredFile> = new Map();

  // Generate a simple session ID
  generateSessionId(): string {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Generate a file ID
  generateFileId(): string {
    return 'file_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Create a new session
  createSession(): UserSession {
    const sessionId = this.generateSessionId();
    const session: UserSession = {
      id: sessionId,
      createdAt: new Date().toISOString(),
      files: [],
      projects: []
    };
    this.sessions.set(sessionId, session);
    return session;
  }

  // Get session by ID
  getSession(sessionId: string): UserSession | null {
    return this.sessions.get(sessionId) || null;
  }

  // Store a file
  storeFile(sessionId: string, file: Omit<StoredFile, 'id' | 'uploadDate'>): StoredFile {
    const fileId = this.generateFileId();
    const storedFile: StoredFile = {
      ...file,
      id: fileId,
      uploadDate: new Date().toISOString()
    };
    
    this.files.set(fileId, storedFile);
    
    // Add to session
    const session = this.getSession(sessionId);
    if (session) {
      session.files.push(storedFile);
    }
    
    return storedFile;
  }

  // Get file by ID
  getFile(fileId: string): StoredFile | null {
    return this.files.get(fileId) || null;
  }

  // Create a new project
  createProject(sessionId: string, name: string): ProjectData {
    const projectId = 'project_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    const project: ProjectData = {
      id: projectId,
      name,
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const session = this.getSession(sessionId);
    if (session) {
      session.projects.push(project);
    }
    
    return project;
  }

  // Update project
  updateProject(sessionId: string, projectId: string, updates: Partial<ProjectData>): ProjectData | null {
    const session = this.getSession(sessionId);
    if (!session) return null;
    
    const projectIndex = session.projects.findIndex(p => p.id === projectId);
    if (projectIndex === -1) return null;
    
    session.projects[projectIndex] = {
      ...session.projects[projectIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    return session.projects[projectIndex];
  }

  // Get all projects for a session
  getProjects(sessionId: string): ProjectData[] {
    const session = this.getSession(sessionId);
    return session ? session.projects : [];
  }

  // Clean up old sessions (older than 24 hours)
  cleanup(): void {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    for (const [sessionId, session] of this.sessions.entries()) {
      if (new Date(session.createdAt) < oneDayAgo) {
        // Remove associated files
        session.files.forEach(file => {
          this.files.delete(file.id);
        });
        
        // Remove session
        this.sessions.delete(sessionId);
      }
    }
  }
}

// Export singleton instance
export const storage = new SimpleStorage();

// Auto cleanup every hour
setInterval(() => {
  storage.cleanup();
}, 60 * 60 * 1000);