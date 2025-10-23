import React, { useMemo, useState } from 'react';
import axios from 'axios';

interface ColumnInfo {
  name: string;
  dtype: string;
  nulls: number;
  sampleValues: string[];
}

interface UploadResponse {
  filename: string;
  sizeBytes: number;
  sizeHuman: string;
  delimiter: string;
  numRows: number;
  numColumns: number;
  columns: ColumnInfo[];
  head: Array<Record<string, unknown>>;
  error?: string;
}

export const App: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<UploadResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const apiBase = useMemo(() => {
    // If running locally via Vite, we can proxy or set env
    return '';
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setData(null);
    setError(null);
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await axios.post<UploadResponse>(`${apiBase}/api/upload`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setData(res.data);
    } catch (err: any) {
      const message = err?.response?.data?.error || err?.message || 'Lỗi không xác định';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>CSV Reader</h1>
      <p>Tải lên tệp CSV để xem thông tin tổng quan.</p>

      <div className="card">
        <input type="file" accept=".csv,text/csv" onChange={handleFileChange} />
        <button onClick={handleUpload} disabled={!file || loading}>
          {loading ? 'Đang xử lý...' : 'Tải lên và phân tích'}
        </button>
      </div>

      {error && (
        <div className="error">{error}</div>
      )}

      {data && (
        <div className="result">
          <h2>Thông tin tệp</h2>
          <ul>
            <li><strong>Tên tệp:</strong> {data.filename}</li>
            <li><strong>Kích thước:</strong> {data.sizeHuman} ({data.sizeBytes} bytes)</li>
            <li><strong>Delimiter:</strong> <code>{data.delimiter}</code></li>
            <li><strong>Số dòng:</strong> {data.numRows}</li>
            <li><strong>Số cột:</strong> {data.numColumns}</li>
          </ul>

          <h3>Cột</h3>
          <table>
            <thead>
              <tr>
                <th>Tên cột</th>
                <th>Kiểu</th>
                <th>Giá trị null</th>
                <th>Mẫu giá trị</th>
              </tr>
            </thead>
            <tbody>
              {data.columns.map((c) => (
                <tr key={c.name}>
                  <td>{c.name}</td>
                  <td>{c.dtype}</td>
                  <td>{c.nulls}</td>
                  <td>{c.sampleValues.join(', ')}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h3>Một vài dòng đầu</h3>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  {Object.keys(data.head[0] || {}).map((k) => (
                    <th key={k}>{k}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.head.map((row, idx) => (
                  <tr key={idx}>
                    {Object.keys(row).map((k) => (
                      <td key={k}>{String((row as any)[k])}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
