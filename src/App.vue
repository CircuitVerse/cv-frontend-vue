<template>
  <div id="app">
    <MobileHeader />
    <router-view />
  </div>
</template>

<script>
import MobileHeader from './components/MobileHeader.vue';

export default {
  name: 'App',
  components: {
    MobileHeader
  }
};
</script>

<style>
body {
  margin: 0;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}
</style>
