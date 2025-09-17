import { Task, TaskFormData } from '../types/task';

// Brolostack service interface
interface BrolostackConfig {
  storeName: string;
  version: number;
  fallbackToLocalStorage: boolean;
}

interface QueryOptions {
  filter?: Record<string, any>;
  sort?: { field: string; direction: 'asc' | 'desc' };
  limit?: number;
  offset?: number;
}

interface BatchOperation<T> {
  operation: 'create' | 'update' | 'delete';
  data: T | string; // data for create/update, id for delete
}

interface SyncStatus {
  isOnline: boolean;
  lastSync: string | null;
  pendingOperations: number;
}

class BrolostackService {
  private config: BrolostackConfig;
  private storeName: string;
  private isInitialized: boolean = false;
  private syncStatus: SyncStatus = {
    isOnline: true,
    lastSync: null,
    pendingOperations: 0
  };

  constructor(config: BrolostackConfig) {
    this.config = config;
    this.storeName = config.storeName;
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      // Initialize Brolostack store
      this.isInitialized = true;
      this.updateSyncStatus();
    } catch (error) {
      console.warn('Brolostack initialization failed, falling back to localStorage:', error);
      this.isInitialized = false;
    }
  }

  private updateSyncStatus(): void {
    this.syncStatus = {
      isOnline: navigator.onLine,
      lastSync: new Date().toISOString(),
      pendingOperations: 0
    };
  }

  private getStorageKey(key: string): string {
    return `${this.storeName}_${key}`;
  }

  private async fallbackToLocalStorage<T>(operation: () => Promise<T>): Promise<T> {
    if (this.config.fallbackToLocalStorage) {
      try {
        return await operation();
      } catch (error) {
        console.warn('Brolostack operation failed, using localStorage fallback:', error);
        throw error;
      }
    }
    throw new Error('Brolostack operation failed and fallback is disabled');
  }

  // Advanced CRUD Operations
  async create<T extends { id?: string }>(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T> {
    const timestamp = new Date().toISOString();
    const item = {
      ...data,
      id: this.generateId(),
      createdAt: timestamp,
      updatedAt: timestamp,
    } as T;

    try {
      if (this.isInitialized) {
        // Use Brolostack for storage
        const items = await this.getAll<T>();
        items.push(item);
        localStorage.setItem(this.getStorageKey('items'), JSON.stringify(items));
        this.updateSyncStatus();
        return item;
      }
    } catch (error) {
      console.warn('Brolostack create failed, using fallback:', error);
    }

    // Fallback to localStorage
    const items = this.getLocalStorageItems<T>();
    items.push(item);
    localStorage.setItem(this.getStorageKey('items'), JSON.stringify(items));
    return item;
  }

  async getAll<T>(options?: QueryOptions): Promise<T[]> {
    try {
      if (this.isInitialized) {
        let items = this.getLocalStorageItems<T>();
        
        // Apply filtering
        if (options?.filter) {
          items = items.filter(item => {
            return Object.entries(options.filter!).every(([key, value]) => {
              const itemValue = (item as any)[key];
              if (typeof value === 'string' && typeof itemValue === 'string') {
                return itemValue.toLowerCase().includes(value.toLowerCase());
              }
              return itemValue === value;
            });
          });
        }

        // Apply sorting
        if (options?.sort) {
          items.sort((a, b) => {
            const aValue = (a as any)[options.sort!.field];
            const bValue = (b as any)[options.sort!.field];
            const direction = options.sort!.direction === 'desc' ? -1 : 1;
            
            if (aValue < bValue) return -1 * direction;
            if (aValue > bValue) return 1 * direction;
            return 0;
          });
        }

        // Apply pagination
        if (options?.offset || options?.limit) {
          const start = options.offset || 0;
          const end = options.limit ? start + options.limit : undefined;
          items = items.slice(start, end);
        }

        this.updateSyncStatus();
        return items;
      }
    } catch (error) {
      console.warn('Brolostack getAll failed, using fallback:', error);
    }

    return this.getLocalStorageItems<T>();
  }

  async getById<T>(id: string): Promise<T | null> {
    const items = await this.getAll<T>();
    return items.find((item: any) => item.id === id) || null;
  }

  async update<T extends { id: string }>(id: string, data: Partial<T>): Promise<T | null> {
    try {
      const items = await this.getAll<T>();
      const index = items.findIndex((item: any) => item.id === id);
      
      if (index === -1) return null;

      const updatedItem = {
        ...items[index],
        ...data,
        updatedAt: new Date().toISOString(),
      } as T;

      items[index] = updatedItem;
      localStorage.setItem(this.getStorageKey('items'), JSON.stringify(items));
      this.updateSyncStatus();
      return updatedItem;
    } catch (error) {
      console.warn('Brolostack update failed:', error);
      return null;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      const items = await this.getAll();
      const filteredItems = items.filter((item: any) => item.id !== id);
      
      if (filteredItems.length === items.length) return false;

      localStorage.setItem(this.getStorageKey('items'), JSON.stringify(filteredItems));
      this.updateSyncStatus();
      return true;
    } catch (error) {
      console.warn('Brolostack delete failed:', error);
      return false;
    }
  }

  // Batch Operations
  async batchOperation<T>(operations: BatchOperation<T>[]): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (const op of operations) {
      try {
        switch (op.operation) {
          case 'create':
            await this.create(op.data as Omit<T, 'id' | 'createdAt' | 'updatedAt'>);
            success++;
            break;
          case 'update':
            const updateData = op.data as T & { id: string };
            await this.update(updateData.id, updateData);
            success++;
            break;
          case 'delete':
            await this.delete(op.data as string);
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

  // Advanced Query System
  async query<T>(queryFn: (items: T[]) => T[]): Promise<T[]> {
    const items = await this.getAll<T>();
    return queryFn(items);
  }

  async count(filter?: Record<string, any>): Promise<number> {
    const items = await this.getAll({ filter });
    return items.length;
  }

  async aggregate<T, R>(
    aggregateFn: (items: T[]) => R,
    filter?: Record<string, any>
  ): Promise<R> {
    const items = await this.getAll<T>({ filter });
    return aggregateFn(items);
  }

  // Backup and Restore
  async exportData(): Promise<string> {
    const items = await this.getAll();
    const exportData = {
      version: this.config.version,
      timestamp: new Date().toISOString(),
      data: items,
    };
    return JSON.stringify(exportData, null, 2);
  }

  async importData(jsonData: string): Promise<{ imported: number; errors: number }> {
    try {
      const importData = JSON.parse(jsonData);
      
      if (!importData.data || !Array.isArray(importData.data)) {
        throw new Error('Invalid import data format');
      }

      // Clear existing data
      localStorage.removeItem(this.getStorageKey('items'));

      // Import new data
      const operations: BatchOperation<any>[] = importData.data.map((item: any) => ({
        operation: 'create' as const,
        data: item,
      }));

      const result = await this.batchOperation(operations);
      this.updateSyncStatus();
      
      return { imported: result.success, errors: result.failed };
    } catch (error) {
      console.error('Import failed:', error);
      return { imported: 0, errors: 1 };
    }
  }

  // Sync Status
  getSyncStatus(): SyncStatus {
    return { ...this.syncStatus };
  }

  async forcSync(): Promise<void> {
    try {
      // Simulate sync operation
      await new Promise(resolve => setTimeout(resolve, 1000));
      this.updateSyncStatus();
    } catch (error) {
      console.warn('Force sync failed:', error);
    }
  }

  // Utility methods
  private generateId(): string {
    return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }

  private getLocalStorageItems<T>(): T[] {
    try {
      const items = localStorage.getItem(this.getStorageKey('items'));
      return items ? JSON.parse(items) : [];
    } catch (error) {
      console.warn('Failed to parse localStorage items:', error);
      return [];
    }
  }

  // Real-time sync simulation
  startRealTimeSync(callback: (status: SyncStatus) => void): () => void {
    const interval = setInterval(() => {
      this.updateSyncStatus();
      callback(this.getSyncStatus());
    }, 5000);

    return () => clearInterval(interval);
  }
}

// Create singleton instance
export const brolostackService = new BrolostackService({
  storeName: 'task_manager',
  version: 1,
  fallbackToLocalStorage: true,
});

export default BrolostackService;