<script lang="ts">
  import type { Wad, WadDirEntry } from "../lib/wad-reader";
  import { readPalettes } from "../lib/read-palettes";
  import Panel from "../components/panel.svelte";
    import { readPicture } from "../lib/read-picture";

  export let lump: Uint8Array;
  export let wad: Wad;
  export let dirEntry: WadDirEntry;

  let canvas: HTMLCanvasElement;

  $: {
    if (canvas) {
      const pic = readPicture(lump);
      const playpal = readPalettes(wad.readLump(wad.directory.find(d => d.name === 'PLAYPAL')));
      const palette = playpal[0];

      const scale = 2;
      const ctx = canvas.getContext('2d');
      canvas.width = pic.width * scale;
      canvas.height = pic.height * scale;
      ctx.scale(scale, scale);

      for (let x = 0; x < pic.width; x++) {
        for (let y = 0; y < pic.height; y++) {
          const index = pic.columns[x][y];
          if (index !== null) {
            ctx.fillStyle = palette[index];
            ctx.fillRect(x, y, 1, 1);
          }
        }
      }
    }
  }
</script>

<Panel title={dirEntry.name}>
  <canvas width="256" height="256" bind:this={canvas} />
</Panel>
