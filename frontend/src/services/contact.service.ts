import { ApiClient } from './api.client';
import {
  Contact,
  CreateContactRequest,
  UpdateContactRequest,
  ContactFilters,
  PaginatedResponse,
  ContactStats,
  SearchRequest,
  SearchResult,
  ExportContactsRequest,
  ImportContactsRequest,
  ImportResult,
  FileUploadResponse,
} from './types';

/**
 * Contact service for handling all contact-related API calls
 */
export class ContactService {
  /**
   * Get paginated list of contacts with optional filters
   */
  static async getContacts(filters?: ContactFilters): Promise<PaginatedResponse<Contact>> {
    try {
      const params = new URLSearchParams();
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            if (Array.isArray(value)) {
              value.forEach(item => params.append(key, item));
            } else {
              params.append(key, value.toString());
            }
          }
        });
      }

      const response = await ApiClient.get<PaginatedResponse<Contact>>(
        `/contacts?${params.toString()}`
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch contacts');
      }

      return response.data;
    } catch (error) {
      console.error('Get contacts error:', error);
      throw error;
    }
  }

  /**
   * Get a single contact by ID
   */
  static async getContact(id: string): Promise<Contact> {
    try {
      const response = await ApiClient.get<Contact>(`/contacts/${id}`);
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch contact');
      }

      return response.data;
    } catch (error) {
      console.error('Get contact error:', error);
      throw error;
    }
  }

  /**
   * Create a new contact
   */
  static async createContact(contactData: CreateContactRequest): Promise<Contact> {
    try {
      const response = await ApiClient.post<Contact>('/contacts', contactData);
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to create contact');
      }

      return response.data;
    } catch (error) {
      console.error('Create contact error:', error);
      throw error;
    }
  }

  /**
   * Update an existing contact
   */
  static async updateContact(id: string, updates: UpdateContactRequest): Promise<Contact> {
    try {
      const response = await ApiClient.put<Contact>(`/contacts/${id}`, updates);
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to update contact');
      }

      return response.data;
    } catch (error) {
      console.error('Update contact error:', error);
      throw error;
    }
  }

  /**
   * Partially update a contact (PATCH)
   */
  static async patchContact(id: string, updates: Partial<UpdateContactRequest>): Promise<Contact> {
    try {
      const response = await ApiClient.patch<Contact>(`/contacts/${id}`, updates);
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to patch contact');
      }

      return response.data;
    } catch (error) {
      console.error('Patch contact error:', error);
      throw error;
    }
  }

  /**
   * Delete a contact
   */
  static async deleteContact(id: string): Promise<void> {
    try {
      const response = await ApiClient.delete<void>(`/contacts/${id}`);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to delete contact');
      }
    } catch (error) {
      console.error('Delete contact error:', error);
      throw error;
    }
  }

  /**
   * Delete multiple contacts
   */
  static async deleteContacts(ids: string[]): Promise<{ deleted: number; failed: number }> {
    try {
      const response = await ApiClient.delete<{ deleted: number; failed: number }>(
        '/contacts/batch',
        { data: { ids } }
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to delete contacts');
      }

      return response.data;
    } catch (error) {
      console.error('Delete contacts error:', error);
      throw error;
    }
  }

  /**
   * Toggle favorite status of a contact
   */
  static async toggleFavorite(id: string): Promise<Contact> {
    try {
      const response = await ApiClient.patch<Contact>(`/contacts/${id}/favorite`);
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to toggle favorite status');
      }

      return response.data;
    } catch (error) {
      console.error('Toggle favorite error:', error);
      throw error;
    }
  }

  /**
   * Get all favorite contacts
   */
  static async getFavoriteContacts(): Promise<Contact[]> {
    try {
      const response = await ApiClient.get<Contact[]>('/contacts/favorites');
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch favorite contacts');
      }

      return response.data;
    } catch (error) {
      console.error('Get favorite contacts error:', error);
      throw error;
    }
  }

  /**
   * Search contacts
   */
  static async searchContacts(searchRequest: SearchRequest): Promise<SearchResult> {
    try {
      const response = await ApiClient.post<SearchResult>('/contacts/search', searchRequest);
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to search contacts');
      }

      return response.data;
    } catch (error) {
      console.error('Search contacts error:', error);
      throw error;
    }
  }

  /**
   * Get contact statistics
   */
  static async getContactStats(): Promise<ContactStats> {
    try {
      const response = await ApiClient.get<ContactStats>('/contacts/stats');
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch contact statistics');
      }

      return response.data;
    } catch (error) {
      console.error('Get contact stats error:', error);
      throw error;
    }
  }

  /**
   * Get all unique tags
   */
  static async getTags(): Promise<string[]> {
    try {
      const response = await ApiClient.get<string[]>('/contacts/tags');
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch tags');
      }

      return response.data;
    } catch (error) {
      console.error('Get tags error:', error);
      throw error;
    }
  }

  /**
   * Get all unique companies
   */
  static async getCompanies(): Promise<string[]> {
    try {
      const response = await ApiClient.get<string[]>('/contacts/companies');
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch companies');
      }

      return response.data;
    } catch (error) {
      console.error('Get companies error:', error);
      throw error;
    }
  }

  /**
   * Upload contact avatar
   */
  static async uploadAvatar(
    contactId: string,
    file: File,
    onUploadProgress?: (progress: number) => void
  ): Promise<string> {
    try {
      const response = await ApiClient.upload<FileUploadResponse>(
        `/contacts/${contactId}/avatar`,
        file,
        onUploadProgress
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to upload avatar');
      }

      return response.data.url;
    } catch (error) {
      console.error('Upload avatar error:', error);
      throw error;
    }
  }

  /**
   * Remove contact avatar
   */
  static async removeAvatar(contactId: string): Promise<void> {
    try {
      const response = await ApiClient.delete<void>(`/contacts/${contactId}/avatar`);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to remove avatar');
      }
    } catch (error) {
      console.error('Remove avatar error:', error);
      throw error;
    }
  }

  /**
   * Export contacts
   */
  static async exportContacts(request: ExportContactsRequest): Promise<void> {
    try {
      const params = new URLSearchParams();
      params.append('format', request.format);
      
      if (request.filters) {
        Object.entries(request.filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            if (Array.isArray(value)) {
              value.forEach(item => params.append(`filters[${key}]`, item));
            } else {
              params.append(`filters[${key}]`, value.toString());
            }
          }
        });
      }

      const filename = `contacts-export-${new Date().toISOString().split('T')[0]}.${request.format}`;
      await ApiClient.download(`/contacts/export?${params.toString()}`, filename);
    } catch (error) {
      console.error('Export contacts error:', error);
      throw error;
    }
  }

  /**
   * Import contacts from file
   */
  static async importContacts(
    request: ImportContactsRequest,
    onUploadProgress?: (progress: number) => void
  ): Promise<ImportResult> {
    try {
      const additionalData: Record<string, any> = {
        format: request.format,
      };

      if (request.options) {
        Object.entries(request.options).forEach(([key, value]) => {
          additionalData[`options[${key}]`] = value.toString();
        });
      }

      const response = await ApiClient.upload<ImportResult>(
        '/contacts/import',
        request.file,
        onUploadProgress,
        additionalData
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to import contacts');
      }

      return response.data;
    } catch (error) {
      console.error('Import contacts error:', error);
      throw error;
    }
  }

  /**
   * Get recently added contacts
   */
  static async getRecentContacts(limit = 10): Promise<Contact[]> {
    try {
      const response = await ApiClient.get<Contact[]>(`/contacts/recent?limit=${limit}`);
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch recent contacts');
      }

      return response.data;
    } catch (error) {
      console.error('Get recent contacts error:', error);
      throw error;
    }
  }

  /**
   * Duplicate a contact
   */
  static async duplicateContact(id: string): Promise<Contact> {
    try {
      const response = await ApiClient.post<Contact>(`/contacts/${id}/duplicate`);
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to duplicate contact');
      }

      return response.data;
    } catch (error) {
      console.error('Duplicate contact error:', error);
      throw error;
    }
  }

  /**
   * Merge two contacts
   */
  static async mergeContacts(
    primaryId: string,
    secondaryId: string,
    mergeOptions?: {
      keepPrimaryData?: boolean;
      combineNotes?: boolean;
      combineTags?: boolean;
    }
  ): Promise<Contact> {
    try {
      const response = await ApiClient.post<Contact>(`/contacts/${primaryId}/merge`, {
        secondaryId,
        options: mergeOptions,
      });
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to merge contacts');
      }

      return response.data;
    } catch (error) {
      console.error('Merge contacts error:', error);
      throw error;
    }
  }
}