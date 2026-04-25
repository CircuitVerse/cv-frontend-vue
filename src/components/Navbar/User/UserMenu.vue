<template>
  <v-card class="avatar-menu" flat>
    <v-layout>
      <v-navigation-drawer
        v-model="drawer"
        location="right"
        class="userMenu"
        temporary
        width="290"
      >
        <div class="close-parent">
          <v-btn
            size="x-small"
            icon
            class="dialogClose"
            @click="drawer = false"
            variant="text"
            color="white"
          >
            <v-icon icon="mdi-arrow-right" size="large"></v-icon>
          </v-btn>
        </div>

        <v-list-item
          class="list-item-avatar"
          :prepend-avatar="authStore.getUserAvatar"
          :prepend-icon="
            authStore.getUserAvatar === 'default' ? 'mdi-account-circle-outline' : undefined
          "
          :title="authStore.getUsername"
          lines="two"
          color="white"
        ></v-list-item>

        <v-divider class="my-2 bg-white"></v-divider>

        <!-- Authentication Section -->
        <template v-if="!authStore.getIsLoggedIn">
          <v-list density="compact" nav>
            <v-list-item
              @click.stop="showAuthModal(true)"
              prepend-icon="mdi-login"
              :title="$t('simulator.nav.sign_in')"
              value="sign_in"
              variant="text"
              color="white"
            ></v-list-item>
            <v-list-item
              @click.stop="showAuthModal(false)"
              prepend-icon="mdi-account-plus"
              :title="$t('simulator.nav.user_dropdown.register')"
              value="register"
              variant="text"
              color="white"
            ></v-list-item>
          </v-list>
        </template>

        <!-- User Menu Section -->
        <template v-else>
          <v-list density="compact" nav>
            <v-list-item
              @click.stop="dashboard"
              prepend-icon="mdi-view-dashboard-outline"
              :title="$t('simulator.nav.user_dropdown.dashboard')"
              value="dashboard"
              variant="text"
              color="white"
            ></v-list-item>
            <v-list-item
              @click.stop="my_groups"
              prepend-icon="mdi-account-group-outline"
              :title="$t('simulator.nav.user_dropdown.my_groups')"
              value="my_groups"
              variant="text"
              color="white"
            ></v-list-item>
            <v-list-item
              @click.stop="notifications"
              prepend-icon="mdi-bell-outline"
              :title="$t('simulator.nav.user_dropdown.notifications')"
              value="notifications"
              variant="text"
              color="white"
            >
              <template v-if="unreadCount > 0" v-slot:append>
                <v-badge :content="unreadCount" color="error"></v-badge>
              </template>
            </v-list-item>
          </v-list>

          <v-divider class="my-2 bg-white"></v-divider>

          <v-list-item
            @click.stop="signout"
            prepend-icon="mdi-logout"
            :title="$t('simulator.nav.user_dropdown.logout')"
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
          @click.stop="drawer = !drawer"
          rounded="xl"
          color="white"
        >
          <v-avatar
            v-if="authStore.getUserAvatar !== 'default'"
            size="32"
            :image="authStore.getUserAvatar"
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

    <!-- Authentication Dialog -->
    <v-dialog v-model="authModal" max-width="500" persistent>
      <v-card class="auth-modal" style="background-color: white">
        <v-toolbar color="#43b984">
          <v-toolbar-title class="text-white">
            {{ isLoginMode ? $t('simulator.nav.sign_in') : $t('simulator.nav.user_dropdown.register') }}
          </v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn icon @click="authModal = false" color="white">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-toolbar>

        <v-card-text class="pa-6">
          <v-form @submit.prevent="handleAuthSubmit" ref="authForm">
            <v-text-field 
              v-if="!isLoginMode" 
              v-model="name" 
              :label="$t('simulator.nav.user_dropdown.auth_modal.name')" 
              type="text"
              :rules="[requiredRule]"
              variant="outlined"
              class="mb-0"
              bg-color="#f0eee6"
            ></v-text-field>

            <v-text-field
              v-model="email"
              :label="$t('simulator.nav.user_dropdown.auth_modal.email')"
              type="email"
              :rules="[requiredRule, emailRule]"
              variant="outlined"
              class="mb-0"
              bg-color="#f0eee6"
            ></v-text-field>

            <v-text-field
              v-model="password"
              :label="$t('simulator.nav.user_dropdown.auth_modal.password')"
              type="password"
              :rules="[requiredRule, passwordRule]"
              variant="outlined"
              class="mb-0"
              bg-color="#f0eee6"
            ></v-text-field>

            <div class="d-flex flex-column">
              <v-btn
                color="#43b984"
                type="submit"
                :loading="isLoading"
                :disabled="isLoading"
                size="large"
                block
                class="mb-2"
              >
                {{ isLoginMode ? $t('simulator.nav.sign_in') : $t('simulator.nav.user_dropdown.register') }}
              </v-btn>

              <v-btn
                variant="text"
                @click="toggleAuthMode"
                size="small"
                color="#43b984"
              >
                {{ isLoginMode ? $t('simulator.nav.user_dropdown.auth_modal.need_account') : $t('simulator.nav.user_dropdown.auth_modal.already_have_account') }}
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
      location="bottom right"
    >
      {{ snackbar.message }}

      <template v-slot:actions>
        <v-btn
          variant="text"
          @click="snackbar.visible = false"
          :icon="mdiClose"
          color="white"
        ></v-btn>
      </template>
    </v-snackbar>
  </v-card>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { availableLocale } from '#/locales/i18n'
