export default function UploadHeader({ file, setFile, handleUpload }) {
  return (
    <div>
      <h1>Tải CSV + Xử lý</h1>

      <input type="file" accept=".csv" onChange={e => setFile(e.target.files[0])} />
      <button onClick={handleUpload} style={{ marginLeft: "10px" }}>
        Upload
      </button>
    </div>
  );
}
