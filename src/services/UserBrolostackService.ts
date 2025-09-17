import { Task, TaskFormData } from '../types/task';
import { authService } from './AuthService';

class UserBrolostackService {
  private getCurrentUserId(): string | null {
    return authService.getCurrentUserId();
  }

  private getStorageKey(key: string): string {
    const userId = this.getCurrentUserId();
    return userId ? `user_${userId}_${key}` : key;
  }

  private getTasks(): Task[] {
    try {
      const tasks = localStorage.getItem(this.getStorageKey('tasks'));
      return tasks ? JSON.parse(tasks) : [];
    } catch (error) {
      console.warn('Failed to parse tasks:', error);
      return [];
    }
  }

  private saveTasks(tasks: Task[]): void {
    localStorage.setItem(this.getStorageKey('tasks'), JSON.stringify(tasks));
  }

  // Task-specific operations with user isolation
  async createTask(taskData: TaskFormData): Promise<Task> {
    const userId = this.getCurrentUserId();
    
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const timestamp = new Date().toISOString();
    const task: Task = {
      ...taskData,
      id: this.generateId(),
      completed: false,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    const tasks = this.getTasks();
    tasks.push(task);
    this.saveTasks(tasks);
    return task;
  }

  async getAllTasks(): Promise<Task[]> {
    const userId = this.getCurrentUserId();
    
    if (!userId) {
      throw new Error('User not authenticated');
    }

    return this.getTasks();
  }

  async updateTask(id: string, updates: Partial<TaskFormData>): Promise<Task | null> {
    const userId = this.getCurrentUserId();
    
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const tasks = this.getTasks();
    const index = tasks.findIndex(task => task.id === id);
    
    if (index === -1) return null;

    const updateData = {
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    const updatedTask = { ...tasks[index], ...updateData };
    tasks[index] = updatedTask;
    this.saveTasks(tasks);
    return updatedTask;
  }

  async deleteTask(id: string): Promise<boolean> {
    const userId = this.getCurrentUserId();
    
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const tasks = this.getTasks();
    const filteredTasks = tasks.filter(task => task.id !== id);
    
    if (filteredTasks.length === tasks.length) return false;

    this.saveTasks(filteredTasks);
    return true;
  }

  async toggleTask(id: string): Promise<Task | null> {
    const userId = this.getCurrentUserId();
    
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const tasks = this.getTasks();
    const task = tasks.find(t => t.id === id);
    
    if (!task) return null;

    const updatedTask = { ...task, completed: !task.completed, updatedAt: new Date().toISOString() };
    const index = tasks.findIndex(t => t.id === id);
    if (index !== -1) {
      tasks[index] = updatedTask;
      this.saveTasks(tasks);
    }
    return updatedTask;
  }

  // Batch operations
  async batchOperation(operations: Array<{
    operation: 'create' | 'update' | 'delete';
    data: any;
  }>): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (const op of operations) {
      try {
        switch (op.operation) {
          case 'create':
            await this.createTask(op.data);
            success++;
            break;
          case 'update':
            await this.updateTask(op.data.id, op.data);
            success++;
            break;
          case 'delete':
            await this.deleteTask(op.data);
            success++;
            break;
        }
      } catch (error) {
        console.warn('Batch operation failed:', error);
        failed++;
      }
    }

    return { success, failed };
  }

  // Export user data
  async exportUserData(): Promise<string> {
    const userId = this.getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');

    const tasks = await this.getAllTasks();
    const user = authService.getCurrentUser();
    
    const exportData = {
      version: 1,
      timestamp: new Date().toISOString(),
      user: {
        id: user?.userId,
        username: user?.username,
        firstName: user?.firstName,
        lastName: user?.lastName
      },
      data: {
        tasks
      }
    };

    return JSON.stringify(exportData, null, 2);
  }

  // Import user data
  async importUserData(jsonData: string): Promise<{ imported: number; errors: number }> {
    const userId = this.getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');

    try {
      const importData = JSON.parse(jsonData);
      
      if (!importData.data?.tasks || !Array.isArray(importData.data.tasks)) {
        throw new Error('Invalid import data format');
      }

      // Clear existing tasks
      const existingTasks = await this.getAllTasks();
      for (const task of existingTasks) {
        await this.deleteTask(task.id);
      }

      // Import new tasks
      const operations = importData.data.tasks.map((task: any) => ({
        operation: 'create' as const,
        data: {
          title: task.title,
          description: task.description,
          priority: task.priority,
          category: task.category,
          dueDate: task.dueDate
        }
      }));

      const result = await this.batchOperation(operations);
      return { imported: result.success, errors: result.failed };
    } catch (error) {
      console.error('Import failed:', error);
      return { imported: 0, errors: 1 };
    }
  }

  // Utility methods
  private generateId(): string {
    return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }

  // Get sync status
  getSyncStatus() {
    return {
      isOnline: navigator.onLine,
      lastSync: new Date().toISOString(),
      pendingOperations: 0
    };
  }

  // Force sync (placeholder for future implementation)
  async forceSync(): Promise<void> {
    // Simulate sync operation
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

// Create singleton instance
export const userBrolostackService = new UserBrolostackService();
export default UserBrolostackService;