import styled from 'styled-components';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

interface UploadButtonsProps {
  onUploadClick: () => void;
  originalZipName: string;
  originalFileMap: Map<string, Blob>;
  modifiedFileMap: Map<string, Blob>;
}

const UploadButtons = ({
  onUploadClick,
  originalZipName,
  originalFileMap,
  modifiedFileMap,
}: UploadButtonsProps) => {
  const downloadZip = async () => {
    const zip = new JSZip();
    const mergedMap = new Map(originalFileMap);
    modifiedFileMap.forEach((blob, name) => mergedMap.set(name, blob));
    mergedMap.forEach((blob, name) => zip.file(name, blob));

    const blob = await zip.generateAsync({ type: 'blob' });
    const filename = (originalZipName || 'files') + '_new.zip';
    saveAs(blob, filename);
  };

  return (
    <ButtonWrapper>
      <UploadButton onClick={onUploadClick}>Upload</UploadButton>
      <DownloadButton onClick={downloadZip}>Download ZIP</DownloadButton>
    </ButtonWrapper>
  );
};

export default UploadButtons;

const ButtonWrapper = styled.div`
  display: flex;
  gap: 16px;
`;

const UploadButton = styled.button`
  background-color: #f1e9ff;
  color: black;
  font-weight: bold;
  padding: 10px 24px;
  border: none;
  border-radius: 999px;
  cursor: pointer;
`;

const DownloadButton = styled.button`
  background-color: #6700e7;
  color: #ffffff;
  font-weight: bold;
  padding: 10px 24px;
  border: none;
  border-radius: 999px;
  cursor: pointer;
`;
