import { readSigned16, readUnsigned16, readUnsigned32 } from "./lump-utils";

interface Picture {
  width: number;
  height: number;
  columns: number[]; // null means transparent
}

function readPicture(lump: Uint8Array): Picture {
  let index = 0;

  const pic = {
    width: readUnsigned16(lump, index),
    height: readUnsigned16(lump, index + 2),
    leftOffset: readSigned16(lump, index + 4),
    topOffset: readSigned16(lump, index + 6),
  };
  index += 8;

  const columnofs = [];
  for (let i = 0; i < 4 * pic.width; i += 4) {
    columnofs.push(readUnsigned32(lump, index));
    index += 4;
  }

  const columns = [];
  for (const column of columnofs) {
    const pixels = new Array(pic.height).fill(null);
    let columnDone = false;
    let columnIndex = column;
    while (!columnDone) {
      const topDelta = lump[columnIndex];
      if (topDelta === 0xFF) {
        columnDone = true;
        continue;
      }
      columnIndex++;

      const length = lump[columnIndex];
      columnIndex += 2; // skip unused byte

      for (let i = 0; i < length; i++) {
        pixels[topDelta + i] = lump[columnIndex++];
      }
      columnIndex++; // skip unused byte
    }
    columns.push(pixels);
  }

  return {
    width: pic.width,
    height: pic.height,
    columns,
  };
}

export { readPicture };