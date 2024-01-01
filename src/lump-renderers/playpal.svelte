<script lang="ts">
  import Panel from "../components/panel.svelte";
  import { readPalettes } from "../lib/read-palettes";

  export let lump: Uint8Array;

  const palettes = readPalettes(lump);
</script>

<div class="palettes">
  {#each palettes as palette, i}
    <Panel title="palette {i}">
      <div class="palette">
        {#each palette as colour}
          <span class="color" style="background-color: {colour}"></span>
        {/each}
      </div>
    </Panel>
  {/each}
</div>

<style>
  .palettes {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
  }
  .palette {
    display: grid;
    grid-template-columns: repeat(16, 16px);
  }
  .color {
    width: 16px;
    height: 16px;
  }
</style>
