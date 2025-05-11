import { ZipEntry } from '../../types/parseZipFile';
import { FileNode } from '../../types/FileNode';

const binaryExtensions = [
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.pdf',
  '.exe',
  '.zip',
  '.ico',
  '.woff',
  '.ttf',
  '.mp3',
  '.mp4',
  '.webm',
];

const editableExtensions = [
  '.js',
  '.ts',
  '.tsx',
  '.jsx',
  '.json',
  '.html',
  '.css',
  '.md',
  '.txt',
  '.java',
  '.py',
  '.c',
  '.cpp',
  '.sh',
  '.yaml',
  '.yml',
];

function getExtension(name: string): string {
  const lastDot = name.lastIndexOf('.');
  return lastDot !== -1 ? name.slice(lastDot).toLowerCase() : '';
}

export function buildTree(entries: ZipEntry[]): FileNode[] {
  const root: FileNode[] = [];

  entries.forEach(({ name, isDirectory }) => {
    const parts = name.split('/').filter(Boolean);
    let current = root;

    parts.forEach((part, idx) => {
      const isLast = idx === parts.length - 1;
      const path = parts.slice(0, idx + 1).join('/');

      let existing = current.find(n => n.name === part);
      if (!existing) {
        const ext = isLast ? getExtension(part) : '';
        const newNode: FileNode = {
          name: part,
          isDirectory: !isLast || isDirectory,
          path,
          ...(isLast && !isDirectory
            ? {
                isBinary: binaryExtensions.includes(ext),
                isEditable: editableExtensions.includes(ext),
              }
            : {}),
          ...(isLast || isDirectory ? { children: [] } : {}),
        };
        current.push(newNode);
        existing = newNode;
      }

      if (existing.isDirectory && existing.children) {
        current = existing.children;
      }
    });
  });

  return root;
}
