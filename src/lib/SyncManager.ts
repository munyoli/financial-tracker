/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const STORAGE_KEY = 'pending_quotes'; // User requested this key

export interface PendingOperation {
  id: string;
  type: 'order' | 'garment' | 'expense';
  method: 'POST' | 'PUT' | 'DELETE';
  url: string;
  data: any;
  timestamp: number;
}

class SyncManager {
  private getQueue(): PendingOperation[] {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  }

  private saveQueue(queue: PendingOperation[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  }

  enqueue(type: PendingOperation['type'], method: PendingOperation['method'], url: string, data: any) {
    const queue = this.getQueue();
    const operation: PendingOperation = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      method,
      url,
      data,
      timestamp: Date.now(),
    };
    queue.push(operation);
    this.saveQueue(queue);
    console.log(`[SyncManager] Enqueued ${method} ${url}`);
  }

  getPendingCount(): number {
    return this.getQueue().length;
  }

  async processQueue(apiFetch: <T>(url: string, options?: RequestInit) => Promise<T>): Promise<void> {
    const queue = this.getQueue();
    if (queue.length === 0) return;

    console.log(`[SyncManager] Processing ${queue.length} pending operations...`);
    
    const remainingQueue: PendingOperation[] = [];

    for (const op of queue) {
      try {
        await apiFetch(op.url, {
          method: op.method,
          body: JSON.stringify(op.data),
        });
        console.log(`[SyncManager] Successfully synced ${op.method} ${op.url}`);
      } catch (err) {
        console.error(`[SyncManager] Failed to sync ${op.method} ${op.url}:`, err);
        remainingQueue.push(op); // Keep it in the queue for next attempt
      }
    }

    this.saveQueue(remainingQueue);
  }
}

export const syncManager = new SyncManager();
