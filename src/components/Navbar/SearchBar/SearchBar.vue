<template>
    <div class="navbar-search-container">
        <form
            class="navbar-search-bar-form"
            @submit.prevent="handleSearch"
        >
            <select
                v-model="searchType"
                class="navbar-search-bar-select"
                aria-label="Search type"
            >
                <option value="all">All</option>
                <option value="projects">Projects</option>
                <option value="users">Users</option>
            </select>
            
            <input
                v-model="searchQuery"
                type="text"
                class="navbar-search-bar-input"
                :placeholder="$t('search.placeholder')"
                :maxlength="MAX_SEARCH_LENGTH"
                aria-label="Search input"
                @input="handleInput"
            />
            
            <button
                type="submit"
                class="btn btn-primary navbar-search-bar-button"
                :disabled="isSearchDisabled"
            >
                <i class="fa fa-search"></i>
            </button>
        </form>
        
        <!-- Validation message -->
        <div 
            v-if="validationMessage" 
            class="search-validation-message"
            role="alert"
            aria-live="assertive"
        >
            {{ validationMessage }}
        </div>
        
        <!-- No results message -->
        <div 
            v-if="showNoResults" 
            class="search-no-results"
            role="status"
            aria-live="polite"
        >
            {{ $t('search.no_results', { query: searchQuery }) }}
        </div>
    </div>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import DOMPurify from 'dompurify'

// Constants
const MAX_SEARCH_LENGTH = 100

// i18n
const { t } = useI18n()

// Emits
const emit = defineEmits<{
    (e: 'clear-search'): void
    (e: 'search-results', results: any[]): void
}>()

// Reactive state
const searchQuery = ref('')
const searchType = ref('all')
const validationMessage = ref('')
const showNoResults = ref(false)

// Computed
const isSearchDisabled = computed(() => {
    return searchQuery.value.length === 0 || !!validationMessage.value
})

// Methods
const sanitizeInput = (input: string): string => {
    // Use DOMPurify to sanitize input and remove XSS attempts
    // Strip all HTML tags and keep only plain text
    const sanitized = DOMPurify.sanitize(input, {
        ALLOWED_TAGS: [], // No HTML tags allowed
        ALLOWED_ATTR: [], // No attributes allowed
        KEEP_CONTENT: true, // Keep text content
    })
    
    return sanitized.trim()
}

const validateInput = (input: string): string | null => {
    const trimmed = input.trim()
    
    // Allow empty input (will show all results)
    if (trimmed.length === 0) {
        return null
    }
    
    // Check length
    if (trimmed.length > MAX_SEARCH_LENGTH) {
        return t('search.validation.too_long', { max: MAX_SEARCH_LENGTH }) as unknown as string
    }
    
    // Allow numbers and symbols - they might be valid search terms
    // We don't need to validate against numbers/symbols as projects can have names like "Project-123"
    // The backend will handle returning no results if nothing matches
    
    return null
}

const handleInput = () => {
    // Clear validation message when user types
    validationMessage.value = ''
    showNoResults.value = false
    
    // Validate on input
    const error = validateInput(searchQuery.value)
    if (error) {
        validationMessage.value = error
    }
}

const handleSearch = async () => {
    // Reset states
    showNoResults.value = false
    validationMessage.value = ''
    
    const trimmed = searchQuery.value.trim()
    
    // Validate input
    const error = validateInput(trimmed)
    if (error) {
        validationMessage.value = error
        return
    }
    
    // Sanitize the input using DOMPurify
    const sanitized = sanitizeInput(trimmed)
    
    // If empty after sanitization, emit clear-search event instead of reloading
    if (sanitized.length === 0) {
        emit('clear-search')
        searchQuery.value = ''
        return
    }
    
    try {
        // Encode the query for safe URL transmission
        // The backend should also validate and sanitize as the authoritative source
        const results = await performSearch(sanitized, searchType.value)
        
        if (results.length === 0) {
            showNoResults.value = true
        } else {
            // Emit results to parent component
            emit('search-results', results)
            console.log('Search results:', results)
        }
    } catch (error) {
        console.error('Search error:', error)
        validationMessage.value = t('search.validation.error') as unknown as string
    }
}

// Placeholder search function - replace with actual API call
const performSearch = async (query: string, type: string): Promise<any[]> => {
    // TODO: Replace with actual API endpoint
    // Always use encodeURIComponent to safely encode the query for URL transmission
    // The backend MUST also sanitize and validate - client-side is not authoritative
    const encodedQuery = encodeURIComponent(query)
    const encodedType = encodeURIComponent(type)
    
    // Example: const response = await fetch(`/api/search?q=${encodedQuery}&type=${encodedType}`)
    // return await response.json()
    
    // For now, return empty array to simulate no results
    return new Promise((resolve) => {
        setTimeout(() => {
            console.log(`Would search for: ${encodedQuery} (type: ${encodedType})`)
            resolve([]) // Replace with actual API call
        }, 500)
    })
}
</script>

<style scoped>
.navbar-search-container {
    position: relative;
}

.search-validation-message {
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    background-color: #f44336;
    color: white;
    padding: 8px 12px;
    border-radius: 4px;
    font-size: 14px;
    margin-top: 5px;
    white-space: nowrap;
    z-index: 1000;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.search-no-results {
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    background-color: #ff9800;
    color: white;
    padding: 8px 12px;
    border-radius: 4px;
    font-size: 14px;
    margin-top: 5px;
    white-space: nowrap;
    z-index: 1000;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.navbar-search-bar-button {
    padding: 5px 15px;
    margin: 5px;
    border: none;
    cursor: pointer;
}

.navbar-search-bar-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}
</style>
