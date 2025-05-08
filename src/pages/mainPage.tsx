import { useState } from 'react';
import styled from 'styled-components';
import UploadButtons from '../components/upload/UploadButtons';
import UploadAreaModal from '../components/upload/uploadAreaModal';
import FileTree from '../components/fileTree/FileTree';
import CodeEditor from '../components/editor/codeEditor';
import { FileNode } from '../types/FileNode';
import { parseZipFile } from '../components/upload/parseZipFile';
import { buildTree } from '../components/fileTree/buildTree';
import EliceLogo from '../assets/EliceLogo.png';

const MainPage = () => {
  const [tree, setTree] = useState<FileNode[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filesMap, setFilesMap] = useState<Map<string, string>>(new Map());
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);

  const handleUpload = async (file: File) => {
    const entries = await parseZipFile(file);
    const tree = buildTree(entries);
    setTree(tree);

    const newMap = new Map<string, string>();
    for (const entry of entries) {
      if (!entry.isDirectory && entry.content !== undefined) {
        const fileName = entry.name.split('/').filter(Boolean).pop()!;
        newMap.set(fileName, entry.content);
      }
    }
    setFilesMap(newMap);
  };

  const handleFileClick = (file: FileNode) => {
    setSelectedFile(file);
  };

  const getFileContent = async (fileName: string) => {
    return filesMap.get(fileName) || '';
  };

  return (
    <Container>
      <Header>
        <LogoSection>
          <img src={EliceLogo} alt="Elice Logo" height={32} />
        </LogoSection>
        <UploadButtons onUploadClick={() => setIsModalOpen(true)} />
        {isModalOpen && (
          <UploadAreaModal onUpload={handleUpload} onClose={() => setIsModalOpen(false)} />
        )}
      </Header>

      <Layout>
        <FileTree
          nodes={tree}
          onFileClick={handleFileClick}
          selectedFileName={selectedFile?.name}
        />
        <EditorBox>
          <CodeEditor
            files={tree}
            onSelectFileContent={getFileContent}
            selectedFile={selectedFile}
          />
        </EditorBox>
      </Layout>
    </Container>
  );
};

export default MainPage;
const Header = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 45px;
  padding: 0 40px 10px;
  margin: 10px 0;
  background-color: white;
  border-bottom: 1px solid #eee;
`;

const LogoSection = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;
const Container = styled.div`
  font-family: Pretendard;
  max-width: 1800px;
`;

const Layout = styled.div`
  display: flex;
  gap: 24px;
  margin-top: 24px;
  padding: 0 40px;
`;

const EditorBox = styled.div`
  flex: 1;
  height: 600px;
`;
