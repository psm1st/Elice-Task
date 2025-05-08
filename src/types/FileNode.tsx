export interface FileNode {
  name: string;
  isDirectory: boolean;
  children?: FileNode[];
  isBinary?: boolean;
  isEditable?: boolean;
}
