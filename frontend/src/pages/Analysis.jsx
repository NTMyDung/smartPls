import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUpload } from '../context/UploadContext.jsx';
import Variable from '../component/Variable.jsx';
import StepNavigation from '../component/StepNavigation.jsx';

export default function AnalysisPage() {
  const { uploadState, setUploadState } = useUpload();
  const navigate = useNavigate();
  const { fileName, result } = uploadState;

  const [isEditing, setIsEditing] = useState(false);
  const [editError, setEditError] = useState('');
  const [variables, setVariables] = useState(result?.variables || []);
  const [pairs, setPairs] = useState([]);

  if (!result) {
    navigate('/');
    return null;
  }

  const handleEditFile = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';

    input.onchange = async (event) => {
      const file = event.target.files?.[0];
      if (!file) return;

      if (!file.name.toLowerCase().endsWith('.csv')) {
        setEditError('Chỉ chấp nhận file CSV (.csv)');
        return;
      }

      try {
        setIsEditing(true);
        setEditError('');

        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch('http://127.0.0.1:8000/upload-csv', {
          method: 'POST',
          body: formData,
        });

        const data = await res.json();

        if (!res.ok || data.error) {
          throw new Error(data.error || 'Không thể cập nhật file');
        }

        setUploadState({
          fileName: file.name,
          result: data.summary,
        });
        setVariables(data.summary.variables || []);
        setPairs([]);
      } catch (e) {
        setEditError(e.message || 'Đã xảy ra lỗi khi cập nhật file');
      } finally {
        setIsEditing(false);
      }
    };

    input.click();
  };

  const { columns = [], preview = [], row_count = 0 } = result || {};

  return (
    <div style={{ padding: '2rem 7rem', margin: '74px auto 0 auto' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', display: 'inline-block'}}>
          <div style={{ fontSize: '1.2rem', fontWeight: 'bold', display: 'inline-block' }}>Tên file: <em style={{ color: 'rgb(0 72 225)' }}>{fileName || 'Không có'}</em></div>
            <button
              type="button"
              onClick={handleEditFile}
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                border: '1px solid #1f2937',
                background: '#2c8800',
                color: 'white',
                fontSize: '1rem',
                cursor: 'pointer',
                marginLeft: '10px',
                fontWeight: 'bold',
              }}
            >
              Chỉnh sửa
            </button>
          {editError && (
            <div style={{ color: '#dc2626', fontSize: '12px' }}>{editError}</div>
          )}
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{  fontSize: '1.2rem', fontWeight: 'bold' }}>Số lượng:  <em style={{ color: 'rgb(0 72 225)' }}>{row_count}</em></div>
        </div>
      </div>

      {isEditing && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
          }}
        >
          <div
            style={{
              background: 'white',
              padding: '24px 32px',
              borderRadius: '12px',
              minWidth: '260px',
              textAlign: 'center',
              boxShadow: '0 10px 30px rgba(0,0,0,0.18)',
            }}
          >
            <div
              style={{
                borderRadius: '999px',
                width: '40px',
                height: '40px',
                border: '4px solid #e5e7eb',
                borderTopColor: '#111827',
                margin: '0 auto 12px',
                animation: 'spin 1s linear infinite',
              }}
            />
            <div style={{ fontWeight: 600, marginBottom: '4px' }}>Đang tải ....</div>
            <div style={{ fontSize: '13px', color: '#6b7280' }}>
              Vui lòng chờ trong giây lát
            </div>
          </div>
        </div>
      )}

      <div style={{ overflowX: 'auto', marginTop: '16px' }}>
        <h3>Dữ liệu đã upload:</h3>
        <table
          border="1"
          cellPadding="8"
          style={{ width: '100%', fontSize: '0.9rem', borderCollapse: 'collapse' }}
        >
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col} style={{ background: '#fff7d7', fontWeight: 'bold' }}>
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {preview.map((row, i) => (
              <tr key={i}>
                {columns.map((col) => (
                  <td key={col}>{String(row[col])}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <hr style={{ margin: '30px 0' , border: '2px solid rgb(162 162 162)'}}></hr>
      <div style={{ marginTop: '30px' }}>
        <h3>Các biến từ file:</h3>
        <Variable variables={variables} />
      </div>
      <hr style={{ margin: '30px 0' , border: '2px solid rgb(162 162 162)'}}></hr>
      <div style={{ marginTop: '40px', marginBottom: '40px' }}>
        <h3>Tiến hành chọn các cặp biến</h3>
        <StepNavigation variables={variables} onPairsChange={setPairs} />
      </div>
    </div>
  );
}


