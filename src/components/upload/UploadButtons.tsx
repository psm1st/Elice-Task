import styled from "styled-components";

const UploadButtons = ({ onUploadClick }: { onUploadClick: () => void }) => {
    return (
      <ButtonWrapper>
        <UploadButton onClick={onUploadClick}>Upload</UploadButton>
        <DownloadButton>Download</DownloadButton>
      </ButtonWrapper>
    );
  };

export default UploadButtons;
const ButtonWrapper = styled.div`
  display: flex;
  gap: 16px;
`;

const UploadButton = styled.button`
  background-color: #6a0eff;
  color: white;
  font-weight: bold;
  padding: 10px 24px;
  border: none;
  border-radius: 999px;
  cursor: pointer;
`;

const DownloadButton = styled.button`
  background-color: #f1e9ff;
  color: #111;
  font-weight: bold;
  padding: 10px 24px;
  border: none;
  border-radius: 999px;
  cursor: pointer;
`;
