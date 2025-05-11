import JSZip from 'jszip';

export interface ZipEntry {
  name: string;
  isDirectory: boolean;
  content?: Blob;
}

export async function parseZipFile(file: File): Promise<ZipEntry[]> {
  const zip = await JSZip.loadAsync(file);
  const entries: ZipEntry[] = [];

  for (const [relativePath, zipEntry] of Object.entries(zip.files)) {
    const isDirectory = zipEntry.dir;
    const content = isDirectory ? undefined : await zipEntry.async('blob');
    entries.push({
      name: relativePath,
      isDirectory,
      content,
    });
  }

  const filtered = entries.filter(e => !e.name.startsWith('__MACOSX/') && !e.name.startsWith('._'));
  return filtered;
}
