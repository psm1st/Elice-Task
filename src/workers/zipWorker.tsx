import JSZip from 'jszip';
import { ZipEntry } from '../types/parseZipFile';

self.onmessage = async (e: MessageEvent<File>) => {
  console.log('parsed:', e.data);
  const file = e.data;
  const zip = await JSZip.loadAsync(file);

  const entries: ZipEntry[] = [];

  for (const [name, entry] of Object.entries(zip.files)) {
    if (name.startsWith('__MACOSX/') || name.startsWith('._')) continue;

    const isDirectory = entry.dir;
    const content = isDirectory ? undefined : await entry.async('blob');

    entries.push({ name, isDirectory, content });
  }

  postMessage(entries);
};

export {};
