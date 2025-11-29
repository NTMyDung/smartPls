export default function ResultTables({
  TABLES_BY_ACTION,
  modelResult,
  selectedTable,
  setSelectedTable,
  renderTable,
}) {
  if (!modelResult) return null;

  return (
    <>
      <h2 style={{ marginTop: "40px" }}>Thống kê kết quả</h2>

      <div style={{ display: "flex", gap: "20px" }}>
        <div style={{ minWidth: "200px", display: "flex", flexDirection: "column", gap: "10px" }}>
          {TABLES_BY_ACTION[modelResult.action].map(tbl => (
            <button
              key={tbl.key}
              onClick={() => setSelectedTable(tbl.key)}
              style={{
                padding: "10px",
                textAlign: "left",
                borderRadius: "6px",
                cursor: "pointer",
                background: selectedTable === tbl.key ? "#041946ff" : "#E5E7EB",
                color: selectedTable === tbl.key ? "white" : "black",
                fontWeight: "bold",
              }}
            >
              {tbl.label}
            </button>
          ))}
        </div>

        <div style={{
          flex: 1,
          padding: "10px",
          border: "1px solid #ddd",
          borderRadius: "6px",
          background: "white",
          maxHeight: "600px",
          overflow: "auto"
        }}>
          {selectedTable
            ? renderTable(modelResult[selectedTable])
            : <p>Chọn loại kết quả bên phải để xem chi tiết.</p>
          }
        </div>
      </div>
    </>
  );
}
