<script lang="ts">
  import type { ComponentType, SvelteComponent } from "svelte";
  import { Wad, type WadDirEntry } from "./lib/wad-reader";
  import Playpal from "./lump-renderers/playpal.svelte";
  import Endoom from "./lump-renderers/endoom.svelte";
  import DigitalSound from "./lump-renderers/digital-sound.svelte";
  import Hex from "./lump-renderers/hex.svelte";
  import Flat from "./lump-renderers/flat.svelte";
  import Colormap from "./lump-renderers/colormap.svelte";
    import Map from './lump-renderers/map.svelte';

  let wad: Wad | null = null;

  let selectedLump: WadDirEntry = null;
  let lumpRenderer: ComponentType<SvelteComponent> = null;
  let lumpData: Uint8Array = null;

  function readWad(
    event: Event & { currentTarget: EventTarget & HTMLInputElement }
  ) {
    const file = event.currentTarget.files[0];
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
      }
      
      if (selectedLump.markers.includes('F')) {
        lumpRenderer = Flat;
      }

      if (/E\dM\d/.test(selectedLump.name) || /MAP\d\d/.test(selectedLump.name)) {
        lumpRenderer = Map;
      }
    }
  }

  function getIcon(dirEntry: WadDirEntry) {
    const { name } = dirEntry;
    if (name.startsWith('DS')) {
      return '🔊';
    }

    if (name.startsWith('DP')) {
      return '🔉';
    }

    if (dirEntry.markers.includes('F')) {
      return '🧱';
    }

    if (/E\dM\d/.test(name) || /MAP\d\d/.test(name)) {
      return '🗺️';
    }

    switch (name) {
      case 'PLAYPAL':
        return '🎨';
      case 'ENDOOM':
        return '🖵';
      case 'COLORMAP':
        return '🌈';
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
        <h2>lumps</h2>
        <div class="filter-controls">
          <select bind:value={typeFilter}>
            <option value="">(all)</option>
            <option value="🎨">🎨 playpal</option>
            <option value="🌈">🌈 colormap</option>
            <option value="🔊">🔊 sounds (digital)</option>
            <option value="🔉">🔉sounds (pc speaker)</option>
            <option value="🖵">🖵 endoom</option>
            <option value="🧱">🧱 flat</option>
            <option value="🗺️">🗺️ map</option>
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
        <h2>lump viewer</h2>
        <div class="lump-content">
          {#if lumpRenderer}
            <svelte:component this={lumpRenderer} lump={lumpData} {wad} dirEntry={selectedLump} />
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
    border: 1px solid #aaa;
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

  .sidenav {
    display: flex;
    flex-direction: column;
  }

  .filter-controls {
    display: flex;
    flex-direction: column;
    gap: .5rem;
    padding: .5rem 0;
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
    border-bottom: 1px solid #555;
    align-items: baseline;
    width: 100%;
    cursor: pointer;
  }

  .lump.selected {
    background-color: rgba(255, 255, 255, 0.1);
  }

  .lump-viewer {
    overflow-y: auto;
    width: 100%;
  }

  .lump-content {
    display: flex;
  }
</style>
