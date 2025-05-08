import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import styled from 'styled-components';

type Props = {
  onUpload: (zip: File) => void;
};

const UploadArea: React.FC<Props> = ({ onUpload }) => {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const zipFile = acceptedFiles.find(file => file.name.endsWith('.zip'));
      if (zipFile) onUpload(zipFile);
    },
    [onUpload]
  );

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    multiple: false,
    accept: {
      'application/zip': ['.zip'],
    },
    noKeyboard: true,
  });

  const { onClick, ...rootProps } = getRootProps();

  return (
    <UploadBox
      {...rootProps}
      onClick={e => {
        e.stopPropagation();
        onClick?.(e);
      }}
    >
      <input {...getInputProps()} />
      ZIP 파일을 업로드하거나 이곳에 드래그 앤 드롭하세요
    </UploadBox>
  );
};

export default UploadArea;

const UploadBox = styled.div`
  border: 2px dashed #aaa;
  border-radius: 8px;
  padding: 40px;
  text-align: center;
  cursor: pointer;
  background-color: #f8f8f8;
`;
