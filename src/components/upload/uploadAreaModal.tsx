import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import styled from 'styled-components';

type Props = {
  onUpload: (file: File) => void;
  onClose: () => void;
};

const UploadAreaModal: React.FC<Props> = ({ onUpload, onClose }) => {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const zip = acceptedFiles.find(f => f.name.endsWith('.zip'));
      if (zip) {
        onUpload(zip);
        onClose();
      }
    },
    [onUpload, onClose]
  );

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    multiple: false,
    accept: {
      'application/zip': ['.zip'],
    },
  });

  return (
    <Overlay onClick={onClose}>
      <Modal onClick={e => e.stopPropagation()}>
        <DropZone {...getRootProps()}>
          <input {...getInputProps()} />
          <Text>
            ZIP 파일을 업로드하려면 클릭하거나
            <br />
            이곳으로 드래그하세요
          </Text>
        </DropZone>
      </Modal>
    </Overlay>
  );
};

export default UploadAreaModal;

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
`;

const Modal = styled.div`
  background-color: none;
  padding: 32px;
  border-radius: 16px;
  width: 400px;
  text-align: center;
`;

const DropZone = styled.div`
  border: 2px dashed #6a0eff;
  padding: 40px;
  border-radius: 12px;
  cursor: pointer;
  background-color: white;
`;

const Text = styled.p`
  font-size: 16px;
  margin: 0;
`;
