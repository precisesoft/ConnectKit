/**
 * Local storage utility functions with error handling and type safety
 */

import { STORAGE_KEYS } from './constants';

// Generic storage functions with error handling
export class Storage {
  /**
   * Get item from localStorage with JSON parsing
   */
  static get<T>(key: string, defaultValue?: T): T | null {
    try {
      const item = localStorage.getItem(key);
      if (item === null) {
        return defaultValue || null;
      }
      return JSON.parse(item);
    } catch (error) {
      console.error(`Error reading from localStorage (${key}):`, error);
      return defaultValue || null;
    }
  }

  /**
   * Set item in localStorage with JSON stringification
   */
  static set<T>(key: string, value: T): boolean {
    try {
      localStorage.setItem(key, JSON.stringify(value));

      // Dispatch custom event for cross-tab synchronization
      window.dispatchEvent(
        new CustomEvent('storage-change', {
          detail: { key, newValue: value },
        })
      );

      return true;
    } catch (error) {
      console.error(`Error writing to localStorage (${key}):`, error);
      return false;
    }
  }

  /**
   * Remove item from localStorage
   */
  static remove(key: string): boolean {
    try {
      localStorage.removeItem(key);

      // Dispatch custom event for cross-tab synchronization
      window.dispatchEvent(
        new CustomEvent('storage-change', {
          detail: { key, newValue: null },
        })
      );

      return true;
    } catch (error) {
      console.error(`Error removing from localStorage (${key}):`, error);
      return false;
    }
  }

  /**
   * Clear all localStorage
   */
  static clear(): boolean {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.error('Error clearing localStorage:', error);
      return false;
    }
  }

  /**
   * Get all keys from localStorage
   */
  static getKeys(): string[] {
    try {
      return Object.keys(localStorage);
    } catch (error) {
      console.error('Error getting localStorage keys:', error);
      return [];
    }
  }

  /**
   * Check if localStorage is available
   */
  static isAvailable(): boolean {
    try {
      const test = '__localStorage_test__';
      localStorage.setItem(test, 'test');
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get storage usage information
   */
  static getStorageInfo(): {
    used: number;
    available: number;
    total: number;
    percentage: number;
  } {
    try {
      let used = 0;
      for (const key in localStorage) {
        if (Object.prototype.hasOwnProperty.call(localStorage, key)) {
          used += localStorage[key].length;
        }
      }

      // Most browsers have a 5-10MB limit for localStorage
      const total = 5 * 1024 * 1024; // Assume 5MB
      const available = total - used;
      const percentage = (used / total) * 100;

      return { used, available, total, percentage };
    } catch (error) {
      console.error('Error getting storage info:', error);
      return { used: 0, available: 0, total: 0, percentage: 0 };
    }
  }
}

// Specific storage functions for different data types
export class AuthStorage {
  private static key = STORAGE_KEYS.AUTH;

  static getAuthData(): {
    token: string | null;
    refreshToken: string | null;
    user: any | null;
    expiresAt: string | null;
  } {
    return Storage.get(this.key, {
      token: null,
      refreshToken: null,
      user: null,
      expiresAt: null,
    });
  }

  static setAuthData(data: {
    token?: string;
    refreshToken?: string;
    user?: any;
    expiresAt?: string;
  }): boolean {
    const current = this.getAuthData();
    return Storage.set(this.key, { ...current, ...data });
  }

  static clearAuthData(): boolean {
    return Storage.remove(this.key);
  }

  static getToken(): string | null {
    const data = this.getAuthData();
    return data.token;
  }

  static setToken(token: string): boolean {
    return this.setAuthData({ token });
  }
}

export class UIStorage {
  private static key = STORAGE_KEYS.UI;

  static getUIState(): {
    sidebarOpen: boolean;
    sidebarWidth: number;
    themeMode: 'light' | 'dark' | 'system';
    densityMode: 'compact' | 'standard' | 'comfortable';
  } {
    return Storage.get(this.key, {
      sidebarOpen: true,
      sidebarWidth: 280,
      themeMode: 'light',
      densityMode: 'standard',
    });
  }

  static setUIState(
    state: Partial<{
      sidebarOpen: boolean;
      sidebarWidth: number;
      themeMode: 'light' | 'dark' | 'system';
      densityMode: 'compact' | 'standard' | 'comfortable';
    }>
  ): boolean {
    const current = this.getUIState();
    return Storage.set(this.key, { ...current, ...state });
  }

  static clearUIState(): boolean {
    return Storage.remove(this.key);
  }
}

export class PreferencesStorage {
  private static key = STORAGE_KEYS.USER_PREFERENCES;

  static getPreferences(): {
    language: string;
    timezone: string;
    dateFormat: string;
    emailNotifications: boolean;
    pushNotifications: boolean;
  } {
    return Storage.get(this.key, {
      language: 'en',
      timezone: 'UTC',
      dateFormat: 'MM/dd/yyyy',
      emailNotifications: true,
      pushNotifications: true,
    });
  }

  static setPreferences(
    prefs: Partial<{
      language: string;
      timezone: string;
      dateFormat: string;
      emailNotifications: boolean;
      pushNotifications: boolean;
    }>
  ): boolean {
    const current = this.getPreferences();
    return Storage.set(this.key, { ...current, ...prefs });
  }

  static clearPreferences(): boolean {
    return Storage.remove(this.key);
  }
}

export class SearchStorage {
  private static key = STORAGE_KEYS.RECENT_SEARCHES;
  private static maxItems = 10;

  static getRecentSearches(): string[] {
    return Storage.get(this.key, []);
  }

  static addRecentSearch(query: string): boolean {
    const current = this.getRecentSearches();

    // Remove existing occurrence
    const filtered = current.filter(item => item !== query);

    // Add to beginning and limit size
    const updated = [query, ...filtered].slice(0, this.maxItems);

    return Storage.set(this.key, updated);
  }

  static removeRecentSearch(query: string): boolean {
    const current = this.getRecentSearches();
    const filtered = current.filter(item => item !== query);
    return Storage.set(this.key, filtered);
  }

  static clearRecentSearches(): boolean {
    return Storage.remove(this.key);
  }
}

// Session storage functions (for temporary data)
export class SessionStorage {
  /**
   * Get item from sessionStorage with JSON parsing
   */
  static get<T>(key: string, defaultValue?: T): T | null {
    try {
      const item = sessionStorage.getItem(key);
      if (item === null) {
        return defaultValue || null;
      }
      return JSON.parse(item);
    } catch (error) {
      console.error(`Error reading from sessionStorage (${key}):`, error);
      return defaultValue || null;
    }
  }

  /**
   * Set item in sessionStorage with JSON stringification
   */
  static set<T>(key: string, value: T): boolean {
    try {
      sessionStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Error writing to sessionStorage (${key}):`, error);
      return false;
    }
  }

  /**
   * Remove item from sessionStorage
   */
  static remove(key: string): boolean {
    try {
      sessionStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Error removing from sessionStorage (${key}):`, error);
      return false;
    }
  }

  /**
   * Clear all sessionStorage
   */
  static clear(): boolean {
    try {
      sessionStorage.clear();
      return true;
    } catch (error) {
      console.error('Error clearing sessionStorage:', error);
      return false;
    }
  }
}

