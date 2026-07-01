<template>
  <button @click="foo" class="button">{{ text }}</button>
  <br>
  Other
</template>

<style>
  .button {
    color: white;
    background: blue;
    border: none;
    padding: 1em;
    font-size: 1em;
  }
</style>

<script>
function foo() {
  alert('ola')
}
</script>