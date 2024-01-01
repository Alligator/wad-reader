<script lang="ts">
  import Panel from "../components/panel.svelte";
  import type { Wad } from "../lib/wad-reader";
  import { readPalettes } from "../lib/read-palettes";

  export let lump: Uint8Array;
  export let wad: Wad;

  function readColormap() {
    const playpal = readPalettes(wad.readLump(wad.directory.find(d => d.name === 'PLAYPAL')));
    const palette = playpal[0];
    const colormaps = [];

    let i = 0;
    while (i < lump.length) {
      const colormap = [];
      const end = i + 256;
      for (; i < end; i++) {
        colormap.push(palette[lump[i]]);
      }
      colormaps.push(colormap);
    }

    return colormaps;
  }

  const colormaps = readColormap();
</script>

<div class="palettes">
  {#each colormaps as palette, i}
    <Panel title="colormap {i}">
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
