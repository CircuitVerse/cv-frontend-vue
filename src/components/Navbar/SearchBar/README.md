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
- Uses **DOMPurify** library for robust XSS prevention
- Strips all HTML tags and attributes
- Keeps only plain text content
- Trims whitespace from input
- **Important**: Backend must also sanitize as authoritative source

### 4. **URL Encoding**
- All queries are encoded using `encodeURIComponent()` before transmission
- Prevents URL injection attacks
- Safe for API transmission

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
  // Query is already sanitized with DOMPurify and encoded with encodeURIComponent
  const encodedQuery = encodeURIComponent(query)
  const encodedType = encodeURIComponent(type)
  
  const response = await fetch(`/api/search?q=${encodedQuery}&type=${encodedType}`)
  return await response.json()
}
```

**Security Note**: While the frontend sanitizes and encodes queries, the **backend must always validate and sanitize** all input as the authoritative source. Never trust client-side validation alone.

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

### Client-Side Protection
1. **DOMPurify sanitization** - Industry-standard XSS prevention library
2. **Character length limits** - Prevents buffer overflow attacks
3. **URL encoding** - Safe query parameter transmission via `encodeURIComponent()`
4. **Input validation** - Real-time feedback prevents malformed queries

### Backend Requirements
⚠️ **Critical**: The backend MUST implement its own validation and sanitization:
- Never trust client-side input
- Validate all parameters server-side
- Sanitize before database queries (prevent SQL injection)
- Escape output when rendering (prevent XSS in responses)
- Implement rate limiting to prevent abuse

## Future Enhancements

- Add search history
- Implement autocomplete/suggestions
- Add keyboard navigation for results
- Support advanced search filters
