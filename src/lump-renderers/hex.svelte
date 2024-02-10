<script lang="ts">
  export let lump: Uint8Array;
  const rowSize = 16;

  let rows: Uint8Array[];
  $: {
    rows = [];
    for (let i = 0; i < lump.length; i += rowSize) {
      const row = new Uint8Array(rowSize);
      for (let j = 0; j < rowSize; j++) {
        row[j] = lump[i + j] ?? 0;
      }
      rows.push(row);
    }
  }

  function pad(n) {
    return n.length === 2 ? n : `0${n}`;
  }

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
      {#each rows as row, index}
        <tr>
          <td>{(index * rowSize).toString(16)}</td>
          {#each row as byte}
            <td class={byte === 0 ? 'dim' : ''}>{pad(byte.toString(16))}</td>
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
    border-spacing: .5rem 0;
  }
  table td {
    min-width: 2ex;
  }

  table td.dim {
    color: var(--red-30);
  }
</style>