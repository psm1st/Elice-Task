import { ZipEntry } from '../upload/parseZipFile';
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

      const existing = current.find(
        n => n.name === part && n.isDirectory === (!isLast ? true : isDirectory)
      );

      if (!existing) {
        const ext = isLast ? getExtension(part) : '';

        const newNode: FileNode = {
          name: part,
          isDirectory: isLast ? isDirectory : true,
          ...(isLast || isDirectory ? { children: [] } : {}),
          ...(isLast && !isDirectory
            ? {
                isBinary: binaryExtensions.includes(ext),
                isEditable: editableExtensions.includes(ext),
              }
            : {}),
        };

        current.push(newNode);

        if (newNode.isDirectory && newNode.children) {
          current = newNode.children;
        }
      } else {
        if (existing.isDirectory && existing.children) {
          current = existing.children;
        }
      }
    });
  });

  return root;
}
