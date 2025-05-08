import styled from "styled-components";
import fileIcon from "../../assets/file.png"; 
import { FileNode } from "../../types/FileNode";
import docIcon from "../../assets/doc.png";

const FileTree = ({ nodes }: { nodes: FileNode[] }) => {
  const renderNode = (node: FileNode) => (
    <Node key={node.name}>
      <DocIcon src={docIcon} alt="file" />
      <span>{node.name}</span>
      {node.isDirectory && node.children && (
        <Children>{node.children.map(renderNode)}</Children>
      )}
    </Node>
  );

  return (
    <TreeContainer>
      <TreeHeader>
        <FileIcon src={fileIcon} alt="file" />
        File Tree
      </TreeHeader>
      <TreeBox>{nodes.map(renderNode)}</TreeBox>
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
  width: fit-content;
`;

const TreeBox = styled.div`
  margin-top: 12px;
  border: 1px solid #e3d4ff;
  border-radius: 10px;
  height: 500px;
  padding: 16px;
  overflow-y: auto;
`;

const Node = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding-left: 12px;
  margin: 6px 0;
`;

const Children = styled.div`
  padding-left: 16px;
`;

const FileIcon = styled.img`
  width: 16px;
  height: 16px;
`;

const DocIcon = styled.img`
  width: 16px;
  height: 16px;
`;