// Migration functions for storage structure changes
export class StorageMigration {
  private static currentVersion = 1;
  private static versionKey = 'storage-version';

  static migrate(): void {
    const currentVersion = Storage.get<number>(this.versionKey, 0);

    if (currentVersion < this.currentVersion) {
      this.runMigrations(currentVersion);
      Storage.set(this.versionKey, this.currentVersion);
    }
  }

  private static runMigrations(fromVersion: number): void {
    console.log(
      `Running storage migrations from version ${fromVersion} to ${this.currentVersion}`
    );

    // Example migration from version 0 to 1
    if (fromVersion < 1) {
      this.migrateToV1();
    }

    // Add more migrations here as needed
  }

  private static migrateToV1(): void {
    // Example: Migrate old auth storage structure
    const oldAuthKey = 'auth-data';
    const oldAuth = Storage.get(oldAuthKey);

    if (oldAuth) {
      AuthStorage.setAuthData(oldAuth);
      Storage.remove(oldAuthKey);
    }
  }
}

// Storage event listeners for cross-tab synchronization
export class StorageEventManager {
  private static listeners: Map<string, ((event: CustomEvent) => void)[]> =
    new Map();

  static addEventListener(
    key: string,
    callback: (event: CustomEvent) => void
  ): void {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, []);
    }

    this.listeners.get(key)!.push(callback);

    // Add global event listener if this is the first listener
    if (this.getTotalListeners() === 1) {
      this.addGlobalListener();
    }
  }

  static removeEventListener(
    key: string,
    callback: (event: CustomEvent) => void
  ): void {
    const keyListeners = this.listeners.get(key);
    if (keyListeners) {
      const index = keyListeners.indexOf(callback);
      if (index > -1) {
        keyListeners.splice(index, 1);
      }

      if (keyListeners.length === 0) {
        this.listeners.delete(key);
      }
    }

    // Remove global listener if no more listeners
    if (this.getTotalListeners() === 0) {
      this.removeGlobalListener();
    }
  }

  private static addGlobalListener(): void {
    window.addEventListener('storage-change', this.handleStorageEvent);
    window.addEventListener('storage', this.handleBrowserStorageEvent);
  }

  private static removeGlobalListener(): void {
    window.removeEventListener('storage-change', this.handleStorageEvent);
    window.removeEventListener('storage', this.handleBrowserStorageEvent);
  }

  private static handleStorageEvent = (event: CustomEvent): void => {
    const keyListeners = this.listeners.get(event.detail.key);
    if (keyListeners) {
      keyListeners.forEach(callback => callback(event));
    }
  };

  private static handleBrowserStorageEvent = (event: StorageEvent): void => {
    if (event.key) {
      const keyListeners = this.listeners.get(event.key);
      if (keyListeners) {
        const customEvent = new CustomEvent('storage-change', {
          detail: {
            key: event.key,
            newValue: event.newValue ? JSON.parse(event.newValue) : null,
            oldValue: event.oldValue ? JSON.parse(event.oldValue) : null,
          },
        });
        keyListeners.forEach(callback => callback(customEvent));
      }
    }
  };

  private static getTotalListeners(): number {
    let total = 0;
    for (const listeners of this.listeners.values()) {
      total += listeners.length;
    }
    return total;
  }
}

// Initialize storage migration on module load
if (typeof window !== 'undefined' && Storage.isAvailable()) {
  StorageMigration.migrate();
}

export default {
  Storage,
  AuthStorage,
  UIStorage,
  PreferencesStorage,
  SearchStorage,
  SessionStorage,
  StorageMigration,
  StorageEventManager,
};
