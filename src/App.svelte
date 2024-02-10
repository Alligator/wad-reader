<script lang="ts">
  import type { ComponentType, SvelteComponent } from "svelte";
  import { Wad, type WadDirEntry } from "./lib/wad-reader";
  import Playpal from "./lump-renderers/playpal.svelte";
  import Endoom from "./lump-renderers/endoom.svelte";
  import DigitalSound from "./lump-renderers/digital-sound.svelte";
  import Hex from "./lump-renderers/hex.svelte";
  import Flat from "./lump-renderers/flat.svelte";
  import Colormap from "./lump-renderers/colormap.svelte";
  import MapSvg from './lump-renderers/map-svg.svelte';
  import Picture from "./lump-renderers/picture.svelte";
  import WallTextures from "./lump-renderers/wall-textures.svelte";

  const icons = {
    palette: '🎨',
    colormap: '🌈',
    digitalSound: '🔊',
    pcSpeakerSound: '🔉',
    endoom: '🖵',
    map: '🗺️',
    flat: '🧱',
    sprite: '🧍',
    patch: '🚧',
    wallTexture: '?',
  };

  let wad: Wad | null = null;

  let selectedLump: WadDirEntry = null;
  let lumpRenderer: ComponentType<SvelteComponent> = null;
  let lumpData: Uint8Array = null;
  let fileName: string;

  function readWad(
    event: Event & { currentTarget: EventTarget & HTMLInputElement }
  ) {
    const file = event.currentTarget.files[0];
    fileName = file.name;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const data = ev.target.result as ArrayBuffer;
      wad = Wad.from(data);
      console.log(wad);
    };
    reader.readAsArrayBuffer(file);
  }

  function selectLump(lump: WadDirEntry) {
    selectedLump = lump;
  }

  $: {
    if (wad && selectedLump) {
      lumpData = wad.readLump(selectedLump);
      switch (selectedLump.name) {
        case "PLAYPAL":
          lumpRenderer = Playpal;
          break;
        case 'COLORMAP':
          lumpRenderer = Colormap;
          break;
        case "ENDOOM":
          lumpRenderer = Endoom;
          break;
        default:
          lumpRenderer = Hex;
          break;
      }

      if (selectedLump.name.startsWith("DS") || selectedLump.name.startsWith('DP')) {
        lumpRenderer = DigitalSound;
      } else if (selectedLump.markers.includes('F')) {
        lumpRenderer = Flat;
      } else if (selectedLump.markers.includes('S') || selectedLump.markers.includes('P')) {
        lumpRenderer = Picture;
      } else if (/E\dM\d/.test(selectedLump.name) || /MAP\d\d/.test(selectedLump.name)) {
        lumpRenderer = MapSvg;
      } else if (/TEXTURE\d+/.test(selectedLump.name)) {
        lumpRenderer = WallTextures;
      }
    }
  }

  function getIcon(dirEntry: WadDirEntry) {
    const { name } = dirEntry;
    if (name.startsWith('DS')) {
      return icons.digitalSound;
    }

    if (name.startsWith('DP')) {
      return icons.pcSpeakerSound;
    }

    if (/TEXTURE\d+/.test(name)) {
      return icons.wallTexture;
    }

    if (dirEntry.markers.includes('F')) {
      return icons.flat;
    }

    if (dirEntry.markers.includes('S')) {
      return icons.sprite;
    }

    if (dirEntry.markers.includes('P')) {
      return icons.patch;
    }

    if (/^E\dM\d/.test(name) || /^MAP\d\d/.test(name)) {
      return icons.map;
    }

    switch (name) {
      case 'PLAYPAL':
        return icons.palette;
      case 'ENDOOM':
        return icons.endoom;
      case 'COLORMAP':
        return icons.colormap;
    }

    return '';
  }

  // filtering
  let typeFilter: string = null;
  let textFilter: string = null;

  let filteredLumps: WadDirEntry[];
  $: if (wad) {
    // type filtering
    let lumps = wad.directory;
    if (typeFilter) {
      lumps = lumps.filter((dirEntry) => getIcon(dirEntry) === typeFilter);
    }

    // text filtering
    if (textFilter) {
      lumps = lumps.filter((dirEntry) => dirEntry.name.toUpperCase().includes(textFilter.toUpperCase()));
    }

    filteredLumps = lumps;
  }
