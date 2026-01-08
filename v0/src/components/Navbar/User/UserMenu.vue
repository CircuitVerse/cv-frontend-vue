<template>
  <v-card class="avatar-menu" flat>
    <v-layout>
      <v-navigation-drawer
        v-model="drawer"
        location="right"
        class="userMenu"
        temporary
        width="270"
      >
        <div class="close-parent">
          <v-btn
            size="x-small"
            icon
            class="dialogClose"
            v-on:click="drawer = false"
            variant="text"
            color="white"
          >
            <v-icon icon="mdi-arrow-right" size="large"></v-icon>
          </v-btn>
        </div>

        <v-list-item
          class="list-item-avatar"
          v-bind:prepend-avatar="authStore.getUserAvatar"
          v-bind:prepend-icon="
            authStore.getUserAvatar === 'default' ? 'mdi-account-circle-outline' : undefined
          "
          v-bind:title="authStore.getUsername"
          lines="two"
          color="white"
        ></v-list-item>

        <v-list-item>
          <v-select
            v-bind:items="availableLocale"
            label="Locale"
            v-model="locale"
            density="compact"
            variant="outlined"
            hide-details
            single-line
            color="white"
            bg-color="rgba(255, 255, 255, 0.1)"
          ></v-select>
        </v-list-item>

        <v-divider class="my-2 bg-white"></v-divider>

        <template v-if="!authStore.getIsLoggedIn">
          <v-list density="compact" nav>
            <v-list-item
              v-on:click="showAuthModal(true)"
              prepend-icon="mdi-login"
              title="Sign In"
              value="sign_in"
              variant="text"
              color="white"
            ></v-list-item>
            <v-list-item
              v-on:click="showAuthModal(false)"
              prepend-icon="mdi-account-plus"
              title="Register"
              value="register"
              variant="text"
              color="white"
            ></v-list-item>
          </v-list>
        </template>

        <template v-else>
          <v-list density="compact" nav>
            <v-list-item
              v-on:click="dashboard"
              prepend-icon="mdi-view-dashboard-outline"
              title="Dashboard"
              value="dashboard"
              variant="text"
              color="white"
            ></v-list-item>
            <v-list-item
              v-on:click="my_groups"
              prepend-icon="mdi-account-group-outline"
              title="My Groups"
              value="my_groups"
              variant="text"
              color="white"
            ></v-list-item>
            <v-list-item
              v-on:click="notifications"
              prepend-icon="mdi-bell-outline"
              title="Notifications"
              value="notifications"
              variant="text"
              color="white"
            >
              <template v-if="unreadCount > 0" v-slot:append>
                <v-badge v-bind:content="unreadCount" color="error"></v-badge>
              </template>
            </v-list-item>
          </v-list>

          <v-divider class="my-2 bg-white"></v-divider>

          <v-list-item
            v-on:click="signout"
            prepend-icon="mdi-logout"
            title="Logout"
            value="logout"
            variant="text"
            color="white"
          ></v-list-item>
        </template>
      </v-navigation-drawer>

      <v-main>
        <v-btn
          class="avatar-btn"
          variant="text"
          v-on:click="drawer = !drawer"
          rounded="xl"
          color="white"
        >
          <v-avatar
            v-if="authStore.getUserAvatar !== 'default'"
            size="32"
            v-bind:image="authStore.getUserAvatar"
            color="white"
          ></v-avatar>
          <v-icon
            v-else
            icon="mdi-account"
            size="large"
            color="white"
          ></v-icon>
          <span class="ml-2 text-white" style="font-size: 1.2rem">{{ authStore.getUsername }}</span>
        </v-btn>
      </v-main>
    </v-layout>

    <v-dialog v-model="authModal" max-width="500" persistent>
      <v-card class="auth-modal" style="background-color: white">
        <v-toolbar color="#43b984">
          <v-toolbar-title class="text-white">
            {{ isLoginMode ? 'Sign In' : 'Register' }}
          </v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn icon v-on:click="authModal = false" color="white">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-toolbar>

        <v-card-text class="pa-6">
          <v-form v-on:submit.prevent="handleAuthSubmit" ref="authForm">
            <v-text-field 
              v-if="!isLoginMode" 
              v-model="name" 
              label="Name" 
              type="text"
              v-bind:rules="[requiredRule]"
              variant="outlined"
              class="mb-0"
              bg-color="#f0eee6"
            ></v-text-field>

            <v-text-field
              v-model="email"
              label="Email"
              type="email"
              v-bind:rules="[requiredRule, emailRule]"
              variant="outlined"
              class="mb-0"
              bg-color="#f0eee6"
            ></v-text-field>

            <v-text-field
              v-model="password"
              label="Password"
              type="password"
              v-bind:rules="[requiredRule, passwordRule]"
              variant="outlined"
              class="mb-0"
              bg-color="#f0eee6"
            ></v-text-field>

            <div class="d-flex flex-column">
              <v-btn
                color="#43b984"
                type="submit"
                v-bind:loading="isLoading"
                v-bind:disabled="isLoading"
                size="large"
                block
                class="mb-2"
              >
                {{ isLoginMode ? 'Sign In' : 'Register' }}
              </v-btn>

              <v-btn
                variant="text"
                v-on:click="toggleAuthMode"
                size="small"
                color="#43b984"
              >
                {{ isLoginMode ? 'Need an account? Register' : 'Already have an account? Sign In' }}
              </v-btn>
            </div>
          </v-form>
        </v-card-text>
      </v-card>
    </v-dialog>

    <v-snackbar
      v-model="snackbar.visible"
      v-bind:color="snackbar.color"
      v-bind:timeout="3000"
      location="bottom right"
    >
      {{ snackbar.message }}

      <template v-slot:actions>
        <v-btn
          variant="text"
          v-on:click="snackbar.visible = false"
          v-bind:icon="mdiClose"
          color="white"
        ></v-btn>
      </template>
    </v-snackbar>
  </v-card>
