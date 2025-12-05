import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';
import { useUpload } from '../context/UploadContext.jsx';
import bg from '../assets/bg.png';

export default function HomePage() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const navigate = useNavigate();
  const { setUploadState } = useUpload();

  const handleFileSelect = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      setSelectedFile(null);
      setFileName('');
      setError('Chỉ chấp nhận file CSV (.csv)');
      return;
    }
 

    setError('');
    setSelectedFile(file);
    setFileName(file.name);
  };

  const handleChooseFile = () => {
    const input = document.getElementById('file-input');
    if (input) {
      input.click();
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;

    try {
      setIsUploading(true);
      setError('');

      const formData = new FormData();
      formData.append('file', selectedFile);

      const res = await fetch('https://smartpls-2.onrender.com/upload-csv', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || 'Không thể upload file');
      }

      setUploadState({
        fileName,
        result: data.summary,
        savedFile: selectedFile, // Lưu file để có thể upload lại sau
      });

      navigate('/phan-tich');
    } catch (e) {
      setError(e.message || 'Đã xảy ra lỗi khi upload file');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div
      className="home-container"
      style={{
        backgroundImage: `url(${bg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div className="background-overlay">
        <div className="main-content">
          <div className="content-card">
            <h1 className="main-title">Vui lòng nhập dữ liệu</h1>

            <div className="file-input-section">
              <div className="file-input-container">
                <input
                  type="file"
                  id="file-input"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="file-input"
                />
                <div className="file-input-label">
                  <span className="file-format">.csv</span>
                  <button
                    type="button"
                    className="choose-file-btn"
                    onClick={handleChooseFile}
                  >
                    Chọn file
                  </button>
                </div>
                {fileName && (
                  <div className="selected-file">
                    <span>File đã chọn: {fileName}</span>
                  </div>
                )}
                {error && (
                  <div className="error-message">
                    {error}
                  </div>
                )}
              </div>

              <a href="/huong-dan-su-dung" className="guide-link">
                Hướng dẫn tạo file dữ liệu
              </a>
            </div>

            <div className="analyze-section">
              <button
                className={`analyze-btn ${isUploading ? 'loading' : ''}`}
                disabled={!selectedFile || isUploading}
                type="button"
                onClick={handleAnalyze}
              >
                {isUploading ? 'Đang tải ...' : 'Phân tích'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


