<script lang="ts">
  export let title: string;
  export let fullWidth: boolean = false;
</script>

<div class="panel" class:fullWidth>
  <h3>{title}</h3>
  <slot />
</div>

<style>
  .panel {
    padding: 1rem;
    background-color: var(--red-60);
    box-shadow: var(--red-90) 10px 10px;
    border-radius: 5px;
    margin-bottom: 1rem;
  }
  .panel > h3 {
    margin: 0 0 .5rem 0;
  }
  .fullWidth {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    height: 100%;
  }
</style>
