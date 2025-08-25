import React, { useState, useRef, useEffect } from 'react';
import {
  TextField,
  InputAdornment,
  IconButton,
  Box,
  Typography,
  Chip,
  Paper,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  CircularProgress,
} from '@mui/material';
import { Search, Clear, TrendingUp } from '@mui/icons-material';

import { useDebounce } from '@hooks/useDebounce';
import { useSearch } from '@store/uiStore';

interface SearchSuggestion {
  id: string;
  type: 'contact' | 'company' | 'tag' | 'recent';
  title: string;
  subtitle?: string;
  avatar?: string;
  count?: number;
}

interface SearchBarProps {
  /**
   * Placeholder text
   */
  placeholder?: string;
  /**
   * Whether to show search suggestions
   */
  showSuggestions?: boolean;
  /**
   * Whether to show recent searches
   */
  showRecentSearches?: boolean;
  /**
   * Whether to show popular searches
   */
  showPopularSearches?: boolean;
  /**
   * Maximum number of suggestions to show
   */
  maxSuggestions?: number;
  /**
   * Callback when search is performed
   */
  onSearch?: (query: string) => void;
  /**
   * Callback when suggestion is selected
   */
  onSuggestionSelect?: (suggestion: SearchSuggestion) => void;
  /**
   * Custom suggestions data
   */
  suggestions?: SearchSuggestion[];
  /**
   * Whether search is loading
   */
  loading?: boolean;
  /**
   * Size of the search input
   */
  size?: 'small' | 'medium';
  /**
   * Width of the search input
   */
  fullWidth?: boolean;
  /**
   * Additional styling
   */
  sx?: object;
  /**
   * Whether to auto-focus on mount
   */
  autoFocus?: boolean;
  /**
   * Debounce delay in milliseconds
   */
  debounceDelay?: number;
}

