export default function TableData({
  columns,
  preview,
}) {
  return (
    <>
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
    </>
  );
}


