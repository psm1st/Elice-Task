import React, { useState, useEffect, useRef } from 'react';
import * as monaco from 'monaco-editor';
import styled from 'styled-components';
import { FileNode } from '../../types/FileNode';
import cancelIcon from '../../assets/cancel.png';
import cancelWhiteIcon from '../../assets/cancelWhite.png';

interface OpenFile {
  file: FileNode;
  content: Blob;
}

interface Props {
  files: FileNode[];
  onSelectFileContent: (fileName: string) => Promise<Blob | undefined>;
  selectedFile: FileNode | null;
  onActiveFileChange?: (file: FileNode | null) => void;
}

const CodeEditor: React.FC<Props> = ({ onSelectFileContent, selectedFile, onActiveFileChange }) => {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [openTabs, setOpenTabs] = useState<OpenFile[]>([]);
  const [activeFile, setActiveFile] = useState<string | null>(null);

  useEffect(() => {
    if (containerRef.current && !editorRef.current) {
      editorRef.current = monaco.editor.create(containerRef.current, {
        value: '',
        language: 'plaintext',
        theme: 'vs-light',
        automaticLayout: true,
      });
    }
  }, []);

  useEffect(() => {
    const currentTab = openTabs.find(tab => tab.file.name === activeFile);
    if (!editorRef.current || !currentTab) return;

    const fileName = currentTab.file.name.toLowerCase();
    const isTextFile =
      /\.(ts|tsx|js|jsx|json|md|txt|html|css|scss|xml|csv|py|java|c|cpp|sh)$/i.test(fileName);

    monaco.editor.getModels().forEach(model => model.dispose());

    if (isTextFile) {
      currentTab.content.text().then(text => {
        const model = monaco.editor.createModel(text, getLanguage(fileName));
        editorRef.current!.setModel(model);
        editorRef.current!.updateOptions({
          readOnly: currentTab.file.isEditable === false,
        });
      });
    } else {
      editorRef.current.setModel(null);
    }
  }, [activeFile, openTabs]);

  useEffect(() => {
    if (selectedFile && !selectedFile.isDirectory) {
      openFile(selectedFile);
    }
  }, [selectedFile]);

  const openFile = async (file: FileNode) => {
    const existingTab = openTabs.find(tab => tab.file.name === file.name);
    if (!existingTab) {
      const content = await onSelectFileContent(file.name);
      if (!content) return;
      const newTab: OpenFile = { file, content };
      setOpenTabs(prev => [...prev, newTab]);
    }
    setActiveFile(file.name);
    onActiveFileChange?.(file);
  };

  const closeTab = (fileName: string) => {
    setOpenTabs(prev => {
      const newTabs = prev.filter(tab => tab.file.name !== fileName);
      if (activeFile === fileName) {
        const nextTab = newTabs[newTabs.length - 1] || null;
        setActiveFile(nextTab?.file.name || null);
        onActiveFileChange?.(nextTab?.file || null);
      }
      return newTabs;
    });
  };

  const getShortenedName = (fileName: string) => {
    const dotIndex = fileName.lastIndexOf('.');
    if (dotIndex === -1 || fileName.length <= 27) return fileName;
    const base = fileName.slice(0, dotIndex);
    const ext = fileName.slice(dotIndex);
    const baseTrimmed = base.length > 16 ? `${base.slice(0, 14)}...${base.slice(-1)}` : base;
    return `${baseTrimmed}${ext}`;
  };

  const getLanguage = (fileName: string) => {
    if (fileName.endsWith('.ts') || fileName.endsWith('.tsx')) return 'typescript';
    if (fileName.endsWith('.js') || fileName.endsWith('.jsx')) return 'javascript';
    if (fileName.endsWith('.json')) return 'json';
    if (fileName.endsWith('.md')) return 'markdown';
    if (fileName.endsWith('.html')) return 'html';
    if (fileName.endsWith('.css') || fileName.endsWith('.scss')) return 'css';
    if (fileName.endsWith('.py')) return 'python';
    if (fileName.endsWith('.java')) return 'java';
    if (fileName.endsWith('.c') || fileName.endsWith('.cpp')) return 'cpp';
    if (fileName.endsWith('.sh')) return 'shell';
    return 'plaintext';
  };

  const currentTab = openTabs.find(tab => tab.file.name === activeFile);
  const fileName = currentTab?.file.name.toLowerCase() || '';
  const isImage = currentTab && /\.(png|jpe?g|gif|bmp|webp)$/i.test(fileName);
  const isPDF = currentTab && fileName.endsWith('.pdf');

  const url = currentTab ? URL.createObjectURL(currentTab.content) : '';

  return (
    <EditorContainer>
      <Tabs>
        {openTabs.map(tab => {
          const isActive = tab.file.name === activeFile;
          return (
            <Tab
              key={tab.file.name}
              active={isActive}
              onClick={() => {
                setActiveFile(tab.file.name);
                onActiveFileChange?.(tab.file);
              }}
              title={tab.file.name}
            >
              {getShortenedName(tab.file.name)}
              <CloseIcon
                src={isActive ? cancelWhiteIcon : cancelIcon}
                alt="close"
                onClick={e => {
                  e.stopPropagation();
                  closeTab(tab.file.name);
                }}
              />
            </Tab>
          );
        })}
      </Tabs>

      <EditorBox ref={containerRef}>
        {(isImage || isPDF) && (
          <ViewerOverlay>
            {isImage && <img src={url} alt={fileName} />}
            {isPDF && <iframe src={url} title={fileName} width="100%" height="100%" />}
          </ViewerOverlay>
        )}
      </EditorBox>
    </EditorContainer>
  );
};

export default CodeEditor;

const EditorContainer = styled.div`
  display: flex;
  flex-direction: column;
  max-width: 1000px;
  height: 100%;
`;

const Tabs = styled.div`
  display: flex;
  background-color: #ffffff;
  border-bottom: 1px solid #ddd;
  gap: 10px;
  margin-top: 25px;
`;

const Tab = styled.div<{ active: boolean }>`
  padding: 10px 16px;
  cursor: pointer;
  max-width: 150px;
  height: 30px;
  background-color: ${({ active }) => (active ? '#6700E7' : '#ffffff')};
  border-bottom: ${({ active }) => (active ? 'none' : '2px solid #6700E7')};
  font-weight: ${({ active }) => (active ? 'bold' : 'normal')};
  color: ${({ active }) => (active ? '#ffffff' : '#6700E7')};
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const CloseIcon = styled.img`
  width: 12px;
  height: 12px;
  margin-left: 8px;
  cursor: pointer;
`;

const EditorBox = styled.div`
  flex: 1;
  width: 100%;
  min-height: 500px;
  position: relative;
`;

const ViewerOverlay = styled.div`
  position: absolute;
  inset: 0;
  background-color: #f9f9f9;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 16px;

  img,
  iframe {
    max-width: 100%;
    max-height: 100%;
    border: none;
  }
`;
