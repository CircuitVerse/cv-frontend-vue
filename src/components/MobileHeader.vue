<template>
  <header class="mobile-header">
    <h1 class="title">CircuitVerse Simulator</h1>
    <nav class="nav-links">
      <a href="/simulatorvue/">Simulator</a>
      <a href="/docs">Docs</a>
      <a href="/about">About</a>
    </nav>
  </header>
</template>

<script>
export default {
  name: "MobileHeader"
};
</script>

<style scoped>
.mobile-header {
  background-color: #003366;
  color: white;
  padding: 1rem;
  text-align: center;
}
.title {
  font-size: 1.8rem;
}
.nav-links {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  margin-top: 0.5rem;
}
.nav-links a {
  color: #fff;
  text-decoration: none;
  margin: 0.5rem 1rem;
  font-size: 1rem;
}
.nav-links a:hover {
  text-decoration: underline;
}
@media (max-width: 600px) {
  .title {
    font-size: 1.4rem;
  }
  .nav-links a {
    margin: 0.25rem;
    font-size: 0.9rem;
  }
}
</style>