import { useAuthStore } from '#/store/authStore'
import { mdiClose } from '@mdi/js'
// import { fetch } from '@tauri-apps/plugin-http' // Uncomment if using Tauri's HTTP plugin
import './User.scss'

const authStore = useAuthStore()
const drawer = ref(false)
const authModal = ref(false)
const isLoginMode = ref(true)
const email = ref('')
const password = ref('')
const name = ref('')
const { t, locale } = useI18n()
const isLoading = ref(false)
const authForm = ref()
const unreadCount = ref(0)

// Form validation rules
const requiredRule = (v: string) => !!v || t('simulator.nav.user_dropdown.auth_modal.field_required')
const emailRule = (v: string) => /.+@.+\..+/.test(v) || t('simulator.nav.user_dropdown.auth_modal.email_invalid')
const passwordRule = (v: string) => v.length >= 6 || t('simulator.nav.user_dropdown.auth_modal.password_min_length')

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
        errorData = { message: t('simulator.nav.user_dropdown.auth_modal.auth_failed') }
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
      isLoginMode.value ? t('simulator.nav.user_dropdown.auth_modal.login_success') : t('simulator.nav.user_dropdown.auth_modal.registration_success'),
      'success'
    )
    authModal.value = false
  } catch (error) {
    showSnackbar(`${t('simulator.nav.user_dropdown.auth_modal.auth_failed')}: ${error.message}`, 'error')
  } finally {
    isLoading.value = false
  }
}

function handleLoginError(status: number, errorData: any) {
  switch (status) {
    case 401:
      showSnackbar(t('simulator.nav.user_dropdown.auth_modal.invalid_credentials'), 'error')
      break
    case 404:
      showSnackbar(t('simulator.nav.user_dropdown.auth_modal.user_not_found'), 'error')
      break
    case 409:
      showSnackbar(t('simulator.nav.user_dropdown.auth_modal.user_already_exists'), 'error')
      break
    case 422:
      showSnackbar(t('simulator.nav.user_dropdown.auth_modal.invalid_input'), 'error')
      break
    default:
      showSnackbar(errorData.message || t('simulator.nav.user_dropdown.auth_modal.auth_failed'), 'error')
  }
}

function showSnackbar(message: string, type: 'success' | 'error' | 'warning' | 'info') {
  snackbar.value = {
    visible: true,
    message,
    color: type
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
  showSnackbar(t('simulator.nav.user_dropdown.auth_modal.logged_out'), 'info')
}
</script>
