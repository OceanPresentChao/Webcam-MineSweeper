<script setup lang="ts">

</script>

<template>
  <div class="flex justify-center items-center gap-4">
    <WebcamNN class="unableSee" />
    <MineSweeper />
  </div>
</template>

<style scoped>
@media screen and (max-width:1100px) {
  .unableSee{
    display: none;
  }
}
</style>