const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = 'Search...',
  showSuggestions = true,
  showRecentSearches = true,
  showPopularSearches = true,
  maxSuggestions = 8,
  onSearch,
  onSuggestionSelect,
  suggestions = [],
  loading = false,
  size = 'medium',
  fullWidth = false,
  sx = {},
  autoFocus = false,
  debounceDelay = 300,
}) => {
  const { query, setQuery } = useSearch();
  const [inputValue, setInputValue] = useState(query);
  const [showDropdown, setShowDropdown] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Debounce the search query
  const debouncedQuery = useDebounce(inputValue, debounceDelay);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('connectkit-recent-searches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved).slice(0, 5));
      } catch (error) {
        console.error('Error loading recent searches:', error);
      }
    }
  }, []);

  // Handle debounced search
  useEffect(() => {
    if (debouncedQuery !== query) {
      setQuery(debouncedQuery);
      if (debouncedQuery && onSearch) {
        onSearch(debouncedQuery);
      }
    }
  }, [debouncedQuery, query, setQuery, onSearch]);

  // Handle input change
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setInputValue(value);

    if (value && showSuggestions) {
      setShowDropdown(true);
    }
  };

  // Handle search submission
  const handleSearch = (searchQuery?: string) => {
    const queryToUse = searchQuery || inputValue;

    if (queryToUse.trim()) {
      setQuery(queryToUse);

      // Save to recent searches
      const updated = [
        queryToUse,
        ...recentSearches.filter(item => item !== queryToUse),
      ].slice(0, 5);

      setRecentSearches(updated);
      localStorage.setItem(
        'connectkit-recent-searches',
        JSON.stringify(updated)
      );

      if (onSearch) {
        onSearch(queryToUse);
      }
    }

    setShowDropdown(false);
    searchInputRef.current?.blur();
  };

  // Handle key press
  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleSearch();
    } else if (event.key === 'Escape') {
      setShowDropdown(false);
      searchInputRef.current?.blur();
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setInputValue(suggestion.title);
    setQuery(suggestion.title);
    setShowDropdown(false);

    if (onSuggestionSelect) {
      onSuggestionSelect(suggestion);
    } else if (onSearch) {
      onSearch(suggestion.title);
    }
  };

  // Handle recent search click
  const handleRecentSearchClick = (searchText: string) => {
    setInputValue(searchText);
    handleSearch(searchText);
  };

  // Clear search
  const handleClear = () => {
    setInputValue('');
    setQuery('');
    setShowDropdown(false);
    searchInputRef.current?.focus();
  };

  // Popular searches (mock data)
  const popularSearches = [
    'John Smith',
    'Recent contacts',
    'Company: Google',
    'Tag: important',
    'Favorites',
  ];

  return (
    <Box sx={{ position: 'relative', ...sx }}>
      <TextField
        ref={searchInputRef}
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyPress}
        onFocus={() => showSuggestions && setShowDropdown(true)}
        onBlur={() => {
          // Delay hiding to allow clicks on suggestions
          setTimeout(() => setShowDropdown(false), 200);
        }}
        placeholder={placeholder}
        size={size}
        fullWidth={fullWidth}
        autoFocus={autoFocus}
        InputProps={{
          startAdornment: (
            <InputAdornment position='start'>
              <Search color='action' />
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position='end'>
              {loading && <CircularProgress size={20} />}
              {inputValue && !loading && (
                <IconButton
                  size='small'
                  onClick={handleClear}
                  aria-label='clear search'
                >
                  <Clear />
                </IconButton>
              )}
            </InputAdornment>
          ),
        }}
      />

      {/* Search Dropdown */}
      {showDropdown && showSuggestions && (
        <Paper
          elevation={4}
          sx={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 1300,
            mt: 1,
            maxHeight: 400,
            overflow: 'auto',
          }}
        >
          {/* Current Search */}
          {inputValue && (
            <>
              <ListItem button onClick={() => handleSearch()} sx={{ py: 1 }}>
                <ListItemAvatar>
                  <Avatar
                    sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}
                  >
                    <Search />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={`Search for "${inputValue}"`}
                  secondary='Press Enter to search'
                />
              </ListItem>
              <Divider />
            </>
          )}

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <>
              <Box sx={{ p: 1.5, pb: 0 }}>
                <Typography
                  variant='caption'
                  color='text.secondary'
                  fontWeight={600}
                >
                  SUGGESTIONS
                </Typography>
              </Box>
              {suggestions.slice(0, maxSuggestions).map(suggestion => (
                <ListItem
                  key={suggestion.id}
                  button
                  onClick={() => handleSuggestionClick(suggestion)}
                  sx={{ py: 0.5 }}
                >
                  <ListItemAvatar>
                    <Avatar
                      src={suggestion.avatar}
                      sx={{ width: 32, height: 32 }}
                    >
                      {suggestion.title[0]}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={suggestion.title}
                    secondary={suggestion.subtitle}
                    primaryTypographyProps={{ fontSize: '0.875rem' }}
                    secondaryTypographyProps={{ fontSize: '0.75rem' }}
                  />
                  {suggestion.count !== undefined && (
                    <Chip
                      label={suggestion.count}
                      size='small'
                      sx={{ ml: 1, height: 20, fontSize: '0.7rem' }}
                    />
                  )}
                </ListItem>
              ))}
              <Divider />
            </>
          )}

          {/* Recent Searches */}
          {!inputValue && showRecentSearches && recentSearches.length > 0 && (
            <>
              <Box sx={{ p: 1.5, pb: 0 }}>
                <Typography
                  variant='caption'
                  color='text.secondary'
                  fontWeight={600}
                >
                  RECENT SEARCHES
                </Typography>
              </Box>
              {recentSearches.map((search, index) => (
                <ListItem
                  key={index}
                  button
                  onClick={() => handleRecentSearchClick(search)}
                  sx={{ py: 0.5 }}
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'grey.100', width: 32, height: 32 }}>
                      <Search color='action' />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={search}
                    primaryTypographyProps={{ fontSize: '0.875rem' }}
                  />
                </ListItem>
              ))}
              <Divider />
            </>
          )}

          {/* Popular Searches */}
          {!inputValue && showPopularSearches && (
            <>
              <Box sx={{ p: 1.5, pb: 0 }}>
                <Typography
                  variant='caption'
                  color='text.secondary'
                  fontWeight={600}
                >
                  POPULAR SEARCHES
                </Typography>
              </Box>
              {popularSearches.map((search, index) => (
                <ListItem
                  key={index}
                  button
                  onClick={() => handleRecentSearchClick(search)}
                  sx={{ py: 0.5 }}
                >
                  <ListItemAvatar>
                    <Avatar
                      sx={{ bgcolor: 'success.light', width: 32, height: 32 }}
                    >
                      <TrendingUp color='success' />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={search}
                    primaryTypographyProps={{ fontSize: '0.875rem' }}
                  />
                </ListItem>
              ))}
            </>
          )}

          {/* No results */}
          {inputValue && suggestions.length === 0 && !loading && (
            <Box sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant='body2' color='text.secondary'>
                No suggestions found
              </Typography>
            </Box>
          )}
        </Paper>
      )}
    </Box>
  );
};

export default SearchBar;
