function readPalettes(lump: Uint8Array) {
  const palettes: string[][] = [];

  let offset = 0;
  while (offset < lump.length) {
    const palette: string[] = [];
    for (let i = 0; i <  256; i++) {
      const r = lump[offset + i * 3];
      const g = lump[offset + i * 3 + 1];
      const b = lump[offset + i * 3 + 2];
      const rgb = `rgb(${r}, ${g}, ${b})`;
      palette.push(rgb);
    }
    palettes.push(palette);
    offset += 768;
  }
  
  return palettes;
}

export { readPalettes };