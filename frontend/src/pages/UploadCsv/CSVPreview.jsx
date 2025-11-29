export default function CSVPreview({ result }) {
  if (!result) return null;

  return (
    <div style={{ marginTop: "30px" }}>
      <h2>Kết quả thống kê</h2>
      <p>{result.row_count} dòng / {result.columns.length} cột</p>

      <div
        style={{
          maxHeight: "300px",
          overflow: "auto",
          border: "1px solid #ccc",
          marginBottom: "30px",
        }}
      >
        <table border="1" cellPadding="8" style={{ width: "100%", fontSize: "12px" }}>
          <thead>
            <tr>
              {result.columns.map(col => (
                <th key={col} style={{ background: "#f0f0f0" }}>{col}</th>
              ))}
            </tr>
          </thead>

          <tbody>
            {result.preview.map((row, i) => (
              <tr key={i}>
                {result.columns.map(col => (
                  <td key={col}>{String(row[col])}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
