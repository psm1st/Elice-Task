import React, { useState, useEffect, useRef } from 'react';
import * as monaco from 'monaco-editor';
import styled from 'styled-components';
import { FileNode } from '../../types/FileNode';

interface OpenFile {
  file: FileNode;
  content: string;
}

interface Props {
  files: FileNode[];
  onSelectFileContent: (fileName: string) => Promise<string>;
  selectedFile: FileNode | null;
}

const CodeEditor: React.FC<Props> = ({ files, onSelectFileContent, selectedFile }) => {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [openTabs, setOpenTabs] = useState<OpenFile[]>([]);
  const [activeFile, setActiveFile] = useState<string | null>(null);

  useEffect(() => {
    if (containerRef.current && !editorRef.current) {
      editorRef.current = monaco.editor.create(containerRef.current, {
        value: '',
        language: 'typescript',
        theme: 'vs-light',
        automaticLayout: true,
        readOnly: true,
      });
    }
  }, []);

  useEffect(() => {
    const currentTab = openTabs.find(tab => tab.file.name === activeFile);
    if (editorRef.current && currentTab) {
      const model = monaco.editor.createModel(currentTab.content, 'typescript');
      editorRef.current.setModel(model);
      editorRef.current.updateOptions({ readOnly: !currentTab.file.isEditable });
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
      const newTab: OpenFile = {
        file,
        content,
      };
      setOpenTabs(prev => [...prev, newTab]);
    }
    setActiveFile(file.name);
  };

  return (
    <EditorContainer>
      <Tabs>
        {openTabs.map(tab => {
          if (!tab?.file?.name) return null;
          return (
            <Tab
              key={tab.file.name}
              active={tab.file.name === activeFile}
              onClick={() => setActiveFile(tab.file.name)}
            >
              {tab.file.name}
            </Tab>
          );
        })}
      </Tabs>
      <EditorBox ref={containerRef} />
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
  background-color: #f3f3f3;
  border-bottom: 1px solid #ddd;
`;

const Tab = styled.div<{ active: boolean }>`
  padding: 10px 16px;
  cursor: pointer;
  background-color: ${({ active }) => (active ? '#fff' : '#f3f3f3')};
  border-bottom: ${({ active }) => (active ? '2px solid #6200ee' : 'none')};
  font-weight: ${({ active }) => (active ? 'bold' : 'normal')};
`;

const EditorBox = styled.div`
  flex: 1;
`;
