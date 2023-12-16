interface WadHeader {
  identification: string;
  numlumps: number;
  infotableofs: number;
}

interface WadDirEntry {
  filepos: number;
  size: number;
  name: string;
  markers: string[];
}

interface Wad {
  header: WadHeader;
  directory: WadDirEntry[];
}

class Wad {
  header: WadHeader;
  directory: WadDirEntry[];

  private data: Uint8Array;
  private index = 0;

  static from(data: ArrayBuffer): Wad {
    const wad = new Wad();
    wad.data = new Uint8Array(data);
    wad.readHeader();
    wad.readDirectory(wad.header.infotableofs);
    return wad;
  }

  readLump(dirEntry: WadDirEntry): Uint8Array {
    return this.data.subarray(dirEntry.filepos, dirEntry.filepos + dirEntry.size);
  }

  private readHeader() {
    this.header = {
      identification: this.readChars(4),
      numlumps: this.read32(),
      infotableofs: this.read32(),
    };
  }

  private readDirectory(infotableofs: number) {
    this.index = infotableofs;
    this.directory = [];
    let activeMarkers = [];
    while (!this.atEnd()) {
      const dirEntry = this.readDirectoryEntry();

      if (/[A-Z][A-Z]?_START/.test(dirEntry.name)) {
        activeMarkers.push(dirEntry.name.split('_')[0]);
      } else if (/[A-Z][A-Z]?_END/.test(dirEntry.name)) {
        const markerName = dirEntry.name.split('_')[0];
        activeMarkers = activeMarkers.filter(m => m !== markerName);
      }
      
      if (activeMarkers.length) {
        dirEntry.markers = [...activeMarkers];
      }

      this.directory.push(dirEntry);
    }
  }

  private readDirectoryEntry(): WadDirEntry {
    const filepos = this.read32();
    const size = this.read32();
    const name = this.readChars(8);
    return {
      filepos,
      size,
      name: name.replaceAll('\x00', ''),
      markers: [],
    };
  }

  private readChars(n: number): string {
    const chars = [];
    for (let i = 0; i < n; i++) {
      chars.push(this.readChar());
    }
    return chars.join('');
  }

  private readChar(): string {
    return String.fromCharCode(this.readByte());
  }

  private read32(): number {
    let num = 0;
    for (let i = 0; i < 4; i++) {
      num += this.readByte() << (i * 8);
    }
    return num;
  }

  private readByte(): number {
    if (this.atEnd()) {
      throw new Error(`unexpected eof at pos ${this.index}`);
    }
    return this.data[this.index++];
  }

  private atEnd() {
    return this.index >= this.data.length;
  }
}

export { Wad };
export type { WadHeader, WadDirEntry };