import React, { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import styled from "styled-components";

type Props = {
  onUpload: (file: File) => void;
  onClose: () => void;
};

const UploadAreaModal: React.FC<Props> = ({ onUpload, onClose }) => {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const zip = acceptedFiles.find((f) => f.name.endsWith(".zip"));
      if (zip) {
        onUpload(zip);
        onClose(); 
      }
    },
    [onUpload, onClose]
  );

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: { "application/zip": [".zip"] },
    multiple: false,
  });

  return (
    <Overlay onClick={onClose}>
      <Modal onClick={(e) => e.stopPropagation()} {...getRootProps()}>
        <input {...getInputProps()} />
        <Text>ZIP 파일을 업로드하거나<br />이곳에 드래그 앤 드롭하세요</Text>
      </Modal>
    </Overlay>
  );
};

export default UploadAreaModal;

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
`;

const Modal = styled.div`
  width: 400px;
  padding: 40px;
  background-color: #fff;
  border-radius: 16px;
  text-align: center;
  border: 2px dashed #6a0eff;
  cursor: pointer;
`;

const Text = styled.p`
  margin: 0;
  font-size: 16px;
  color: #333;
`;
