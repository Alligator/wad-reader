<script lang="ts">
  import type { Wad, WadDirEntry } from "../lib/wad-reader";
  import { readPalettes } from "../lib/read-palettes";
  import Panel from "../components/panel.svelte";

  export let lump: Uint8Array;
  export let wad: Wad;
  export let dirEntry: WadDirEntry;

  let canvas: HTMLCanvasElement;

  $: {
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(4, 4);

      const playpal = readPalettes(wad.readLump(wad.directory.find(d => d.name === 'PLAYPAL')));
      const palette = playpal[0];
      console.log(palette);

      for (let i = 0; i < lump.length; i++) {
        const x = i % 64;
        const y = Math.floor(i / 64);
        ctx.fillStyle = palette[lump[i]];
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }
</script>

<Panel title={dirEntry.name}>
  <canvas width="256" height="256" bind:this={canvas} />
</Panel>
