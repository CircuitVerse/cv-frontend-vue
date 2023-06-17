<template>
    <template v-if="isLodaing">
        <h1>Loading...</h1>
    </template>
    <template v-else-if="!isLodaing && !hasAccess">
        <h1>403</h1>
    </template>
    <template v-else-if="!isLodaing && hasAccess">
        <simulator />
    </template>
    <projectNameSet />
    <setDetailsOnCreate />
</template>

<script setup lang="ts">
import simulator from './simulator.vue'
import { onBeforeMount, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '../store/authStore'
import projectNameSet from '../components/DialogBox/ProjectNameSet.vue'
import setDetailsOnCreate from '../components/DialogBox/SetDetailsOnCreate.vue'

const route = useRoute()
const hasAccess = ref(true)
const isLodaing = ref(true)

// check if user has edit access to the project
async function checkEditAccess() {
    await fetch(`/api/v1/simulator/${(window as any).logixProjectId}/edit`, {
        method: 'GET',
        headers: {
            Accept: 'application/json',
        },
    }).then((res) => {
        // if user has edit access load circuit data
        if (res.ok) {
            res.json().then((data) => {
                console.log('all good to go')
                useAuthStore().setUserInfo(data.data)
                ;(window as any).isUserLoggedIn = true
                // console.log(data.data)
                console.log(
                    useAuthStore().getIsLoggedIn,
                    useAuthStore().getUsername,
                    useAuthStore().getUserId
                )
                isLodaing.value = false
            })
        } else if (res.status === 403) {
            // if user has no edit access show edit access denied page
            hasAccess.value = false
            isLodaing.value = false
        } else if (res.status === 404) {
            hasAccess.value = false
            isLodaing.value = false
        } else if (res.status === 401) {
            // if user is not logged in redirect to login page
            window.location.href = '/users/sign_in'
        }
    })
}

// get logged in user informaton when blank simulator is opened
async function getLoginData() {
    try {
        const response = await fetch('/api/v1/me', {
            method: 'GET',
            headers: {
                Accept: 'application/json',
            },
        })
        if (response.ok) {
            const data = await response.json()
            useAuthStore().setUserInfo(data.data)
            ;(window as any).isUserLoggedIn = true
        }
    } catch (err) {
        console.error(err)
    }
}

onBeforeMount(() => {
    // set project id if /edit/:projectId route is used
    ;(window as any).logixProjectId = route.params.projectId
    // only execute if projectId is defined
    if ((window as any).logixProjectId) {
        checkEditAccess()
    } else {
        // if projectId is not defined open blank simulator
        getLoginData()
        isLodaing.value = false
    }
})
</script>
