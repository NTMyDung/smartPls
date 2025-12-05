import LoadingModal from './LoadingModal';

export default function RunButtons({
  pairs,
  loadingPls,
  loadingBoot,
  handleRunPls,
  handleBootstrap,
}) {
  if (!pairs.length) return null;

  const isLoading = loadingPls || loadingBoot;
  const loadingMessage = loadingPls 
    ? "Đang chạy PLS-SEM..." 
    : loadingBoot 
    ? "Đang tính bootstrapping..." 
    : "Đang xử lý...";

  return (
    <>
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
            cursor: loadingPls || loadingBoot ? "not-allowed" : "pointer",
            transition: "all 0.2s ease",
            opacity: loadingPls || loadingBoot ? 0.7 : 1,
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
            cursor: loadingPls || loadingBoot ? "not-allowed" : "pointer",
            transition: "all 0.2s ease",
            opacity: loadingPls || loadingBoot ? 0.7 : 1,
          }}
        >
          {loadingBoot ? "Đang tính bootstrapping..." : "Bootstraping"}
        </button>
      </div>
      
      <LoadingModal isOpen={isLoading} message={loadingMessage} />
    </>
  );
}
