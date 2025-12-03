import React, { useState } from 'react';
import './Home.css';

const Home = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileName, setFileName] = useState('');

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setFileName(file.name);
    }
  };

  const handleChooseFile = () => {
    document.getElementById('file-input').click();
  };

  return (
    <div 
      className="home-container"
      style={{
        backgroundImage: `url('/bg.png')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
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
              </div>
              
              <a href="/huong-dan-su-dung" className="guide-link">
                Hướng dẫn tạo file dữ liệu
              </a>
            </div>

            <div className="analyze-section">
              <button 
                className="analyze-btn"
                disabled={!selectedFile}
              >
                Phân tích
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
