import  { useState } from "react";
import styled from "styled-components";
import UploadButtons from "../components/upload/UploadButtons";
import UploadAreaModal from "../components/upload/uploadAreaModal";
import FileTree from "../components/fileTree/FileTree";
import { FileNode } from "../types/FileNode";
import { parseZipFile } from "../components/upload/parseZipFile"
import { buildTree } from "../components/fileTree/buildTree";

const MainPage = () => {
  const [tree, setTree] = useState<FileNode[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleUpload = async (file: File) => {
    const entries = await parseZipFile(file);
    const tree = buildTree(entries);
    setTree(tree);
  };

  return (
    <Container>
      <UploadButtons onUploadClick={() => setIsModalOpen(true)} />
      {isModalOpen && (
        <UploadAreaModal
          onUpload={handleUpload}
          onClose={() => setIsModalOpen(false)}
        />
      )}
      <FileTree nodes={tree} />
    </Container>
  );
};
export default MainPage;

const Container = styled.div`
  padding: 40px;
  font-family: sans-serif;
`;
