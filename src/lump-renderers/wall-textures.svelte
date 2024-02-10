<script lang="ts">
  import type { Wad, WadDirEntry } from "../lib/wad-reader";
  import { readPalettes } from "../lib/read-palettes";
  import Panel from "../components/panel.svelte";
  import { readPicture } from "../lib/read-picture";
  import { readUnsigned32 } from "../lib/lump-utils";

  export let lump: Uint8Array;
  export let wad: Wad;
  export let dirEntry: WadDirEntry;

  let canvas: HTMLCanvasElement;

  $: {
    // read pnames
    const pnames = wad.readLump(wad.directory.find(d => d.name === 'PNAMES'));
    const count = readUnsigned32(pnames, 0);
    const lumpNames = [];
    for (let i = 0; i < count; i++) {
      const index = 4 + i * 8;
      const lumpName = Array.from(pnames.slice(index, index + 8))
        .filter(c => c > 0)
        .map(c => String.fromCharCode(c))
        .join('');
      lumpNames.push(lumpName);
    }

    // read texture lump
    const numTextures = readUnsigned32(lump, 0);
    const offsets = [];
    for (let i = 0; i < numTextures; i++) {
      const index = 4 + i * 4;
      offsets.push(readUnsigned32(lump, index));
    }
    debugger;
  }

  // $: {
  //   if (canvas) {
  //     const pic = readPicture(lump);
  //     const playpal = readPalettes(wad.readLump(wad.directory.find(d => d.name === 'PLAYPAL')));
  //     const palette = playpal[0];

  //     const scale = 2;
  //     const ctx = canvas.getContext('2d');
  //     canvas.width = pic.width * scale;
  //     canvas.height = pic.height * scale;
  //     ctx.scale(scale, scale);

  //     for (let x = 0; x < pic.width; x++) {
  //       for (let y = 0; y < pic.height; y++) {
  //         const index = pic.columns[x][y];
  //         if (index !== null) {
  //           ctx.fillStyle = palette[index];
  //           ctx.fillRect(x, y, 1, 1);
  //         }
  //       }
  //     }
  //   }
  // }
</script>

<Panel title={dirEntry.name}>
  <canvas width="256" height="256" bind:this={canvas} />
</Panel>
