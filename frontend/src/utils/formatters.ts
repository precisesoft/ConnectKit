/**
 * Data formatting utility functions
 */

import { format, formatDistanceToNow, parseISO, isValid } from 'date-fns';
import { DATE_FORMATS } from './constants';

// Date formatting functions
export const formatDate = (date: string | Date, formatStr: string = DATE_FORMATS.DISPLAY): string => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(dateObj)) {
      return 'Invalid date';
    }
    return format(dateObj, formatStr);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
};

export const formatDateTime = (date: string | Date): string => {
  return formatDate(date, DATE_FORMATS.DATETIME);
};

export const formatTime = (date: string | Date): string => {
  return formatDate(date, DATE_FORMATS.TIME);
};

export const formatRelativeTime = (date: string | Date): string => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(dateObj)) {
      return 'Invalid date';
    }
    return formatDistanceToNow(dateObj, { addSuffix: true });
  } catch (error) {
    console.error('Error formatting relative time:', error);
    return 'Invalid date';
  }
};

// Number formatting functions
export const formatNumber = (num: number, options?: Intl.NumberFormatOptions): string => {
  return new Intl.NumberFormat('en-US', options).format(num);
};

export const formatCurrency = (amount: number, currency = 'USD'): string => {
  return formatNumber(amount, {
    style: 'currency',
    currency,
  });
};

export const formatPercentage = (value: number, decimals = 1): string => {
  return formatNumber(value, {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

export const formatCompactNumber = (num: number): string => {
  return formatNumber(num, {
    notation: 'compact',
    compactDisplay: 'short',
  });
};

// File size formatting
export const formatFileSize = (bytes: number, decimals = 2): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

// Phone number formatting
export const formatPhoneNumber = (phone: string, countryCode = 'US'): string => {
  // Remove all non-digit characters except + at the beginning
  const cleaned = phone.replace(/[^\d+]/g, '');
  
  if (countryCode === 'US') {
    // US phone number formatting
    if (cleaned.length === 10) {
      return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
    }
    
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return cleaned.replace(/(\d{1})(\d{3})(\d{3})(\d{4})/, '+$1 ($2) $3-$4');
    }
  }
  
  // International format
  if (cleaned.startsWith('+')) {
    return cleaned.replace(/(\+\d{1,3})(\d{3})(\d{3})(\d{4})/, '$1 $2-$3-$4');
  }
  
  // Return cleaned number if no specific formatting applies
  return cleaned;
};

// Name formatting
export const formatFullName = (firstName: string, lastName: string, format: 'first-last' | 'last-first' | 'initials' = 'first-last'): string => {
  const first = firstName?.trim() || '';
  const last = lastName?.trim() || '';
  
  if (!first && !last) return '';
  
  switch (format) {
    case 'last-first':
      return `${last}, ${first}`.replace(/^,\s*|,\s*$/, '');
    case 'initials':
      return `${first[0] || ''}${last[0] || ''}`.toUpperCase();
    default:
      return `${first} ${last}`.trim();
  }
};

export const formatInitials = (firstName: string, lastName: string): string => {
  return formatFullName(firstName, lastName, 'initials');
};

// Text formatting
export const capitalizeFirst = (text: string): string => {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

export const capitalizeWords = (text: string): string => {
  if (!text) return '';
  return text.replace(/\b\w/g, l => l.toUpperCase());
};

export const truncateText = (text: string, maxLength: number, suffix = '...'): string => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength - suffix.length) + suffix;
};

export const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
};

// URL formatting
export const formatUrl = (url: string): string => {
  if (!url) return '';
  
  // Add protocol if missing
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return `https://${url}`;
  }
  
  return url;
};

export const getDomainFromUrl = (url: string): string => {
  try {
    const formatted = formatUrl(url);
    const urlObj = new URL(formatted);
    return urlObj.hostname;
  } catch (error) {
    return url;
  }
};

