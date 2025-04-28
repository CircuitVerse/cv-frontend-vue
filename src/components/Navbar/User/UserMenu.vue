<template>
  <v-card class="avatar-menu">
    <v-layout>
      <v-navigation-drawer
        v-model="drawer"
        location="right"
        class="userMenu"
        temporary
      >
        <div class="close-parent">
          <v-btn
            size="x-small"
            icon
            class="dialogClose"
            @click="drawer = !drawer"
          >
            <v-icon style="font-size: 1.5rem;">mdi-arrow-right</v-icon>
          </v-btn>
        </div>
        <v-list-item
          class="list-item-avatar"
          :prepend-avatar="authStore.getUserAvatar"
          :prepend-icon="
            authStore.getUserAvatar === 'default'
              ? 'mdi-account-circle-outline'
              : ''
          "
          :title="authStore.getUsername"
        ></v-list-item>
        <v-list-item>
          <v-select
            :items="availableLocale"
            label="Locale"
            v-model="locale"
            density="compact"
            outlined
            dense
            hide-details
          ></v-select>
        </v-list-item>
        <v-divider></v-divider>

        <!-- trigger the modal -->
        <div v-if="!authStore.getIsLoggedIn">
          <v-list dense class="userMenuList1" nav>
            <v-list-item
              @click.stop="showAuthModal(true)"
              prepend-icon="mdi-login"
              title="Sign In"
              value="sign_in"
            ></v-list-item>
            <v-list-item
              @click.stop="showAuthModal(false)"
              prepend-icon="mdi-account-plus"
              title="Register"
              value="register"
            ></v-list-item>
          </v-list>
        </div>

        <div v-if="authStore.getIsLoggedIn">
          <v-list density="compact" class="userMenuList1" nav>
            <v-list-item
              @click.stop="dashboard"
              prepend-icon="mdi-view-dashboard-outline"
              title="Dashboard"
              value="dashboard"
            ></v-list-item>
            <v-list-item
              @click.stop="my_groups"
              prepend-icon="mdi-account-group-outline"
              title="My Groups"
              value="my_groups"
            ></v-list-item>
            <v-list-item
              @click.stop="notifications"
              prepend-icon="mdi-bell-outline"
              title="Notifications"
              value="notifications"
            ></v-list-item>
          </v-list>
          <v-divider></v-divider>
          <v-list-item
            @click.stop="signout"
            prepend-icon="mdi-logout"
            title="Logout"
            value="logout"
          ></v-list-item>
        </div>
      </v-navigation-drawer>
      <v-main>
        <v-btn
          class="avatar-btn"
          color="transparent"
          @click.stop="drawer = !drawer"
        >
          <v-icon
            v-if="authStore.getUserAvatar == 'default'"
            class="avatar"
            size="x-large"
            >mdi-account</v-icon
          >
          <v-avatar
            v-else
            class="avatar"
            size="small"
            :image="authStore.getUserAvatar"
          ></v-avatar>
          {{ authStore.getUsername }}
        </v-btn>
      </v-main>
    </v-layout>

    <!-- Authentication Modal -->
    <v-dialog v-model="authModal" max-width="500px">
      <v-card class="auth-modal">
        <v-card-title class="text-center auth-modal-title">
          {{ isLoginMode ? 'Sign In' : 'Register' }}
        </v-card-title>
        <v-card-text>
          <v-form @submit.prevent="handleAuthSubmit">
            <v-text-field 
              v-if="!isLoginMode" 
              v-model="name" 
              label="Name" 
              type="text" 
              required 
              outlined 
              dense
              class="auth-input"
            ></v-text-field>
            <v-text-field
              v-model="email"
              label="Email"
              type="email"
              required
              outlined
              dense
              class="auth-input"
            ></v-text-field>
            <v-text-field
              v-model="password"
              label="Password"
              type="password"
              required
              outlined
              dense
              class="auth-input"
            ></v-text-field>
            <div class="d-flex justify-space-between mt-4">
              <v-btn
              color="success"
              type="submit"
              class="auth-submit-btn"
              :loading="isLoading"
              :disabled="isLoading"
              >
                {{ isLoginMode ? 'Sign In' : 'Register' }}
              </v-btn>
              <v-btn
                variant="text"
                @click="toggleAuthMode"
                class="auth-toggle-btn"
              >
                {{ isLoginMode ? 'Need an account? Register' : 'Already have an account? Sign In' }}
              </v-btn>
            </div>
          </v-form>
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- Snackbar Notification -->
    <v-snackbar
      v-model="snackbar.visible"
      :color="snackbar.color"
      :timeout="3000"
    >
      {{ snackbar.message }}
      <template v-slot:actions>
        <v-btn
          variant="text"
          @click="snackbar.visible = false"
        >
          Close
        </v-btn>
      </template>
    </v-snackbar>
  </v-card>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { availableLocale } from '#/locales/i18n'
