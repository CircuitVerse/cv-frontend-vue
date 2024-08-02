<template>
    <!-- Hamburger Menu -->
    <button
      class="navbar-toggler collapsed"
      type="button"
      data-toggle="collapse"
      data-target="#bs-example-navbar-collapse-1"
      aria-controls="collapsedNavbar"
      aria-expanded="false"
      aria-label="Toggle navigation"
      @click="toggleCross"
    >
    <span :class="{ 'hidden': !isCrossed }" class="navbar-toggler-icon"></span>
    <span :class="{ 'hidden': isCrossed }" id="cross">&times;</span>
    
    </button>
  </template>

  <script>
  export default {
    data() {
      return {
        isCrossed: true,
      };
    },
    methods: {
      toggleCross() {
        this.isCrossed = !this.isCrossed;
      },
    },
    
  };
  </script>
  
  <style scoped>
  .hidden {
    display: none;
  }
    #cross{
        font-size: 30px;
    }
  </style>
  