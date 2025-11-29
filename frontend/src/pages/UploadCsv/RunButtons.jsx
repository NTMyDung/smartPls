export default function RunButtons({
  pairs,
  loadingPls,
  loadingBoot,
  handleRunPls,
  handleBootstrap,
}) {
  if (!pairs.length) return null;

  return (
    <div style={{ marginTop: "30px", display: "flex", gap: "12px", justifyContent: "center" }}>
      <button
        onClick={handleRunPls}
        disabled={loadingPls || loadingBoot}
        style={{
          padding: "12px 20px",
          background: loadingPls ? "#999" : "#059669",
          color: "white",
          border: "none",
          borderRadius: "6px",
        }}
      >
        {loadingPls ? "Đang chạy PLS..." : "Chạy PLS-SEM"}
      </button>

      <button
        onClick={handleBootstrap}
        disabled={loadingPls || loadingBoot}
        style={{
          padding: "12px 20px",
          background: loadingBoot ? "#999" : "#0ea5e9",
          color: "white",
          border: "none",
          borderRadius: "6px",
        }}
      >
        {loadingBoot ? "Đang bootstrap..." : "Bootstrap"}
      </button>
    </div>
  );
}
