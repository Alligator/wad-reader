function readSigned16(lump: Uint8Array, index: number) {
  const a = lump[index];
  const b = lump[index + 1];
  const sign = b & (1 << 7);
  let result = a + (b << 8);
  if (sign) {
    result = 0xFFFF0000 | result;
  }
  return result;
};

function readUnsigned16(lump: Uint8Array, index: number) {
  const a = lump[index];
  const b = lump[index + 1];
  return a + (b << 8);
};

function readUnsigned32(lump: Uint8Array, index: number) {
  const a = lump[index];
  const b = lump[index + 1];
  const c = lump[index + 2];
  const d = lump[index + 3];
  return a | (b << 8) | (c << 16) | (d << 24);
};

export { readSigned16, readUnsigned16, readUnsigned32 };