<script lang="ts">
    import Panel from "../components/panel.svelte";

  export let lump: Uint8Array;

  interface Cell {
    char: string;
    fg: string;
    bg: string;
    blink: boolean;
  }
  function readText(): Cell[] {
    const cells = [];
    
    // cp437 -> unicode for chars > 127
    const cp437 = 'ÇüéâäàåçêëèïîìÄÅÉæÆôöòûùÿÖÜ¢£¥₧ƒáíóúñÑªº¿⌐¬½¼¡«»░▒▓│┤╡╢╖╕╣║╗╝╜╛┐└┴┬├─┼╞╟╚╔╩╦╠═╬╧╨╤╥╙╘╒╓╫╪┘┌█▄▌▐▀αßΓπΣσµτΦΘΩδ∞φε∩≡±≥≤⌠⌡÷≈°∙·√ⁿ²■ ';
    const colourTable = [
      "#000000", // 0
      "#0000aa", // 1
      "#00aa00", // 2
      "#00aaaa", // 3
      "#aa0000", // 4
      "#aa00aa", // 5
      "#aaaa00", // 6
      "#aaaaaa", // 7
      "#555555", // 8
      "#0000ff", // 9
      "#00ff00", // f
      "#00ffff", // b
      "#ff0000", // c
      "#ff00ff", // d
      "#ffff00", // e
      "#ffffff", // f
    ];

    for (let i = 0; i < lump.length; i += 2) {
      if (i > 0 && i % 160 === 0) {
        cells.push({
          char: '\n',
          fg: colourTable[0],
          bg: colourTable[0],
          blink: false,
        });
      }

      let char = String.fromCharCode(lump[i]);
      if (lump[i] > 127) {
        char = cp437[lump[i] - 128];
      }
      const fgIndex = lump[i + 1] & 0b1111;
      let bgIndex = (lump[i + 1] & 0b1110000) >> 4;
      const blink = lump[i + 1] & 0b10000000;

      // if (char === '▀') {
      //   bgIndex = fgIndex;
      // }
      
      cells.push({
        char,
        fg: colourTable[fgIndex],
        bg: colourTable[bgIndex],
        blink: blink > 0,
      });
    }

    return cells;
  }

  let cells = readText();
</script>

<Panel title="ENDOOM">
  <div class="content">
    {#each cells as cell}
      <div style="color: {cell.fg}; background-color: {cell.bg}">{cell.char}</div>
    {/each}
  </div>
</Panel>
  
<style>
  .content {
    font-family: 'Fixedsys', monospace;
    font-size: 11pt;
    display: grid;
    grid-template-columns: repeat(81, 1.2ex);
  }
  .content > div {
    height: 1.25rem;
  }
</style>