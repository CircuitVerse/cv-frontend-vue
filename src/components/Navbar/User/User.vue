<template>
    <ul class="nav navbar-nav noSelect pointerCursor pull-right account-btn">
        <li v-if="authStore.getIsLoggedIn === true" class="dropdown pull-right">
            <!-- @devartstar When integrating with Project remove v-if from above li and also v-else as it is handled by backend -->
            <a
                href="#"
                class="cur-user acc-drop user-field"
                data-toggle="dropdown"
                role="button"
                aria-haspopup="true"
                aria-expanded="false"
                >{{ authStore.getUsername }}<span class="caret acc-caret"></span
            ></a>
            <DropDown
                :list-items="userData"
                drop-down-header="user_dropdown"
                drop-down-type="user"
            />
        </li>
        <li v-else class="dropdown pull-right">
            <a class="navbar-nav signIn-btn user-field" href="/users/sign_in">
                {{ $t('simulator.nav.sign_in') }}
            </a>
        </li>
    </ul>
</template>

<script lang="ts" setup>
import { useAuthStore } from '#/store/authStore'
import DropDown from '@/Dropdown/DropDown.vue'
const authStore = useAuthStore()

defineProps({
    userData: { type: Array<{
        id: string
        item: string
        itemid: string
        attributes: Array<{
            name: string
            value: string
        }>
    }>, default: () => [] },
})
</script>

<style scoped>
/* @import url('./User.css'); */
a:link,
a:hover,
a:hover,
a:active {
    text-decoration: none;
    color: #fff;
}

.acc-caret {
    right: -17px;
}

.account-btn {
    position: absolute;
    right: 13px;
    padding: 4px 10px;
    border: 1px solid transparent;
    border-radius: 1px;
    transition: all 0.2s ease-in-out;
}

.account-btn:hover {
    border-bottom: 1px solid white;
    text-decoration: none;
}

.user-field {
    display: inline-block;
    max-width: 11rem;
    white-space: nowrap;
    text-overflow: ellipsis;
    text-align: right;
}

@media (max-width: 991px) {
    .user-field {
        visibility: hidden;
    }
}

.signIn-btn {
    color: var(--text-primary);
}

.cur-user,
.signIn-btn {
    color: #fff;
}

.signIn-btn:hover {
    color: var(--text-primary);
    text-decoration: none;
}
</style>
