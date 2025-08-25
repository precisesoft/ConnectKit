import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for managing localStorage with React state synchronization
 * Provides type-safe localStorage operations with automatic serialization
 *
 * @param key - The localStorage key
 * @param initialValue - Initial value if key doesn't exist
 * @returns [value, setValue, removeValue]
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prevValue: T) => T)) => void, () => void] {
  // Get initial value from localStorage or use provided initial value
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Set value in localStorage and update state
  const setValue = useCallback(
    (value: T | ((prevValue: T) => T)) => {
      try {
        // Allow value to be a function so we have the same API as useState
        const valueToStore =
          value instanceof Function ? value(storedValue) : value;

        // Save to localStorage
        window.localStorage.setItem(key, JSON.stringify(valueToStore));

        // Update state
        setStoredValue(valueToStore);

        // Dispatch custom event for cross-tab synchronization
        window.dispatchEvent(
          new CustomEvent('local-storage', {
            detail: {
              key,
              newValue: valueToStore,
            },
          })
        );
      } catch (error) {
        console.error(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, storedValue]
  );

  // Remove value from localStorage
  const removeValue = useCallback(() => {
    try {
      window.localStorage.removeItem(key);
      setStoredValue(initialValue);

      // Dispatch custom event for cross-tab synchronization
      window.dispatchEvent(
        new CustomEvent('local-storage', {
          detail: {
            key,
            newValue: null,
          },
        })
      );
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, initialValue]);

  // Listen for changes in localStorage from other tabs/windows
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          const newValue = JSON.parse(e.newValue);
          setStoredValue(newValue);
        } catch (error) {
          console.error(
            `Error parsing localStorage value for key "${key}":`,
            error
          );
        }
      } else if (e.key === key && e.newValue === null) {
        setStoredValue(initialValue);
      }
    };

    const handleCustomStorageChange = (e: CustomEvent) => {
      if (e.detail.key === key) {
        if (e.detail.newValue !== null) {
          setStoredValue(e.detail.newValue);
        } else {
          setStoredValue(initialValue);
        }
      }
    };

    // Listen for storage events (from other tabs)
    window.addEventListener('storage', handleStorageChange);

    // Listen for custom events (from same tab)
    window.addEventListener(
      'local-storage',
      handleCustomStorageChange as EventListener
    );

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener(
        'local-storage',
        handleCustomStorageChange as EventListener
      );
    };
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue];
}

/**
 * Hook for managing boolean values in localStorage
 * Simplified interface for toggle operations
 */
export function useLocalStorageBoolean(
  key: string,
  initialValue = false
): [boolean, () => void, (value: boolean) => void] {
  const [value, setValue] = useLocalStorage(key, initialValue);

  const toggle = useCallback(() => {
    setValue((prev: boolean) => !prev);
  }, [setValue]);

  const setBoolean = useCallback(
    (newValue: boolean) => {
      setValue(newValue);
    },
    [setValue]
  );

  return [value, toggle, setBoolean];
}

/**
 * Hook for managing arrays in localStorage with utility methods
 */
export function useLocalStorageArray<T>(
  key: string,
  initialValue: T[] = []
): {
  items: T[];
  addItem: (item: T) => void;
  removeItem: (item: T) => void;
  updateItem: (index: number, item: T) => void;
  clearItems: () => void;
  setItems: (items: T[]) => void;
} {
  const [items, setItems] = useLocalStorage<T[]>(key, initialValue);

  const addItem = useCallback(
    (item: T) => {
      setItems(prev => [...prev, item]);
    },
    [setItems]
  );

  const removeItem = useCallback(
    (item: T) => {
      setItems(prev => prev.filter(i => i !== item));
    },
    [setItems]
  );

  const updateItem = useCallback(
    (index: number, item: T) => {
      setItems(prev => {
        const newItems = [...prev];
        newItems[index] = item;
        return newItems;
      });
    },
    [setItems]
  );

  const clearItems = useCallback(() => {
    setItems([]);
  }, [setItems]);

  return {
    items,
    addItem,
    removeItem,
    updateItem,
    clearItems,
    setItems,
  };
}

/**
 * Hook for managing objects in localStorage with merge functionality
 */
export function useLocalStorageObject<T extends Record<string, any>>(
  key: string,
  initialValue: T
): {
  data: T;
  updateData: (updates: Partial<T>) => void;
  resetData: () => void;
  setData: (data: T) => void;
} {
  const [data, setData] = useLocalStorage<T>(key, initialValue);

  const updateData = useCallback(
    (updates: Partial<T>) => {
      setData(prev => ({ ...prev, ...updates }));
    },
    [setData]
  );

  const resetData = useCallback(() => {
    setData(initialValue);
  }, [setData, initialValue]);

  return {
    data,
    updateData,
    resetData,
    setData,
  };
}

/**
 * Hook for managing recently accessed items list
 * Automatically maintains order and limits size
 */
export function useRecentItems<T>(
  key: string,
  maxItems = 10,
  getId: (item: T) => string = (item: any) => item.id
): {
  recentItems: T[];
  addRecentItem: (item: T) => void;
  clearRecentItems: () => void;
} {
  const [recentItems, setRecentItems] = useLocalStorage<T[]>(key, []);

  const addRecentItem = useCallback(
    (item: T) => {
      setRecentItems(prev => {
        const itemId = getId(item);

        // Remove existing item if present
        const filteredItems = prev.filter(i => getId(i) !== itemId);

        // Add to beginning and limit size
        return [item, ...filteredItems].slice(0, maxItems);
      });
    },
    [setRecentItems, maxItems, getId]
  );

  const clearRecentItems = useCallback(() => {
    setRecentItems([]);
  }, [setRecentItems]);

  return {
    recentItems,
    addRecentItem,
    clearRecentItems,
  };
}

export default useLocalStorage;
