import { create } from 'zustand';
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware';

// Define notification types
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  title?: string;
  autoClose?: boolean;
  duration?: number;
  timestamp: number;
}

// Define the UI state interface
interface UIState {
  // Navigation state
  sidebarOpen: boolean;
  sidebarWidth: number;
  isMobile: boolean;
  
  // Loading states
  isPageLoading: boolean;
  loadingMessage: string;
  
  // Notifications
  notifications: Notification[];
  
  // Search and filters
  searchQuery: string;
  activeFilters: Record<string, any>;
  
  // Theme and layout
  themeMode: 'light' | 'dark' | 'system';
  densityMode: 'compact' | 'standard' | 'comfortable';
  
  // Modal and dialog states
  activeModal: string | null;
  modalData: any;
  confirmDialog: {
    open: boolean;
    title: string;
    message: string;
    onConfirm?: () => void;
    onCancel?: () => void;
    confirmText?: string;
    cancelText?: string;
  } | null;
  
  // Actions
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setSidebarWidth: (width: number) => void;
  setMobile: (mobile: boolean) => void;
  setPageLoading: (loading: boolean, message?: string) => void;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  setSearchQuery: (query: string) => void;
  setActiveFilters: (filters: Record<string, any>) => void;
  clearFilters: () => void;
  setThemeMode: (mode: 'light' | 'dark' | 'system') => void;
  setDensityMode: (mode: 'compact' | 'standard' | 'comfortable') => void;
  openModal: (modalId: string, data?: any) => void;
  closeModal: () => void;
  showConfirmDialog: (options: {
    title: string;
    message: string;
    onConfirm?: () => void;
    onCancel?: () => void;
    confirmText?: string;
    cancelText?: string;
  }) => void;
  hideConfirmDialog: () => void;
}

// Create the UI store
export const useUIStore = create<UIState>()(
  devtools(
    persist(
      subscribeWithSelector((set, get) => ({
        // Initial state
        sidebarOpen: true,
        sidebarWidth: 280,
        isMobile: false,
        isPageLoading: false,
        loadingMessage: '',
        notifications: [],
        searchQuery: '',
        activeFilters: {},
        themeMode: 'light',
        densityMode: 'standard',
        activeModal: null,
        modalData: null,
        confirmDialog: null,

        // Actions
        toggleSidebar: () => {
          set((state) => ({ 
            sidebarOpen: !state.sidebarOpen 
          }), false, 'toggleSidebar');
        },

        setSidebarOpen: (open: boolean) => {
          set({ sidebarOpen: open }, false, 'setSidebarOpen');
        },

        setSidebarWidth: (width: number) => {
          // Ensure width is within reasonable bounds
          const clampedWidth = Math.max(200, Math.min(400, width));
          set({ sidebarWidth: clampedWidth }, false, 'setSidebarWidth');
        },

        setMobile: (mobile: boolean) => {
          set((state) => ({
            isMobile: mobile,
            // Auto-close sidebar on mobile
            sidebarOpen: mobile ? false : state.sidebarOpen,
          }), false, 'setMobile');
        },

        setPageLoading: (loading: boolean, message = '') => {
          set({ 
            isPageLoading: loading, 
            loadingMessage: message 
          }, false, 'setPageLoading');
        },

        addNotification: (notification) => {
          const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          const newNotification: Notification = {
            ...notification,
            id,
            timestamp: Date.now(),
            autoClose: notification.autoClose ?? true,
            duration: notification.duration ?? 5000,
          };

          set((state) => ({
            notifications: [...state.notifications, newNotification]
          }), false, 'addNotification');

          // Auto-remove notification after duration
          if (newNotification.autoClose) {
            setTimeout(() => {
              get().removeNotification(id);
            }, newNotification.duration);
          }
        },

        removeNotification: (id: string) => {
          set((state) => ({
            notifications: state.notifications.filter(n => n.id !== id)
          }), false, 'removeNotification');
        },

        clearNotifications: () => {
          set({ notifications: [] }, false, 'clearNotifications');
        },

        setSearchQuery: (query: string) => {
          set({ searchQuery: query }, false, 'setSearchQuery');
        },

        setActiveFilters: (filters: Record<string, any>) => {
          set({ activeFilters: filters }, false, 'setActiveFilters');
        },

        clearFilters: () => {
          set({ 
            activeFilters: {},
            searchQuery: ''
          }, false, 'clearFilters');
        },

        setThemeMode: (mode: 'light' | 'dark' | 'system') => {
          set({ themeMode: mode }, false, 'setThemeMode');
        },

        setDensityMode: (mode: 'compact' | 'standard' | 'comfortable') => {
          set({ densityMode: mode }, false, 'setDensityMode');
        },

        openModal: (modalId: string, data?: any) => {
          set({ 
            activeModal: modalId,
            modalData: data
          }, false, 'openModal');
        },

        closeModal: () => {
          set({ 
            activeModal: null,
            modalData: null
          }, false, 'closeModal');
        },

        showConfirmDialog: (options) => {
          set({
            confirmDialog: {
              open: true,
              ...options,
              confirmText: options.confirmText || 'Confirm',
              cancelText: options.cancelText || 'Cancel',
            }
          }, false, 'showConfirmDialog');
        },

        hideConfirmDialog: () => {
          set({ confirmDialog: null }, false, 'hideConfirmDialog');
        },
      })),
      {
        name: 'connectkit-ui', // localStorage key
        partialize: (state) => ({
          sidebarOpen: state.sidebarOpen,
          sidebarWidth: state.sidebarWidth,
          themeMode: state.themeMode,
          densityMode: state.densityMode,
        }),
        version: 1,
      }
    ),
    {
      name: 'ui-store',
    }
  )
);

// Selectors for performance optimization
export const useSidebar = () => useUIStore((state) => ({
  open: state.sidebarOpen,
  width: state.sidebarWidth,
  toggle: state.toggleSidebar,
  setOpen: state.setSidebarOpen,
  setWidth: state.setSidebarWidth,
}));

export const useNotifications = () => useUIStore((state) => ({
  notifications: state.notifications,
  add: state.addNotification,
  remove: state.removeNotification,
  clear: state.clearNotifications,
}));

export const useSearch = () => useUIStore((state) => ({
  query: state.searchQuery,
  filters: state.activeFilters,
  setQuery: state.setSearchQuery,
  setFilters: state.setActiveFilters,
  clearFilters: state.clearFilters,
}));

export const useModal = () => useUIStore((state) => ({
  activeModal: state.activeModal,
  modalData: state.modalData,
  open: state.openModal,
  close: state.closeModal,
}));

export const useConfirmDialog = () => useUIStore((state) => ({
  confirmDialog: state.confirmDialog,
  show: state.showConfirmDialog,
  hide: state.hideConfirmDialog,
}));

export const useTheme = () => useUIStore((state) => ({
  mode: state.themeMode,
  density: state.densityMode,
  setMode: state.setThemeMode,
  setDensity: state.setDensityMode,
}));

// Utility functions for notifications
export const showSuccessNotification = (message: string, title?: string) => {
  useUIStore.getState().addNotification({
    type: 'success',
    message,
    title,
  });
};

export const showErrorNotification = (message: string, title?: string) => {
  useUIStore.getState().addNotification({
    type: 'error',
    message,
    title,
    autoClose: false, // Errors should be manually dismissed
  });
};

export const showWarningNotification = (message: string, title?: string) => {
  useUIStore.getState().addNotification({
    type: 'warning',
    message,
    title,
  });
};

export const showInfoNotification = (message: string, title?: string) => {
  useUIStore.getState().addNotification({
    type: 'info',
    message,
    title,
  });
};