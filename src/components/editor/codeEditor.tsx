import { useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import * as monaco from 'monaco-editor';
import styled from 'styled-components';
import { FileNode } from '../../types/FileNode';
import cancelIcon from '../../assets/cancel.png';
import cancelWhiteIcon from '../../assets/cancelWhite.png';
import dotIcon from '../../assets/dot.png';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

interface OpenFile {
  file: FileNode;
  content: Blob;
  modified?: boolean;
}

export interface CodeEditorRef {
  getOpenTabs: () => OpenFile[];
  downloadZip: (originalZipName?: string) => void;
}

interface Props {
  files: FileNode[];
  onSelectFileContent: (filePath: string) => Promise<Blob | undefined>;
  selectedFile: FileNode | null;
  onActiveFileChange?: (file: FileNode | null) => void;
  originalZipName?: string;
  onFileSave?: (filePath: string, content: Blob) => void;
}

const CodeEditor = forwardRef<CodeEditorRef, Props>(
  ({ onSelectFileContent, selectedFile, onActiveFileChange, onFileSave, files }, ref) => {
    const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [openTabs, setOpenTabs] = useState<OpenFile[]>([]);
    const [activeFile, setActiveFile] = useState<string | null>(null);
    const filesMapRef = useRef<Map<string, Blob>>(new Map());

    useImperativeHandle(ref, () => ({
      getOpenTabs: () => openTabs,
      downloadZip: async (originalZipName = 'files') => {
        const zip = new JSZip();
        const addToZip = async (nodes: FileNode[], path = '') => {
          for (const node of nodes) {
            const fullPath = path ? `${path}/${node.name}` : node.name;
            if (node.isDirectory && node.children) {
              await addToZip(node.children, fullPath);
            } else {
              const openTab = openTabs.find(
                tab => `${tab.file.path}/${tab.file.name}` === fullPath
              );
              let blob = openTab?.content || filesMapRef.current.get(fullPath);
              if (!blob) blob = await onSelectFileContent(fullPath);
              if (blob) zip.file(fullPath, blob);
            }
          }
        };
        await addToZip(files);
        const blob = await zip.generateAsync({ type: 'blob' });
        saveAs(blob, `${originalZipName}_new.zip`);
      },
    }));

    useEffect(() => {
      if (containerRef.current && !editorRef.current) {
        editorRef.current = monaco.editor.create(containerRef.current, {
          value: '',
          language: 'plaintext',
          theme: 'vs-light',
          automaticLayout: true,
        });

        monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
          target: monaco.languages.typescript.ScriptTarget.ES2020,
          allowNonTsExtensions: true,
        });

        monaco.languages.typescript.typescriptDefaults.setEagerModelSync(true);
      }
    }, []);

    useEffect(() => {
      const currentTab = openTabs.find(tab => `${tab.file.path}/${tab.file.name}` === activeFile);
      if (!editorRef.current || !currentTab) return;

      const fileName = currentTab.file.name.toLowerCase();
      const isTextFile =
        /\.(ts|tsx|js|jsx|json|md|txt|html|css|scss|xml|csv|py|java|c|cpp|sh)$/i.test(fileName);
      if (isTextFile) {
        const uri = monaco.Uri.parse(`file:///${activeFile}`);
        let model = monaco.editor.getModel(uri);

        if (!model) {
          currentTab.content.text().then(text => {
            requestIdleCallback(() => {
              model = monaco.editor.createModel(text, getLanguage(fileName), uri);
              editorRef.current!.setModel(model);
              editorRef.current!.updateOptions({ readOnly: currentTab.file.isEditable === false });
              model!.onDidChangeContent(() => {
                setOpenTabs(prevTabs =>
                  prevTabs.map(tab =>
                    `${tab.file.path}/${tab.file.name}` === activeFile
                      ? { ...tab, modified: true }
                      : tab
                  )
                );
              });
            });
          });
        } else {
          requestIdleCallback(() => {
            editorRef.current!.setModel(model!);
            editorRef.current!.updateOptions({ readOnly: currentTab.file.isEditable === false });
            model!.onDidChangeContent(() => {
              setOpenTabs(prevTabs =>
                prevTabs.map(tab =>
                  `${tab.file.path}/${tab.file.name}` === activeFile
                    ? { ...tab, modified: true }
                    : tab
                )
              );
            });
          });
        }
      }
    }, [activeFile]);

    useEffect(() => {
      const handler = (e: KeyboardEvent) => {
        if (e.metaKey && e.key === 's') {
          e.preventDefault();
          const currentTab = openTabs.find(
            tab => `${tab.file.path}/${tab.file.name}` === activeFile
          );
          if (!currentTab || !editorRef.current) return;
          const model = editorRef.current.getModel();
          const text = model?.getValue();
          if (text) {
            const blob = new Blob([text], { type: 'text/plain' });
            setOpenTabs(prevTabs =>
              prevTabs.map(tab =>
                `${tab.file.path}/${tab.file.name}` === activeFile
                  ? { ...tab, content: blob, modified: false }
                  : tab
              )
            );
            filesMapRef.current.set(activeFile!, blob);
            onFileSave?.(activeFile!, blob);
          }
        }
        if (e.metaKey && e.shiftKey && e.key.toLowerCase() === 'z') {
          e.preventDefault();
          editorRef.current?.trigger('keyboard', 'redo', null);
        }
      };
      window.addEventListener('keydown', handler);
      return () => window.removeEventListener('keydown', handler);
    }, [openTabs, activeFile]);

    useEffect(() => {
      if (selectedFile && !selectedFile.isDirectory) openFile(selectedFile);
    }, [selectedFile]);

    const openFile = async (file: FileNode) => {
      const filePath = `${file.path}/${file.name}`;
      const existingTab = openTabs.find(tab => `${tab.file.path}/${tab.file.name}` === filePath);
      if (!existingTab) {
        const content = await onSelectFileContent(filePath);
        if (!content) return;
        const newTab: OpenFile = { file, content, modified: false };
        setOpenTabs(prev => [...prev, newTab]);
        filesMapRef.current.set(filePath, content);
      }
      setActiveFile(filePath);
      onActiveFileChange?.(file);
    };

    const closeTab = (filePath: string) => {
      setOpenTabs(prev => {
        const newTabs = prev.filter(tab => `${tab.file.path}/${tab.file.name}` !== filePath);
        if (activeFile === filePath) {
          const nextTab = newTabs[newTabs.length - 1] || null;
          setActiveFile(nextTab ? `${nextTab.file.path}/${nextTab.file.name}` : null);
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

    const currentTab = openTabs.find(tab => `${tab.file.path}/${tab.file.name}` === activeFile);
    const fileName = currentTab?.file.name.toLowerCase() || '';
    const isImage = currentTab && /\.(png|jpe?g|gif|bmp|webp)$/i.test(fileName);
    const isPDF = currentTab && fileName.endsWith('.pdf');
    const url = currentTab ? URL.createObjectURL(currentTab.content) : '';

    return (
      <EditorContainer>
        <Tabs>
          {openTabs.map(tab => {
            const pathKey = `${tab.file.path}/${tab.file.name}`;
            const isActive = pathKey === activeFile;
            return (
              <Tab
                key={pathKey}
                active={isActive}
                onClick={() => {
                  setActiveFile(pathKey);
                  onActiveFileChange?.(tab.file);
                }}
                title={pathKey}
              >
                {getShortenedName(tab.file.name)}
                {tab.modified ? (
                  <CloseIcon src={dotIcon} alt="modified" />
                ) : (
                  <CloseIcon
                    src={isActive ? cancelWhiteIcon : cancelIcon}
                    alt="close"
                    onClick={e => {
                      e.stopPropagation();
                      closeTab(pathKey);
                    }}
                  />
                )}
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
  }
);

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
  margin-top: 10px;
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
  background-color: #ffffff;
  z-index: 10;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0;

  img,
  iframe {
    max-width: 100%;
    max-height: 100%;
    border: none;
  }
`;
