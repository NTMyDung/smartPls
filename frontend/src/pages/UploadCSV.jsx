
import { useState } from "react";

// Các component tách riêng
import UploadHeader from "./UploadCsv/UploadHeader";
import CSVPreview from "./UploadCsv/CSVPreview";
import PairSelector from "./UploadCsv/PairSelector";
import RunButtons from "./UploadCsv/RunButtons";
import ModelDiagram from "./UploadCsv/ModelDiagram";
import ResultTables from "./UploadCsv/ResultTables";

// Page: UploadCSV

export default function UploadCSV() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [pairs, setPairs] = useState([]);
  const [modelResult, setModelResult] = useState(null);
  const [selectedTable, setSelectedTable] = useState(null);

  // Loading riêng cho từng nút
  const [loadingPls, setLoadingPls] = useState(false);
  const [loadingBoot, setLoadingBoot] = useState(false);

  // Danh sách bảng theo từng action
  const TABLES_BY_ACTION = {
    pls: [
      { key: "path_coefficients", label: "Path Coefficients" },
      { key: "inner_summary", label: "Inner Summary" },
      { key: "outer_model", label: "Outer Model" },
      { key: "f2_effect_size", label: "Effect Size (f²)" },
      { key: "htmt", label: "HTMT (Matrix)" },
      { key: "fornell_larcker", label: "Fornell–Larcker (Matrix)" },
      { key: "outer_vif", label: "Outer VIF" },
      { key: "inner_vif", label: "Inner VIF" },
    ],
    bootstrap: [
      { key: "path_coefficients", label: "Path Coefficients" },
      { key: "outer_model", label: "Outer Model" },
      { key: "bootstrap_path", label: "Bootstrap Path" },
      { key: "bootstrap_loading", label: "Bootstrap Loading" },
    ],
  };

  // UPLOAD CSV
  const handleUpload = async () => {
    if (!file) return alert("Chọn file CSV trước!");

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("http://127.0.0.1:8000/upload-csv", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    setResult(data.summary);
  };

  // Tạo model (PLS hoặc bootstrap)
  const handleCreateModel = async (action = "pls") => {
    if (!result || !result.session_id) {
      alert("Session không hợp lệ. Hãy upload lại CSV!");
      return;
    }
    if (!pairs.length) {
      alert("Hãy chọn ít nhất 1 cặp biến!");
      return;
    }

    // Bật loading đúng nút đã bấm
    if (action === "pls") setLoadingPls(true);
    if (action === "bootstrap") setLoadingBoot(true);

    try {
      const pairsForBackend = pairs.map(p => ({
        independent: p.independent,
        dependent: p.dependent,
      }));

      const res = await fetch("http://127.0.0.1:8000/create-model", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pairs: pairsForBackend,
          session_id: result.session_id,
          action,
        }),
      });

      const data = await res.json();

      if (res.ok && data.status === "success") {
        alert("Mô hình được tạo thành công!");
        setModelResult(data);
      } else {
        alert("Lỗi backend: " + (data.error || "Không thể tạo mô hình"));
      }
    } catch (err) {
      alert("Không thể kết nối server.");
    } finally {
      if (action === "pls") setLoadingPls(false);
      if (action === "bootstrap") setLoadingBoot(false);
    }
  };

  const handleRunPls = () => handleCreateModel("pls");
  const handleBootstrap = () => handleCreateModel("bootstrap");

  // MAP KẾT QUẢ PLS → DIAGRAM
  const mapPLSResultToDiagram = (plsResult, action) => {
    const {
      path_coefficients,
      outer_model,
      latent_levels,
      inner_summary,
      bootstrap_path,
      bootstrap_loading,
    } = plsResult;

    const latentVariables = Object.keys(path_coefficients).map(lvId => ({
      id: lvId,
      label: lvId,
      level: latent_levels?.[lvId] ?? 1,
      rSquare:
        action === "pls" ? inner_summary?.["r_squared"]?.[lvId] ?? null : null,
    }));

    const manifestVariables = {};
    if (outer_model?.loading) {
      const lvNames = Object.keys(path_coefficients);
      lvNames.forEach(lvId => {
        manifestVariables[lvId] = Object.entries(outer_model.loading)
          .filter(([mvId]) => mvId.startsWith(lvId))
          .map(([mvId, loading]) => ({
            id: mvId,
            label: mvId,
            loading,
            pValue:
              action === "bootstrap"
                ? bootstrap_loading?.["p_t"]?.[mvId] ?? 0
                : undefined,
          }));
      });
    }

    const paths = [];
    Object.entries(path_coefficients).forEach(([from, targets]) => {
      Object.entries(targets).forEach(([to, coef]) => {
        if (from !== to && coef !== 0) {
          paths.push({
            from,
            to,
            coefficient: coef,
            pValue:
              action === "bootstrap"
                ? bootstrap_path?.["p_t"]?.[`${from} -> ${to}`] ?? 0
                : undefined,
          });
        }
      });
    });

    return { latentVariables, manifestVariables, paths };
  };

  // RENDER MA TRẬN (giữ nguyên)
  const renderMatrixTable = (matrix) => {
    if (!matrix || typeof matrix !== "object") return <p>Không có dữ liệu.</p>;

    const rows = Object.keys(matrix);
    const cols = Object.keys(matrix[rows[0]] || {});

    return (
      <table
        border="1"
        cellPadding="6"
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: "13px",
          textAlign: "center",
        }}
      >
        <thead>
          <tr>
            <th style={{ background: "#eee" }}>LV</th>
            {cols.map(c => (
              <th key={c} style={{ background: "#eee" }}>{c}</th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.map(r => (
            <tr key={r}>
              <td><b>{r}</b></td>
              {cols.map(c => (
                <td key={c}>{matrix[r]?.[c] ?? ""}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  // RENDER TABLE KEY-VALUE (giữ nguyên)
  const renderTable = (obj) => {
    if (!obj) return <p></p>;

    const isMatrix =
      typeof obj === "object" &&
      Object.values(obj).every(v => typeof v === "object");

    if (isMatrix) return renderMatrixTable(obj);

    return (
      <table
        border="1"
        cellPadding="6"
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: "13px",
        }}
      >
        <thead>
          <tr>
            <th style={{ background: "#041946ff", color: "white" }}>Key</th>
            <th style={{ background: "#eee" }}>Value</th>
          </tr>
        </thead>

        <tbody>
          {Object.entries(obj).map(([k, v]) => (
            <tr key={k}>
              <td style={{ fontWeight: "bold" }}>{k}</td>
              <td>
                {typeof v === "object"
                  ? (
                    <pre style={{ whiteSpace: "pre-wrap" }}>
                      {JSON.stringify(v, null, 2)}
                    </pre>
                  )
                  : String(v)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  return (
    <div style={{ padding: "20px" }}>
      {/* Upload + Header */}
      <UploadHeader file={file} setFile={setFile} handleUpload={handleUpload} />

      {/* Preview CSV */}
      <CSVPreview result={result} />

      {result && (
        <div>
          {/* Chọn cặp biến */}
          <PairSelector variables={result.variables} setPairs={setPairs} />

          {/* Nút chạy */}
          <RunButtons
            pairs={pairs}
            loadingPls={loadingPls}
            loadingBoot={loadingBoot}
            handleRunPls={handleRunPls}
            handleBootstrap={handleBootstrap}
          />

          {/* VẼ MÔ HÌNH */}
          {modelResult?.status === "success" && (
            <ModelDiagram
              modelResult={modelResult}
              diagramData={mapPLSResultToDiagram(modelResult, modelResult.action)}
            />
          )}

          {/* BẢNG KẾT QUẢ */}
          {modelResult?.status === "success" && (
            <ResultTables
              TABLES_BY_ACTION={TABLES_BY_ACTION}
              modelResult={modelResult}
              selectedTable={selectedTable}
              setSelectedTable={setSelectedTable}
              renderTable={renderTable}
            />
          )}
        </div>
      )}
    </div>
  );
}

