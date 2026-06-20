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

        <v-list-item>
          <v-select
            :items="availableLocale"
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

        <!-- Authentication Section -->
        <template v-if="!authStore.getIsLoggedIn">
          <v-list density="compact" nav>
            <v-list-item
              @click.stop="signIn"
              prepend-icon="mdi-login"
              title="Sign In"
              value="sign_in"
              variant="text"
              color="white"
            ></v-list-item>
            <v-list-item
              @click.stop="register"
              prepend-icon="mdi-account-plus"
              title="Register"
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
              title="Dashboard"
              value="dashboard"
              variant="text"
              color="white"
            ></v-list-item>
            <v-list-item
              @click.stop="my_groups"
              prepend-icon="mdi-account-group-outline"
              title="My Groups"
              value="my_groups"
              variant="text"
              color="white"
            ></v-list-item>
            <v-list-item
              @click.stop="notifications"
              prepend-icon="mdi-bell-outline"
              title="Notifications"
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
  </v-card>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { availableLocale } from '#/locales/i18n'
import { useAuthStore } from '#/store/authStore'
import { signOutRails } from '#/utils/auth'
import './User.scss'

const authStore = useAuthStore()
const drawer = ref(false)
const { locale } = useI18n()
const unreadCount = ref(0)

function signIn() {
  const returnTo = encodeURIComponent(window.location.pathname + window.location.search)
  window.location.href = `/users/sign_in?return_to=${returnTo}`
}

function register() {
  window.location.href = '/users/sign_up'
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
  signOutRails((window as any).csrfToken)
}
</script>
