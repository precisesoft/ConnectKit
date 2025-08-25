import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ContactService } from '@services/contact.service';
import { ContactStats } from '../types/contact.types';
import {
  Contact,
  CreateContactRequest,
  UpdateContactRequest,
  ContactFilters,
  PaginatedResponse,
  SearchRequest,
  SearchResult,
  ExportContactsRequest,
  ImportContactsRequest,
  ImportResult,
} from '@services/types';
import { showErrorNotification, showSuccessNotification } from '@store/uiStore';

// Query keys for React Query
const CONTACTS_QUERY_KEY = 'contacts';
const CONTACT_STATS_QUERY_KEY = 'contact-stats';
const CONTACT_TAGS_QUERY_KEY = 'contact-tags';
const CONTACT_COMPANIES_QUERY_KEY = 'contact-companies';

/**
 * Custom hook for contact management operations
 * Provides methods for CRUD operations, search, and other contact-related functionality
 */
export const useContacts = (initialFilters?: ContactFilters) => {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<ContactFilters>(initialFilters || {});
  
  // Query for fetching contacts with pagination and filters
  const {
    data: contactsData,
    isLoading: isLoadingContacts,
    error: contactsError,
    refetch: refetchContacts,
    isFetching: isFetchingContacts,
  } = useQuery({
    queryKey: [CONTACTS_QUERY_KEY, filters],
    queryFn: () => ContactService.getContacts(filters),
    placeholderData: (previousData) => previousData,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Query for contact statistics
  const {
    data: stats,
    isLoading: isLoadingStats,
    error: statsError,
  } = useQuery({
    queryKey: [CONTACT_STATS_QUERY_KEY],
    queryFn: ContactService.getContactStats,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Query for available tags
  const {
    data: tags,
    isLoading: isLoadingTags,
  } = useQuery({
    queryKey: [CONTACT_TAGS_QUERY_KEY],
    queryFn: ContactService.getTags,
    staleTime: 15 * 60 * 1000, // 15 minutes
  });

  // Query for available companies
  const {
    data: companies,
    isLoading: isLoadingCompanies,
  } = useQuery({
    queryKey: [CONTACT_COMPANIES_QUERY_KEY],
    queryFn: ContactService.getCompanies,
    staleTime: 15 * 60 * 1000, // 15 minutes
  });

  // Mutation for creating a contact
  const createContactMutation = useMutation({
    mutationFn: ContactService.createContact,
    onSuccess: (newContact) => {
      // Invalidate and refetch contacts
      queryClient.invalidateQueries({ queryKey: [CONTACTS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [CONTACT_STATS_QUERY_KEY] });
      
      showSuccessNotification(
        `Contact "${newContact.firstName} ${newContact.lastName}" created successfully!`
      );
    },
    onError: (error: any) => {
      showErrorNotification(
        error.message || 'Failed to create contact',
        'Create Failed'
      );
    },
  });

  // Mutation for updating a contact
  const updateContactMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: UpdateContactRequest }) =>
      ContactService.updateContact(id, updates),
    onSuccess: (updatedContact) => {
      // Update contact in cache
      queryClient.setQueryData(
        [CONTACTS_QUERY_KEY, filters],
        (oldData: PaginatedResponse<Contact> | undefined) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            data: oldData.data.map((contact) =>
              contact.id === updatedContact.id ? updatedContact : contact
            ),
          };
        }
      );
      
      // Invalidate stats
      queryClient.invalidateQueries({ queryKey: [CONTACT_STATS_QUERY_KEY] });
      
      showSuccessNotification(
        `Contact "${updatedContact.firstName} ${updatedContact.lastName}" updated successfully!`
      );
    },
    onError: (error: any) => {
      showErrorNotification(
        error.message || 'Failed to update contact',
        'Update Failed'
      );
    },
  });

  // Mutation for deleting a contact
  const deleteContactMutation = useMutation({
    mutationFn: ContactService.deleteContact,
    onSuccess: (_, deletedId) => {
      // Remove contact from cache
      queryClient.setQueryData(
        [CONTACTS_QUERY_KEY, filters],
        (oldData: PaginatedResponse<Contact> | undefined) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            data: oldData.data.filter((contact) => contact.id !== deletedId),
            pagination: {
              ...oldData.pagination,
              total: oldData.pagination.total - 1,
            },
          };
        }
      );
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: [CONTACTS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [CONTACT_STATS_QUERY_KEY] });
      
      showSuccessNotification('Contact deleted successfully!');
    },
    onError: (error: any) => {
      showErrorNotification(
        error.message || 'Failed to delete contact',
        'Delete Failed'
      );
    },
  });

  // Mutation for bulk deleting contacts
  const bulkDeleteContactsMutation = useMutation({
    mutationFn: ContactService.deleteContacts,
    onSuccess: (result) => {
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: [CONTACTS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [CONTACT_STATS_QUERY_KEY] });
      
      showSuccessNotification(
        `${result.deleted} contact${result.deleted !== 1 ? 's' : ''} deleted successfully!`
      );
      
      if (result.failed > 0) {
        showErrorNotification(
          `Failed to delete ${result.failed} contact${result.failed !== 1 ? 's' : ''}`,
          'Partial Success'
        );
      }
    },
    onError: (error: any) => {
      showErrorNotification(
        error.message || 'Failed to delete contacts',
        'Bulk Delete Failed'
      );
    },
  });

  // Mutation for toggling favorite status
  const toggleFavoriteMutation = useMutation({
    mutationFn: ContactService.toggleFavorite,
    onSuccess: (updatedContact) => {
      // Update contact in cache
      queryClient.setQueryData(
        [CONTACTS_QUERY_KEY, filters],
        (oldData: PaginatedResponse<Contact> | undefined) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            data: oldData.data.map((contact) =>
              contact.id === updatedContact.id ? updatedContact : contact
            ),
          };
        }
      );
      
      // Invalidate stats
      queryClient.invalidateQueries({ queryKey: [CONTACT_STATS_QUERY_KEY] });
      
      const action = updatedContact.isFavorite ? 'added to' : 'removed from';
      showSuccessNotification(
        `Contact ${action} favorites!`
      );
    },
    onError: (error: any) => {
      showErrorNotification(
        error.message || 'Failed to update favorite status',
        'Favorite Failed'
      );
    },
  });

  // Helper functions
  const updateFilters = useCallback((newFilters: Partial<ContactFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  const searchContacts = useCallback(async (searchRequest: SearchRequest): Promise<SearchResult> => {
    try {
      return await ContactService.searchContacts(searchRequest);
    } catch (error: any) {
      showErrorNotification(
        error.message || 'Search failed',
        'Search Error'
      );
      throw error;
    }
  }, []);

  const exportContacts = useCallback(async (exportRequest: ExportContactsRequest): Promise<void> => {
    try {
      await ContactService.exportContacts(exportRequest);
      showSuccessNotification('Contacts exported successfully!');
    } catch (error: any) {
      showErrorNotification(
        error.message || 'Export failed',
        'Export Error'
      );
      throw error;
    }
  }, []);

  const importContacts = useCallback(async (
    importRequest: ImportContactsRequest,
    onProgress?: (progress: number) => void
  ): Promise<ImportResult> => {
    try {
      const result = await ContactService.importContacts(importRequest, onProgress);
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: [CONTACTS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [CONTACT_STATS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [CONTACT_TAGS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [CONTACT_COMPANIES_QUERY_KEY] });
      
      showSuccessNotification(
        `Import completed! ${result.success} contacts imported successfully.`
      );
      
      if (result.failed > 0) {
        showErrorNotification(
          `${result.failed} contacts failed to import. Check the import log for details.`,
          'Import Warnings'
        );
      }
      
      return result;
    } catch (error: any) {
      showErrorNotification(
        error.message || 'Import failed',
        'Import Error'
      );
      throw error;
    }
  }, [queryClient]);

  const getContactById = useCallback(async (id: string): Promise<Contact | null> => {
    try {
      return await ContactService.getContact(id);
    } catch (error: any) {
      if (error.status === 404) {
        showErrorNotification('Contact not found', 'Not Found');
      } else {
        showErrorNotification(
          error.message || 'Failed to fetch contact',
          'Fetch Error'
        );
      }
      return null;
    }
  }, []);

  // Computed values
  const contacts = useMemo(() => contactsData?.data || [], [contactsData]);
  const pagination = useMemo(() => contactsData?.pagination, [contactsData]);
  const totalContacts = useMemo(() => pagination?.total || 0, [pagination]);
  
  const isLoading = isLoadingContacts || isLoadingStats;
  const hasError = !!(contactsError || statsError);
  
  const selectedContacts = useMemo(() => {
    // This would be managed by a separate state for multi-select functionality
    // For now, return empty array
    return [];
  }, []);

  return {
    // Data
    contacts,
    pagination,
    totalContacts,
    stats,
    tags: tags || [],
    companies: companies || [],
    
    // Loading states
    isLoading,
    isLoadingContacts,
    isLoadingStats,
    isLoadingTags,
    isLoadingCompanies,
    isFetching: isFetchingContacts,
    hasError,
    
    // Filters
    filters,
    updateFilters,
    clearFilters,
    
    // Actions
    createContact: createContactMutation.mutate,
    updateContact: (id: string, updates: UpdateContactRequest) =>
      updateContactMutation.mutate({ id, updates }),
    deleteContact: deleteContactMutation.mutate,
    bulkDeleteContacts: bulkDeleteContactsMutation.mutate,
    toggleFavorite: toggleFavoriteMutation.mutate,
    
    // Async operations
    searchContacts,
    exportContacts,
    importContacts,
    getContactById,
    
    // Utilities
    refetchContacts,
    selectedContacts, // Placeholder for selection state
    
    // Mutation states
    isCreating: createContactMutation.isPending,
    isUpdating: updateContactMutation.isPending,
    isDeleting: deleteContactMutation.isPending,
    isBulkDeleting: bulkDeleteContactsMutation.isPending,
    isTogglingFavorite: toggleFavoriteMutation.isPending,
  };
};