import styled from 'styled-components';

const UploadButtons = ({
  onUploadClick,
  onDownloadClick,
}: {
  onUploadClick: () => void;
  onDownloadClick: () => void;
}) => (
  <ButtonWrapper>
    <UploadButton onClick={onUploadClick}>Upload</UploadButton>
    <DownloadButton onClick={onDownloadClick}>Download ZIP</DownloadButton>
  </ButtonWrapper>
);

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
