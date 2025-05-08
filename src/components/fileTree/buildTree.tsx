import { ZipEntry } from "../upload/parseZipFile";
import { FileNode } from "../../types/FileNode";

export function buildTree(entries: ZipEntry[]): FileNode[] {
  const root: FileNode[] = [];

  entries.forEach(({ name, isDirectory }) => {
    const parts = name.split("/").filter(Boolean);
    let current = root;

    parts.forEach((part, idx) => {
      const isLast = idx === parts.length - 1;
      const existing = current.find((n) => n.name === part && n.isDirectory === (!isLast ? true : isDirectory));

      if (!existing) {
        const newNode: FileNode = {
          name: part,
          isDirectory: isLast ? isDirectory : true,
          ...(isLast || isDirectory ? { children: [] } : {}),
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