</script>

<main>
  {#if wad == null}
    <div class="file-upload">
      Upload your WAD below
      <input type="file" id="wad" accept=".wad" on:change={readWad} />
    </div>
  {:else}
    <div class="layout">
      <div class="sidenav">
        <header>
          alligator's wad reader
          <div class="subtitle">
            viewing {fileName} <button on:click={() => wad = null}>close</button>
          </div>
        </header>
        <div class="filter-controls">
          <select bind:value={typeFilter}>
            <option value="">(all)</option>
            <option value="{icons.palette}">{icons.palette} playpal</option>
            <option value="{icons.colormap}">{icons.colormap} colormap</option>
            <option value="{icons.digitalSound}">{icons.digitalSound} sounds (digital)</option>
            <option value="{icons.pcSpeakerSound}">{icons.pcSpeakerSound}sounds (pc speaker)</option>
            <option value="{icons.endoom}">{icons.endoom} endoom</option>
            <option value="{icons.map}">{icons.map}️ map</option>
            <option value="{icons.flat}">{icons.flat} flat</option>
            <option value="{icons.sprite}">{icons.sprite} sprite</option>
            <option value="{icons.patch}">{icons.patch} patch</option>
            <option value="{icons.wallTexture}">{icons.wallTexture} wall texture</option>
          </select>
          <input type="text" bind:value={textFilter} placeholder="search" />
        </div>
        <div class="lumps">
          {#each filteredLumps as lump}
            <button
              class="lump"
              class:selected={lump.filepos === selectedLump?.filepos && lump.name === selectedLump?.name}
              on:click={() => selectLump(lump)}
            >
              <div>{getIcon(lump)}</div>
              <div>{lump.name}</div>
              <div class="sm">{(lump.size / 1024).toFixed(2)} Kb</div>
            </button>
          {/each}
        </div>
      </div>
      <div class="lump-viewer">
        <div class="lump-content">
          {#if lumpRenderer}
            {#key selectedLump.filepos}
              <svelte:component this={lumpRenderer} lump={lumpData} {wad} dirEntry={selectedLump} />
            {/key}
          {/if}
        </div>
      </div>
    </div>
  {/if}
</main>

<style>
  .file-upload {
    width: 100vw;
    height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: .5rem;
  }

  .file-upload > input{
    padding: .5rem;
  }

  .layout {
    display: flex;
    height: 100vh;
    margin: 0;
    padding: 0 1rem;
    box-sizing: border-box;
    gap: 1rem;
    /* overflow-y: hidden */
  }

  header {
    padding: 1rem 0;
  }
  header > .subtitle {
    font-size: 8pt;
  }

  .sidenav {
    display: flex;
    flex-direction: column;
  }

  .filter-controls {
    display: flex;
    flex-direction: column;
    gap: .5rem;
    padding-bottom: .5rem;
  }

  .lumps {
    width: 34ex;
    max-height: 100%;
    overflow-y: auto;
  }

  .lump {
    /* button reset */
    background-color: inherit;
    color: inherit;
    border: none;
    display: block;
    text-align: left;
    font-family: inherit;
    font-size: inherit;

    display: grid;
    grid-template-columns: 2rem 2fr 1fr;
    align-items: baseline;
    width: 100%;
    cursor: pointer;
    border-radius: 4px;
    margin: .25rem 0;
  }

  .lump:nth-child(even) {
    background-color: var(--red-70);
  }

  .lump.selected {
    background-color: var(--red-60);
  }

  .lump-viewer {
    overflow-y: auto;
    width: 100%;
    height: 100%;
    padding: 1rem;
    box-sizing: border-box;
  }

  .lump-content {
    display: flex;
    align-items: flex-start;
    height: 100%;
  }
</style>
