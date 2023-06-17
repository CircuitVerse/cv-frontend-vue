import { defineStore } from 'pinia'

interface UserInfo {
    isLoggedIn: boolean
    id: string
    attributes: {
        name: string
        locale: string
        admin: boolean
    }
}
export const useAuthStore = defineStore({
    id: 'authStore',
    state: () => ({
        isLoggedIn: false,
        userId: '',
        username: '',
        locale: 'en',
        isAdmin: false,
    }),
    actions: {
        setUserInfo(userInfo: UserInfo): void {
            this.isLoggedIn = true
            this.userId = userInfo.id ?? ''
            this.username = userInfo.attributes.name ?? ''
            this.locale = userInfo.attributes.locale ?? 'en'
            this.isAdmin = userInfo.attributes.admin
        },
    },
    getters: {
        getIsLoggedIn(): boolean {
            return this.isLoggedIn
        },
        getUserId(): string {
            return this.userId
        },
        getUsername(): string {
            return this.username
        },
        getLocale(): string {
            return this.locale
        },
        getIsAdmin(): boolean {
            return this.isAdmin
        },
    },
})
