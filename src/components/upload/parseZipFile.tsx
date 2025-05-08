export interface ZipEntry {
    name: string;
    isDirectory: boolean;
  }
  
  export async function parseZipFile(file: File): Promise<ZipEntry[]> {
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    const entries: ZipEntry[] = [];
  
    const textDecoder = new TextDecoder();
  
    let pos = 0;
    while (pos < bytes.length) {
      const sig = bytes.slice(pos, pos + 4);
      const sigStr = Array.from(sig).map((b) => b.toString(16).padStart(2, "0")).join("");

      if (sigStr !== "504b0304") break;
  
      const nameLen = bytes[pos + 26] | (bytes[pos + 27] << 8);
      const extraLen = bytes[pos + 28] | (bytes[pos + 29] << 8);
      const nameStart = pos + 30;
      const nameEnd = nameStart + nameLen;
  
      const name = textDecoder.decode(bytes.slice(nameStart, nameEnd));
      entries.push({
        name,
        isDirectory: name.endsWith("/"),
      });
  
      const compressedSize =
        bytes[pos + 18] |
        (bytes[pos + 19] << 8) |
        (bytes[pos + 20] << 16) |
        (bytes[pos + 21] << 24);
  
      pos = nameEnd + extraLen + compressedSize;
    }
  
    return entries;
  }
  