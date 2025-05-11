import { useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import * as monaco from 'monaco-editor';
import styled from 'styled-components';
import { FileNode } from '../../types/FileNode';
import cancelIcon from '../../assets/cancel.png';
import cancelWhiteIcon from '../../assets/cancelWhite.png';
import dotIcon from '../../assets/dot.png';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import JsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';
import TsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker';
import HtmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker';
import CssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker';

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
    const [theme, setTheme] = useState<'vs-dark' | 'vs'>('vs');
    const filesMapRef = useRef<Map<string, Blob>>(new Map());
    (self as any).MonacoEnvironment = {
      getWorker(_: string, label: string) {
        if (label === 'json') {
          return new JsonWorker();
        }
        if (label === 'css') {
          return new CssWorker();
        }
        if (label === 'html') {
          return new HtmlWorker();
        }
        if (label === 'typescript' || label === 'javascript') {
          return new TsWorker();
        }
        return new EditorWorker();
      },
    };

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
          theme,
          automaticLayout: true,
        });

        monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
          target: monaco.languages.typescript.ScriptTarget.ES2020,
          allowNonTsExtensions: true,
        });
        monaco.languages.typescript.typescriptDefaults.setEagerModelSync(true);

        const languages = [
          'typescript',
          'javascript',
          'json',
          'markdown',
          'html',
          'css',
          'python',
          'java',
          'cpp',
          'shell',
          'plaintext',
        ];

        languages.forEach(lang => {
          monaco.languages.registerCompletionItemProvider(lang, {
            triggerCharacters: ['.', '<', 'f', 'd'],
            provideCompletionItems: (model, position) => {
              const word = model.getWordUntilPosition(position);
              const range: monaco.IRange = {
                startLineNumber: position.lineNumber,
                endLineNumber: position.lineNumber,
                startColumn: word.startColumn,
                endColumn: word.endColumn,
              };
              const suggestions = getSuggestions(lang, range);
              return { suggestions };
            },
          });
        });
      } else if (editorRef.current) {
        monaco.editor.setTheme(theme);
      }
    }, [theme]);

    const getSuggestions = (
      lang: string,
      range: monaco.IRange
    ): monaco.languages.CompletionItem[] => {
      switch (lang) {
        case 'javascript':
        case 'typescript':
          return [
            {
              label: 'log',
              kind: monaco.languages.CompletionItemKind.Function,
              insertText: 'console.log($1);',
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: '콘솔 출력',
              range,
            },
            {
              label: 'forEach',
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText: 'array.forEach((item) => {\n  $1\n});',
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: 'forEach 루프',
              range,
            },
            {
              label: 'func',
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText: 'function $1() {\n  $2\n}',
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: '함수 선언',
              range,
            },
          ];

        case 'python':
          return [
            {
              label: 'def',
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText: 'def $1():\n    $2',
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: '함수 정의',
              range,
            },
            {
              label: 'print',
              kind: monaco.languages.CompletionItemKind.Function,
              insertText: 'print($1)',
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: '출력 함수',
              range,
            },
            {
              label: 'ifmain',
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText: 'if __name__ == "__main__":\n    $1',
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: '엔트리 포인트',
              range,
            },
          ];

        case 'html':
          return [
            {
              label: 'html',
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText: `<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <title>$1</title>\n</head>\n<body>\n  $2\n</body>\n</html>`,
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: '기본 HTML 구조',
              range,
            },
            {
              label: 'div',
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText: '<div>$1</div>',
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: 'div 태그',
              range,
            },
          ];

        case 'css':
          return [
            {
              label: 'center-flex',
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText: 'display: flex;\njustify-content: center;\nalign-items: center;',
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: '가운데 정렬 flexbox',
              range,
            },
          ];

        default:
          return [];
      }
    };

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
      const baseTrimmed = base.length > 10 ? `${base.slice(0, 14)}...${base.slice(-1)}` : base;
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
        <TabBar>
          <TabsWrapper>
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
          </TabsWrapper>
          <ThemeSwitcher>
            <ThemeButton
              active={theme === 'vs'}
              onClick={() => setTheme(prev => (prev === 'vs' ? 'vs-dark' : 'vs'))}
            >
              {theme === 'vs' ? 'Dark Theme' : 'Light Theme'}
            </ThemeButton>
          </ThemeSwitcher>
        </TabBar>
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

const TabBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: #ffffff;
  border-bottom: 1px solid #ddd;
  margin-top: 10px;
`;

const TabsWrapper = styled.div`
  flex: 1;
  overflow-x: auto;
  white-space: nowrap;
  scrollbar-width: none;
  -ms-overflow-style: none;

  &::-webkit-scrollbar {
    display: none;
  }
`;

const Tabs = styled.div`
  display: inline-flex;
  gap: 10px;
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

const ThemeSwitcher = styled.div`
  flex-shrink: 0;
  margin-right: 16px;
`;

const ThemeButton = styled.button<{ active: boolean }>`
  background-color: ${({ active }) => (active ? '#ffffff' : '#222')};
  color: ${({ active }) => (active ? '#000' : '#fff')};
  border: 1px solid #000;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
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
  height: 500px;
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
