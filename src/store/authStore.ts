import { defineStore } from 'pinia'

interface AuthStoreType {
    isLoggedIn: boolean
    userId: string | number
    username: string
    userAvatar: string
    locale: string
    isAdmin: boolean
}

interface UserInfo {
    isLoggedIn: boolean
    id: string
    attributes: {
        name: string
        profile_picture: string
        locale: string
        admin: boolean
    }
}
export const useAuthStore = defineStore({
    id: 'authStore',
    state: (): AuthStoreType => ({
        isLoggedIn: false,
        userId: '',
        username: 'Guest',
        userAvatar: 'default',
        locale: 'en',
        isAdmin: false,
    }),
    actions: {
        setToken(token: string): void {
            try {
                const payload = JSON.parse(globalThis.atob(token.split('.')[1] ?? ''))
                if (!payload) throw new Error('Empty payload')
                this.isLoggedIn = true
                this.userId   = payload.user_id
                this.username = payload.username ?? 'Guest'
                // TODO: validate `exp`, `iat`, etc. – sign out if expired
            } catch (err) {
                console.error('[authStore] Invalid JWT:', err)
                this.signOut()                // ensure clean state
                return
            }
        },
        setUserInfo(userInfo: UserInfo): void {
            this.isLoggedIn = true
            this.userId = userInfo.id ?? ''
            this.username = userInfo.attributes.name ?? 'Guest'
            if (userInfo.attributes.profile_picture != 'original/Default.jpg') {
                this.userAvatar =
                    userInfo.attributes.profile_picture ?? 'default'
            }
            this.locale = userInfo.attributes.locale ?? 'en'
            this.isAdmin = userInfo.attributes.admin
        },
        signOut(): void {
            this.isLoggedIn = false
            this.userId = ''
            this.username = 'Guest'
            this.userAvatar = 'default'
            this.locale = 'en'
            this.isAdmin = false
        },
    },
    getters: {
        getIsLoggedIn(): boolean {
            return this.isLoggedIn
        },
        getUserId(): string | number {
            return this.userId
        },
        getUsername(): string {
            return this.username
        },
        getUserAvatar(): string {
            return this.userAvatar
        },
        getLocale(): string {
            return this.locale
        },
        getIsAdmin(): boolean {
            return this.isAdmin
        },
    },
})

//  TODO: extract store verify and check better ways to impliment
