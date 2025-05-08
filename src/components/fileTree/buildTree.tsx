import { ZipEntry } from "../upload/parseZipFile";
import { FileNode } from "../../types/FileNode";

export function buildTree(entries: ZipEntry[]): FileNode[] {
  const root: FileNode[] = [];

  entries.forEach(({ name, isDirectory }) => {
    const parts = name.split("/").filter(Boolean);
    let current = root;

    parts.forEach((part, idx) => {
      const isLast = idx === parts.length - 1;
      let node = current.find((n) => n.name === part);

      if (!node) {
        node = {
          name: part,
          isDirectory: isLast ? isDirectory : true,
          ...(isLast || isDirectory ? { children: [] } : {}),
        };
        current.push(node);
      }

      if (node.isDirectory && node.children) {
        current = node.children;
      }
    });
  });

  return root;
}
