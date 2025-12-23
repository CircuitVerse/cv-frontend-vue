# Search Bar Component

## Overview
The SearchBar component provides a robust search functionality with input validation and sanitization.

## Features

### 1. **Empty Input Handling**
- When the user submits an empty search, the page reloads to show all projects/default view
- No error is shown for empty input

### 2. **Input Validation**
- **Maximum Length**: Search queries are limited to 100 characters
- **Visual Feedback**: Character limit is enforced via `maxlength` attribute
- **Real-time Validation**: Users receive immediate feedback when typing

### 3. **Input Sanitization**
- Removes potential XSS attempts:
  - Strips `<>` angle brackets
  - Removes `javascript:` protocol
  - Filters out event handlers (e.g., `onclick=`)
- Trims whitespace from input

### 4. **Flexible Search**
- **Allows Numbers**: Users can search for projects like "Project-123"
- **Allows Symbols**: Users can search for projects with special characters like "C@t_cluster"
- **Handles No Results**: Shows a clear message when no results are found

### 5. **User Feedback**
- **Validation Messages**: Red popup for validation errors
- **No Results Message**: Orange popup when search returns no results
- **Disabled State**: Submit button is disabled when input is invalid

## Usage

```vue
<template>
  <SearchBar />
</template>

<script setup>
import SearchBar from '@/Navbar/SearchBar/SearchBar.vue'
</script>
```

## API Integration

The component includes a placeholder `performSearch()` function that needs to be connected to your actual API:

```typescript
const performSearch = async (query: string, type: string): Promise<any[]> => {
  // Replace with actual API call
  const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&type=${type}`)
  return await response.json()
}
```

## Localization

The component supports internationalization. Add translations in your locale files:

```json
{
  "search": {
    "placeholder": "Search projects, users...",
    "no_results": "No results found for \"{query}\"",
    "validation": {
      "too_long": "Search query must be less than {max} characters",
      "error": "An error occurred while searching. Please try again."
    }
  }
}
```

## Testing Checklist

- [x] Empty search reloads the page
- [x] Search with numbers (e.g., "123") works correctly
- [x] Search with symbols (e.g., "@@@") is sanitized and processed
- [x] Character limit prevents excessive input
- [x] Validation messages appear for invalid input
- [x] "No results" message shows when search returns nothing
- [x] XSS attempts are sanitized

## Security

The component implements multiple security measures:
1. Input sanitization to prevent XSS attacks
2. Character length limits to prevent overflow
3. Removal of potentially malicious patterns

## Future Enhancements

- Add search history
- Implement autocomplete/suggestions
- Add keyboard navigation for results
- Support advanced search filters
