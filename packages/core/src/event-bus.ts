import { Cell, CellMetadata, CellType, Notebook } from "./types";

export type EventType =
  | "cell:created"
  | "cell:deleted"
  | "cell:updated"
  | "cell:moved"
  | "cell:mode-changed"
  | "cell:focused"
  | "selection:changed"
  | "history:undo"
  | "history:redo"
  | "history:checkpoint"
  | "notebook:updated"
  | "plugin:registered"
  | "plugin:unregistered"
  | string;

export interface EventPayload<T extends EventType = string> {
  type: T;
  timestamp: number;
  data: any;
}

export type EventHandler<T extends EventType = string> = (payload: EventPayload<T>) => void;
export type Unsubscribe = () => void;

/**
 * Typed synchronous event bus
 */
export class EventBus {
  private listeners: Map<string, Set<EventHandler>> = new Map();

  on<T extends EventType>(type: T, handler: EventHandler<T>): Unsubscribe {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    const handlers = this.listeners.get(type)!;
    handlers.add(handler as EventHandler);

    return () => this.off(type, handler);
  }

  once<T extends EventType>(type: T, handler: EventHandler<T>): Unsubscribe {
    const wrapper = (payload: EventPayload<T>) => {
      this.off(type, wrapper as EventHandler<T>);
      handler(payload);
    };
    return this.on(type, wrapper as EventHandler<T>);
  }

  off<T extends EventType>(type: T, handler: EventHandler<T>): void {
    const handlers = this.listeners.get(type);
    if (handlers) {
      handlers.delete(handler as EventHandler);
      if (handlers.size === 0) {
        this.listeners.delete(type);
      }
    }
  }

  emit<T extends EventType>(type: T, data: any): void {
    const handlers = this.listeners.get(type);
    if (handlers) {
      const payload: EventPayload<T> = {
        type,
        timestamp: Date.now(),
        data,
      };
      // Clone handlers to avoid issues if a handler unbinds during emit
      Array.from(handlers).forEach((handler) => {
        try {
          handler(payload);
        } catch (error) {
          console.error(`Error in event handler for ${type}:`, error);
        }
      });
    }
  }

  removeAllListeners(type?: EventType): void {
    if (type) {
      this.listeners.delete(type);
    } else {
      this.listeners.clear();
    }
  }
}