// Address formatting
export const formatAddress = (address: {
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}, format: 'single-line' | 'multi-line' = 'single-line'): string => {
  const parts: string[] = [];
  
  if (address.street) parts.push(address.street);
  
  const cityStateZip = [address.city, address.state, address.zipCode]
    .filter(Boolean)
    .join(', ')
    .replace(', ,', ','); // Clean up double commas
  
  if (cityStateZip) parts.push(cityStateZip);
  if (address.country && address.country !== 'USA') parts.push(address.country);
  
  if (format === 'multi-line') {
    return parts.join('\n');
  }
  
  return parts.join(', ');
};

// Tag formatting
export const formatTags = (tags: string[], maxVisible = 3): { visible: string[]; hidden: number } => {
  if (!tags || tags.length === 0) {
    return { visible: [], hidden: 0 };
  }
  
  if (tags.length <= maxVisible) {
    return { visible: tags, hidden: 0 };
  }
  
  return {
    visible: tags.slice(0, maxVisible),
    hidden: tags.length - maxVisible,
  };
};

// Search highlighting
export const highlightSearchTerms = (text: string, searchTerm: string): string => {
  if (!text || !searchTerm) return text;
  
  const regex = new RegExp(`(${searchTerm})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
};

// Color formatting
export const getContrastColor = (hexColor: string): 'light' | 'dark' => {
  // Remove # if present
  const color = hexColor.replace('#', '');
  
  // Convert to RGB
  const r = parseInt(color.substr(0, 2), 16);
  const g = parseInt(color.substr(2, 2), 16);
  const b = parseInt(color.substr(4, 2), 16);
  
  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  return luminance > 0.5 ? 'dark' : 'light';
};

export const generateAvatarColor = (text: string): string => {
  // Generate a consistent color based on text
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 65%, 50%)`;
};

// List formatting
export const formatList = (items: string[], conjunction = 'and'): string => {
  if (!items || items.length === 0) return '';
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} ${conjunction} ${items[1]}`;
  
  const lastItem = items[items.length - 1];
  const otherItems = items.slice(0, -1).join(', ');
  
  return `${otherItems}, ${conjunction} ${lastItem}`;
};

// Progress formatting
export const formatProgress = (current: number, total: number): {
  percentage: number;
  display: string;
} => {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;
  const display = `${current} of ${total}`;
  
  return { percentage, display };
};

// Duration formatting
export const formatDuration = (milliseconds: number): string => {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
};

// Social media formatting
export const formatSocialHandle = (platform: string, handle: string): string => {
  if (!handle) return '';
  
  // Remove @ symbol if present
  const cleanHandle = handle.replace(/^@/, '');
  
  switch (platform.toLowerCase()) {
    case 'twitter':
    case 'x':
      return `@${cleanHandle}`;
    case 'linkedin':
      return cleanHandle.startsWith('in/') ? cleanHandle : `in/${cleanHandle}`;
    case 'github':
      return cleanHandle;
    case 'instagram':
      return `@${cleanHandle}`;
    default:
      return cleanHandle;
  }
};

export const getSocialUrl = (platform: string, handle: string): string => {
  const cleanHandle = handle.replace(/^@/, '');
  
  const urls: Record<string, string> = {
    twitter: `https://twitter.com/${cleanHandle}`,
    x: `https://x.com/${cleanHandle}`,
    linkedin: `https://linkedin.com/${cleanHandle.startsWith('in/') ? cleanHandle : `in/${cleanHandle}`}`,
    github: `https://github.com/${cleanHandle}`,
    instagram: `https://instagram.com/${cleanHandle}`,
    facebook: `https://facebook.com/${cleanHandle}`,
  };
  
  return urls[platform.toLowerCase()] || `https://${platform.toLowerCase()}.com/${cleanHandle}`;
};

export default {
  formatDate,
  formatDateTime,
  formatTime,
  formatRelativeTime,
  formatNumber,
  formatCurrency,
  formatPercentage,
  formatCompactNumber,
  formatFileSize,
  formatPhoneNumber,
  formatFullName,
  formatInitials,
  capitalizeFirst,
  capitalizeWords,
  truncateText,
  slugify,
  formatUrl,
  getDomainFromUrl,
  formatAddress,
  formatTags,
  highlightSearchTerms,
  getContrastColor,
  generateAvatarColor,
  formatList,
  formatProgress,
  formatDuration,
  formatSocialHandle,
  getSocialUrl,
};