import { useAuthStore } from '#/store/authStore'

const authStore = useAuthStore()
const drawer = ref(false)
const authModal = ref(false)
const isLoginMode = ref(true)
const email = ref('')
const password = ref('')
const name = ref('')
const { locale } = useI18n()
const isLoading = ref(false)

// Snackbar state
const snackbar = ref({
  visible: false,
  message: '',
  color: 'success' // can be 'success', 'error', 'warning', 'info'
})

function showAuthModal(login: boolean) {
  isLoginMode.value = login
  authModal.value = true
  drawer.value = false
}

function toggleAuthMode() {
  isLoginMode.value = !isLoginMode.value
}

async function handleAuthSubmit() {
  if (!email.value || !password.value || (!isLoginMode.value && !name.value)) {
    showSnackbar('Please fill in all fields', 'error')
    return
  }

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
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const text = await response.text()
      let errorData: any = {}
      try { errorData = JSON.parse(text) } catch { errorData = { message: text } }      handleLoginError(response.status, errorData)
      return
    }

    const data = await response.json()
    authStore.setToken(data.token)
    showSnackbar(
      isLoginMode.value ? 'Login successful!' : 'Registration successful!',
      'success'
    )

    // Clear fields and close modal
    email.value = ''
    password.value = ''
    name.value = ''
    authModal.value = false
  } catch (error) {
    console.error('Authentication error:', error)
    showSnackbar('An error occurred. Please try again.', 'error')
  } finally {
    isLoading.value = false
  }
}

function handleLoginError(status: number, errorData: any) {
  switch (status) {
    case 401:
      showSnackbar('Invalid password', 'error')
      break
    case 404:
      showSnackbar('User not found', 'error')
      break
    case 409:
      showSnackbar('User already exists', 'error')
      break
    case 422:
      showSnackbar('Invalid email format', 'error')
      break
    default:
      showSnackbar(errorData.message || 'Login failed', 'error')
  }
}

function showSnackbar(message: string, type: string) {
  snackbar.value = {
    visible: true,
    message,
    color: type === 'error' ? 'error' : 'success'
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
}
</script>

<style>
.userMenu {
  backdrop-filter: blur(5px) !important;
  border-radius: 5px !important;
  border: 0.5px solid var(--br-primary) !important;
  background: var(--bg-primary-moz) !important;
  background-color: var(--bg-primary-chr) !important;
  color: white !important;
}

.userMenuList1 {
  background-color: transparent !important;
  color: #fff !important;
}

.avatar-menu {
  background-color: transparent !important;
  box-shadow: none !important;
}

.avatar-btn {
  color: #fff !important;
  text-transform: none !important;
  font-size: 1rem !important;
}

.list-item-avatar .v-list-item-title {
  color: #fff !important;
  font-size: 1.2rem !important;
}

.list-item-avatar img {
  display: inline-block;
}

.avatar img {
  cursor: pointer;
  display: inline-block;
}

/* Auth Modal Styles */
.auth-modal {
  background-color: #424242 !important;
  color: white !important;
  border-radius: 8px;
}

.auth-modal-title {
  color: white !important;
  font-size: 1.5rem;
  margin-bottom: 20px;
  padding-top: 20px;
}

.auth-input .v-input__control,
.auth-input .v-field {
  background-color: #616161 !important;
  color: white !important;
  border-radius: 4px;
}

.auth-input .v-field__outline {
  color: #9e9e9e !important;
}

.auth-input .v-label {
  color: #bdbdbd !important;
}

.auth-submit-btn {
  background-color: #4CAF50 !important;
  color: white !important;
  text-transform: none;
  font-weight: bold;
}

.auth-toggle-btn {
  color: white !important;
  text-transform: none;
}

.v-field__input,
.v-label.v-field-label--floating {
  color: white !important;
}
</style>