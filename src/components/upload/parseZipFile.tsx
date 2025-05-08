export interface ZipEntry {
    name: string;
    isDirectory: boolean;
  }
  
  export async function parseZipFile(file: File): Promise<ZipEntry[]> {
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    const decoder = new TextDecoder();
    const entries: ZipEntry[] = [];
  
    let pos = 0;
    while (pos < bytes.length) {
      const signature =
        bytes[pos] |
        (bytes[pos + 1] << 8) |
        (bytes[pos + 2] << 16) |
        (bytes[pos + 3] << 24);
  
      if (signature !== 0x04034b50) {
        pos += 1; 
        continue;
      }
  
      const nameLen = bytes[pos + 26] | (bytes[pos + 27] << 8);
      const extraLen = bytes[pos + 28] | (bytes[pos + 29] << 8);
      const compressedSize =
        bytes[pos + 18] |
        (bytes[pos + 19] << 8) |
        (bytes[pos + 20] << 16) |
        (bytes[pos + 21] << 24);
  
      const nameStart = pos + 30;
      const nameEnd = nameStart + nameLen;
      const name = decoder.decode(bytes.slice(nameStart, nameEnd));
  
      entries.push({
        name,
        isDirectory: name.endsWith("/"),
      });
      pos = nameEnd + extraLen + compressedSize;
    }
  
    return entries;
  }
  