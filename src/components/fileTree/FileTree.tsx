import styled from 'styled-components';
import fileIcon from '../../assets/file.png';
import docIcon from '../../assets/doc.png';
import { FileNode } from '../../types/FileNode';
import binaryIcon from '../../assets/image.png';

const FileTree = ({ nodes }: { nodes: FileNode[] }) => {
  const renderNode = (node: FileNode, depth = 0) => {
    const iconSrc = node.isDirectory ? fileIcon : node.isBinary ? binaryIcon : docIcon;

    return (
      <div key={node.name}>
        <Node $depth={depth}>
          <Icon src={iconSrc} alt="icon" />
          <span>{node.name}</span>
        </Node>
        {node.isDirectory && node.children && (
          <Children>{node.children.map(child => renderNode(child, depth + 1))}</Children>
        )}
      </div>
    );
  };

  return (
    <TreeContainer>
      <TreeHeader>
        <Icon src={fileIcon} alt="file" />
        File Tree
      </TreeHeader>
      <TreeBox>{nodes.map(node => renderNode(node))}</TreeBox>
    </TreeContainer>
  );
};

export default FileTree;

const TreeContainer = styled.div`
  margin-top: 24px;
`;

const TreeHeader = styled.div`
  display: flex;
  align-items: center;
  background-color: #f1e9ff;
  padding: 12px 20px;
  border-radius: 999px;
  font-weight: bold;
  gap: 10px;
  max-width: 340px;
`;

const TreeBox = styled.div`
  margin-top: 12px;
  flex-direction: column;
  border: 1px solid #e3d4ff;
  border-radius: 10px;
  height: 500px;
  padding: 16px;
  overflow-y: auto;
  max-width: 340px;
`;

const Node = styled.div<{ $depth: number }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding-left: ${({ $depth }) => $depth * 16}px;
  margin: 4px 0;
`;

const Children = styled.div`
  display: flex;
  flex-direction: column;
`;

const Icon = styled.img`
  width: 16px;
  height: 16px;
`;
