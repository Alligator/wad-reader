<script lang="ts">
  export let title: string;
</script>

<div class="panel">
  <h3>{title}</h3>
  <slot />
</div>

<style>
  .panel {
    padding: 1rem;
    background-color: #444444;
  }
  .panel > h3 {
    margin: 0 0 .5rem 0;
  }
</style>
