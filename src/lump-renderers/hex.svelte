<script lang="ts">
  export let lump: Uint8Array;
  const rowSize = 16;
  let rowIndices: number[];
  $: rowIndices = new Array(Math.ceil(lump.length / rowSize)).fill(0).map((_, idx) => idx * rowSize);

  function isPrintable(char: string) {
    return !(/[\x00-\x1F\x80-\xFF]/.test(char));
  }
</script>

<div>
  <table>
    <thead>
      <tr>
        <th>offset</th>
        <th colspan="{rowSize}">data</th>
        <th>text</th>
    </thead>
    <tbody>
      {#each rowIndices as index}
        <tr>
          <td>{index.toString(16)}</td>
          {#each lump.slice(index, index + rowSize) as byte}
            <td>{byte.toString(16)}</td>
          {/each}
          <td>
            {Array.from(lump.slice(index, index + rowSize)).map(c => {
              const char = String.fromCharCode(c);
              return isPrintable(char) ? char : '.';
            }).join('')}
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>
  
<style>
  table {
    font-family: monospace;
  }
  table tr > td:first-child {
    border-right: 1px solid #555;
  }
  table tr > td:last-child {
    border-left: 1px solid #555;
  }
</style>