<template>
    <router-link to="/">
        <span :class="cvlogo"></span>
    </router-link>
</template>

<script>
export default {
    name: 'Logo',
    props: {
        cvlogo: {
            type: String,
            default: 'logo',
        },
    },
    data() {
        return {}
    },
}
</script>

<style scoped>
/* @import url('./Logo.css'); */

.logo {
    background: url(../../styles/css/assets/logo.svg) center/cover;
    height: 30px;
    width: 105px;
    display: inline-block;
    margin-right: 36px;
}
</style>
