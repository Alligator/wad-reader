<script lang="ts">
  import type { Wad, WadDirEntry } from "../lib/wad-reader";
  import Panel from "../components/panel.svelte";
    import { ThingType } from "../lib/things";
    import { readSigned16 } from "../lib/lump-utils";

  export let lump: Uint8Array;
  export let wad: Wad;
  export let dirEntry: WadDirEntry;

  interface Thing {
    x: number;
    y: number;
    angle: number;
    type: number;
    flags: number;
  }

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

  const colours = {
    'red-5':  '#f8eff1',
    'red-10': '#f3e1e4',
    'red-20': '#ecbec6',
    'red-30': '#e09aa6',
    'red-40': '#e16b80',
    'red-50': '#cd425b',
    'red-60': '#9e394b',
    'red-70': '#68363f',
    'red-80': '#40282c',
    'red-90': '#1e1517'
  }

  let canvas: HTMLCanvasElement;
  let error: string = null;

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  let things: Thing[] = [];
  let linedefs: LineDef[] = [];
  let verts: Vert[] = [];
  $: {
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

    // read things
    const thingLump = wad.readLump(wad.directory[mapIndex + 1]);
    things = [];
    for (let i = 0; i < thingLump.length; i += 10) {
      things.push({
        x: readSigned16(thingLump, i),
        y: readSigned16(thingLump, i + 2) * -1,
        angle: readSigned16(thingLump, i + 4),
        type: readSigned16(thingLump, i + 6),
        flags: readSigned16(thingLump, i + 8),
      });
    }

    // read linedefs
    const linedefLump = wad.readLump(wad.directory[mapIndex + 2]);
    linedefs = [];
    for (let i = 0; i < linedefLump.length; i += 14) {
      linedefs.push({
        startVertex: readSigned16(linedefLump, i),
        endVertex: readSigned16(linedefLump, i + 2),
        flags: readSigned16(linedefLump, i + 4),
        special: readSigned16(linedefLump, i + 6),
        sectorTag: readSigned16(linedefLump, i + 8),
        frontSidedef: readSigned16(linedefLump, i + 10),
        backSidedef: readSigned16(linedefLump, i + 12),
      });
    }

    // read "vertexes"
    const vertLump = wad.readLump(wad.directory[mapIndex + 4]);
    verts = [];
    for (let i = 0; i < vertLump.length; i += 4) {
      verts.push({
        x: readSigned16(vertLump, i),
        y: readSigned16(vertLump, i + 2) * -1,
      });
    }

    // find the bounds of the map
    minX = Infinity;
    minY = Infinity;
    maxX = -Infinity;
    maxY = -Infinity;
    for (const vert of verts) {
      if (vert.x < minX) minX = vert.x;
      if (vert.y < minY) minY = vert.y;
      if (vert.x > maxX) maxX = vert.x;
      if (vert.y > maxY) maxY = vert.y;
    }
  }

  $: {
    if (canvas) {
      try {
        error = null;
        const canvasSize = canvas.getBoundingClientRect();
        const canvasWidth = canvas.width = canvasSize.width;
        const canvasHeight = canvas.height = canvasSize.height;
        canvas.height = canvasHeight;
        console.log(canvasWidth, canvasHeight);

        const margin = 10;
        const scaleFactor = Math.min(canvasWidth, canvasHeight) - (margin * 2);
        const range = Math.max(maxX - minX, maxY - minY);

        function scale(vert: Vert): Vert {
          return {
            x: ((vert.x - minX) / range) * scaleFactor,
            y: ((vert.y - minY) / range) * scaleFactor,
          };
        }

        const ctx = canvas.getContext('2d');
        ctx.resetTransform();
        ctx.fillStyle = colours['red-90'];
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        // zoom in on the center
        ctx.translate(canvasWidth/2, canvasHeight/2);
        ctx.scale(zoom, zoom)
        ctx.translate(-canvasWidth/2, -canvasHeight/2);
        ctx.translate(offset.x, offset.y);

        ctx.strokeStyle = colours['red-10'];
        ctx.lineWidth = 1.5/zoom;
        for (const lindef of linedefs) {
          const start = scale(verts[lindef.startVertex]);
          const end = scale(verts[lindef.endVertex]);
          ctx.beginPath();
          ctx.moveTo(start.x, start.y);
          ctx.lineTo(end.x, end.y);
          ctx.stroke();
        }

        ctx.closePath();
        const monsterTypes = [68, 64, 3003, 3005, 72, 16, 3002, 65, 69, 3001, 3006, 67, 71, 66, 9, 58, 7, 84, 3004];
        
        for (const thing of things) {
          let fillStyle: string;
          let strokeStyle: string;
          let square = false;

          if (thing.type === 1) {
            // player 1 start
            fillStyle = '#3ca370';
            strokeStyle = '#8fde5d';
          } else if (monsterTypes.includes(thing.type)) {
            fillStyle = colours['red-50'];
            strokeStyle = colours['red-40'];
          } else if (thing.type === ThingType.RedKeycard || thing.type === ThingType.RedSkullKey) {
            fillStyle = '#fa305c';
            strokeStyle= '#ff766b';
            square = true;
          } else if (thing.type === ThingType.BlueKeycard || thing.type === ThingType.BlueSkullKey) {
            fillStyle = '#4b5bab';
            strokeStyle= '#4da6ff';
            square = true;
          } else if (thing.type === ThingType.YellowKeycard || thing.type === ThingType.YellowSkullKey) {
            fillStyle = '#f2a65e';
            strokeStyle= '#ffe478';
            square = true;
          }

          const size = 8 / zoom;
          if (fillStyle) {
            const coords = scale({ x: thing.x, y: thing.y });
            ctx.fillStyle = fillStyle;
            ctx.strokeStyle = strokeStyle;

            ctx.beginPath();
            if (square) {
              ctx.rect(coords.x - (size/2), coords.y - (size/2), size, size);
            } else {
              ctx.arc(coords.x, coords.y, size/2, 0, Math.PI * 2);
            }
            ctx.fill();
            ctx.stroke();
          }
        }
      } catch (e: any) {
        error = e.message;
        console.error(e);
      }
    }
  }

  let zoom = 1;
  let mouse: Vert = { x: 0, y: 0 };
  let dragStart: Vert = null;

  let dragOffset: Vert = { x: 0, y: 0 };
  let offset: Vert = { x: 0, y: 0 };

  function onWheel(evt: WheelEvent) {
    zoom -= evt.deltaY * 0.001 * (zoom / 2);
    zoom = Math.min(Math.max(0.5, zoom), 8);
  }

  function onMouseMove(evt: MouseEvent) {
    const rect = (evt.target as Element).getBoundingClientRect();
    mouse.x = evt.pageX - rect.left;
    mouse.y = evt.pageY - rect.top;
    if (dragStart) {
      offset.x = dragOffset.x + (mouse.x - dragStart.x) / zoom;
      offset.y = dragOffset.y + (mouse.y - dragStart.y) / zoom;
    }
  }

  function onMouseDown(evt: MouseEvent) {
    const rect = (evt.target as Element).getBoundingClientRect();
    dragStart = {
      x: evt.pageX - rect.left,
      y: evt.pageY - rect.top,
    };
    dragOffset = { ...offset };
  }

  function onMouseUp() {
    dragStart = null;
  }
</script>

<Panel title={dirEntry.name} fullWidth>
  {#if error}
    <div>{error}</div>
  {:else}
    <canvas
      bind:this={canvas}
      on:wheel={onWheel}
      on:mousemove={onMouseMove}
      on:mousedown={onMouseDown}
      on:mouseup={onMouseUp}
    />
  {/if}
</Panel>

<style>
  canvas {
    flex: 1;
    /* width: 100%;
    height: 100%; */
  }
</style>