</template>

<script lang="ts" setup>
import { ref, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { availableLocale } from '#/locales/i18n'
import { useAuthStore } from '#/store/authStore'
import { mdiClose } from '@mdi/js'
import './User.scss'

const authStore = useAuthStore()
const drawer = ref(false)
const authModal = ref(false)
const isLoginMode = ref(true)
const email = ref('')
const password = ref('')
const name = ref('')
const { locale } = useI18n()
const isLoading = ref(false)
const authForm = ref()
const unreadCount = ref(0)

/**
 * Watcher to handle language changes:
 * 1. Saves preference to localStorage for refresh persistence.
 * 2. Updates the document lang and direction (RTL support).
 */
watch(locale, function(newLocale) {
  localStorage.setItem('locale', newLocale)
  document.documentElement.lang = newLocale
  
  if (newLocale === 'ar') {
    document.documentElement.dir = 'rtl'
  } else {
    document.documentElement.dir = 'ltr'
  }
})

/**
 * Lifecycle hook to restore user's language preference on load.
 */
onMounted(function() {
  const savedLocale = localStorage.getItem('locale')
  if (savedLocale) {
    locale.value = savedLocale
  }
  
  document.documentElement.lang = locale.value
  if (locale.value === 'ar') {
    document.documentElement.dir = 'rtl'
  } else {
    document.documentElement.dir = 'ltr'
  }
})

// Form validation rules
const requiredRule = function(v: string) { return !!v || 'This field is required' }
const emailRule = function(v: string) { return /.+@.+\..+/.test(v) || 'E-mail must be valid' }
const passwordRule = function(v: string) { return v.length >= 6 || 'Password must be at least 6 characters' }

// Snackbar state
const snackbar = ref({
  visible: false,
  message: '',
  color: '#43b984'
})

function showAuthModal(login: boolean) {
  isLoginMode.value = login
  authModal.value = true
  drawer.value = false
  email.value = ''
  password.value = ''
  name.value = ''
}

function toggleAuthMode() {
  isLoginMode.value = !isLoginMode.value
}

async function handleAuthSubmit() {
  const { valid } = await authForm.value.validate()
  if (!valid) return

  isLoading.value = true

  try {
    const url = isLoginMode.value
      ? 'http://localhost:4000/api/v1/auth/login'
      : 'http://localhost:4000/api/v1/auth/signup'

    const body = isLoginMode.value
      ? { email: email.value, password: password.value }
      : { email: email.value, password: password.value, name: name.value }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    })

    if (!response.ok) {
      let errorData
      try {
        errorData = await response.json()
      } catch (e) {
        errorData = { message: 'An error occurred' }
      }
      handleLoginError(response.status, errorData)
      return
    }

    const data = await response.json()
    
    if (!data.token) {
      throw new Error('No token received from server')
    }
    
    authStore.setToken(data.token)
    showSnackbar(
      isLoginMode.value ? 'Login successful!' : 'Registration successful!',
      'success'
    )
    authModal.value = false
  } catch (error: any) {
    showSnackbar(`Authentication failed: ${error.message}`, 'error')
  } finally {
    isLoading.value = false
  }
}

function handleLoginError(status: number, errorData: any) {
  switch (status) {
    case 401:
      showSnackbar('Invalid credentials', 'error')
      break
    case 404:
      showSnackbar('User not found', 'error')
      break
    case 409:
      showSnackbar('User already exists', 'error')
      break
    case 422:
      showSnackbar('Invalid input data', 'error')
      break
    default:
      showSnackbar(errorData.message || 'Authentication failed', 'error')
  }
}

function showSnackbar(message: string, type: 'success' | 'error' | 'warning' | 'info') {
  snackbar.value = {
    visible: true,
    message,
    color: type === 'error' ? '#dc5656' : '#43b984'
  }
}

function dashboard() {
  window.location.href = `/users/${authStore.getUserId}`
}

function my_groups() {
  window.location.href = `/users/${authStore.getUserId}/groups`
}

function notifications() {
  window.location.href = `/users/${authStore.getUserId}/notifications`
}

function signout() {
  authStore.signOut()
  showSnackbar('You have been logged out', 'info')
}
</script>