<script lang="ts">
  import type { Wad, WadDirEntry } from "../lib/wad-reader";
  import Panel from "../components/panel.svelte";
    import { ThingType } from "../lib/things";
    import { readSigned16 } from "../lib/lump-utils";
    import { onMount } from "svelte";

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

  function scale(vert: Vert, range: number, scale: number): Vert {
    return {
      x: ((vert.x - minX) / range) * scale,
      y: ((vert.y - minY) / range) * scale,
    };
  }

  let svgPaths: string[] = [];
  let svg: SVGElement;
  let svgWidth: number;
  let svgHeight: number;

  $: {
    if (svg) {
      const svgSize = svg.getBoundingClientRect();
      svgWidth = svgSize.width;
      svgHeight = svgSize.height;
      const longestSide = Math.min(svgWidth, svgHeight);
      const range = Math.max(maxX - minX, maxY - minY);
      const newPaths = [];
      for (const lindef of linedefs) {
        const start = scale(verts[lindef.startVertex], range, longestSide);
        const end = scale(verts[lindef.endVertex], range, longestSide);
        newPaths.push(`M ${start.x} ${start.y} L ${end.x} ${end.y}`);
      }
      svgPaths = newPaths;
    }
  }

  let pointerDown = false;
  let pointerStart: Vert = { x: 0, y: 0 };
  let startViewBox: Vert = null;
  let viewBox: Vert = { x: 0, y: 0 };
  let viewBoxInit = true;

  let zoom = 1;
  function onWheel(evt: WheelEvent) {
    zoom -= evt.deltaY * 0.001 * (zoom / 2);
    zoom = Math.min(Math.max(0.5, zoom), 8);
  }

  let viewBoxAttr: string;
  $: {
    if (viewBoxInit && svg) {
      viewBox = { x: svgWidth/2, y: svgHeight/2 };
      viewBoxInit = false;
    }
    const newWidth = svgWidth / zoom;
    const newHeight = svgHeight / zoom;
    viewBoxAttr = `${viewBox.x - newHeight/2} ${viewBox.y - newWidth/2} ${newWidth} ${newHeight}`;
  }

  function onPointerDown(evt: PointerEvent) {
    pointerDown = true;
    pointerStart = {
      x: evt.clientX,
      y: evt.clientY,
    };
    startViewBox = { ...viewBox };
  }

  function onPointerMove(evt: PointerEvent) {
    if (!pointerDown) {
      return;
    }

    viewBox = {
      x: startViewBox.x - (evt.clientX - pointerStart.x),
      y: startViewBox.y - (evt.clientY - pointerStart.y),
    };
  }

  function onPointerUp(evt: PointerEvent) {
    pointerDown = false;
  }
</script>

<Panel title={dirEntry.name} fullWidth>
  {#if error}
    <div>{error}</div>
  {:else}
    <svg
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
      viewBox={viewBoxAttr}
      bind:this={svg}
      on:pointerdown={onPointerDown}
      on:pointermove={onPointerMove}
      on:pointerup={onPointerUp}
      on:wheel={onWheel}
    >
      {#each svgPaths as path}
        <path d="{path}"></path>
      {/each}
    </svg>
  {/if}
</Panel>

<style>
  svg {
    background-color: var(--red-90);
    flex: 1;
  }
  svg path {
    stroke: var(--red-10);
    stroke-width: 1.5;
  }
</style>