<script lang="ts">
  import type { Wad, WadDirEntry } from "../lib/wad-reader";
  import Panel from "../components/panel.svelte";

  export let lump: Uint8Array;
  export let wad: Wad;
  export let dirEntry: WadDirEntry;

  interface LineDef {
    startVertex: number;
    endVertex: number;
    flags: number;
    special: number;
    sectorTag: number;
    frontSidedef: number;
    backSidedef: number;
  }

  interface Vert {
    x: number;
    y: number;
  }

  let canvas: HTMLCanvasElement;

  function read16(lump: Uint8Array, index: number) {
    // const a = lump[index];
    // const b = lump[index + 1];
    // return a + (b << 8);
    const a = lump[index];
    const b = lump[index + 1];
    const sign = b & (1 << 7);
    let result = a + (b << 8);
    if (sign) {
      result = 0xFFFF0000 | result;
    }
    return result;
  };

  $: {
    if (canvas) {
      // lump order:
      //  1. things
      //  2. linedefs
      //  3. sidedefs
      //  4. vertexes
      //  5. segs
      //  6. ssectors
      //  7. nodes
      //  8. sectors
      //  9. reject
      // 10. blockmap
      // 11. behavior

      const mapIndex = wad.directory.findIndex(l => l.filepos === dirEntry.filepos && l.name === dirEntry.name);

      const thingLump = wad.readLump(wad.directory[mapIndex + 1]);
      const things = [];
      for (let i = 0; i < thingLump.length; i += 10) {
        things.push({
          x: read16(thingLump, i),
          y: read16(thingLump, i + 2),
        });
      }

      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;
      for (const thing of things) {
        if (thing.x < minX) minX = thing.x;
        if (thing.y < minY) minY = thing.y;
        if (thing.x > maxX) maxX = thing.x;
        if (thing.y > maxY) maxY = thing.y;
      }

      function scale(vert: Vert): Vert {
        return {
          x: ((vert.x - minX) / (maxX - minX)) * 256,
          y: ((vert.y - minY) / (maxY - minY)) * 256,
        };
      }

      const ctx = canvas.getContext('2d');

      ctx.strokeStyle = 'white';
      ctx.fillStyle = 'white';
      ctx.lineWidth = 1;
      for (const thing of things) {
        const t = scale(thing);
        console.log(t);
        ctx.fillRect(t.x, t.y, 1, 1);
        // ctx.beginPath();
        // ctx.moveTo(start.x, start.y);
        // ctx.lineTo(end.x, end.y);
        // ctx.stroke();
        // ctx.closePath();
      }

      /*
      // read linedefs
      const linedefs: LineDef[] = [];
      const linedefLump = wad.readLump(wad.directory[mapIndex + 2]);
      for (let i = 0; i < linedefLump.length; i += 14) {
        linedefs.push({
          startVertex: read16(linedefLump, i),
          endVertex: read16(linedefLump, i + 2),
          flags: read16(linedefLump, i + 4),
          special: read16(linedefLump, i + 6),
          sectorTag: read16(linedefLump, i + 8),
          frontSidedef: read16(linedefLump, i + 10),
          backSidedef: read16(linedefLump, i + 12),
        });
      }

      // read "vertexes"
      const verts: Vert[] = [];
      const vertLump = wad.readLump(wad.directory[mapIndex + 4]);
      for (let i = 0; i < vertLump.length; i += 2) {
        verts.push({
          x: read16(vertLump, i),
          y: read16(vertLump, i + 2),
        });
      }

      // find the bounds of the map
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;
      for (const vert of verts) {
        if (vert.x < minX) minX = vert.x;
        if (vert.y < minY) minY = vert.y;
        if (vert.x > maxX) maxX = vert.x;
        if (vert.y > maxY) maxY = vert.y;
      }

      function scale(vert: Vert): Vert {
        return {
          x: ((vert.x - minX) / (maxX - minX)) * 256,
          y: ((vert.y - minY) / (maxY - minY)) * 256,
        };
      }

      const ctx = canvas.getContext('2d');

      ctx.strokeStyle = 'white';
      ctx.fillStyle = 'white';
      ctx.lineWidth = 1;
      for (const lindef of linedefs) {
        const start = scale(verts[lindef.startVertex]);
        const end = scale(verts[lindef.endVertex]);
        ctx.fillRect(start.x, start.y, 1, 1);
        ctx.fillRect(end.x, end.y, 1, 1);
        // ctx.beginPath();
        // ctx.moveTo(start.x, start.y);
        // ctx.lineTo(end.x, end.y);
        // ctx.stroke();
        // ctx.closePath();
      }
    */
    }
  }
</script>

<Panel title={dirEntry.name}>
  <canvas width="256" height="256" bind:this={canvas} />
</Panel>
