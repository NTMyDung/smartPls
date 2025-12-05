import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUpload } from '../context/UploadContext.jsx';
import Variable from '../components/Variable.jsx';
import StepNavigation from '../components/StepNavigation.jsx';
import TableData from '../components/TableData.jsx';
import AnalysisHeader from '../components/AnalysisHeader.jsx';
import RunButtons from '../components/RunButtons.jsx';
import ModelDiagram from '../components/ModelDiagram.jsx';
import ResultTables from '../components/ResultTables.jsx';
import Notification from '../components/Notification.jsx';

export default function AnalysisPage() {
  const { uploadState, setUploadState } = useUpload();
  const navigate = useNavigate();
  const { fileName, result } = uploadState;

  const [isEditing, setIsEditing] = useState(false);
  const [editError, setEditError] = useState('');
  const [variables, setVariables] = useState(result?.variables || []);
  const [pairs, setPairs] = useState([]);
  const [modelResult, setModelResult] = useState(null);
  const [selectedTable, setSelectedTable] = useState(null);
  const [loadingPls, setLoadingPls] = useState(false);
  const [loadingBoot, setLoadingBoot] = useState(false);
  const [notification, setNotification] = useState(null);

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

        const res = await fetch('https://smartpls-2.onrender.com/upload-csv', {
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

  // Tạo model (PLS hoặc bootstrap)
  const handleCreateModel = async (action = "pls") => {
    if (!result || !result.session_id) {
      setNotification({ message: "Session không hợp lệ. Hãy upload lại CSV!", type: "error" });
      return;
    }
    if (!pairs.length) {
      setNotification({ message: "Hãy chọn ít nhất 1 cặp biến!", type: "error" });
      return;
    }

    // Bật loading đúng nút đã bấm
    if (action === "pls") setLoadingPls(true);
    if (action === "bootstrap") setLoadingBoot(true);

    try {
      const pairsForBackend = pairs.map(p => ({
        independent: Array.isArray(p.independent) ? p.independent : [p.independent],
        dependent: p.dependent,
      }));

      const res = await fetch("https://smartpls-2.onrender.com/create-model", {
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
        setNotification({ message: "Mô hình được tạo thành công!", type: "success" });
        setModelResult(data);
      } else {
        setNotification({ message: "Lỗi backend: " + (data.error || "Không thể tạo mô hình"), type: "error" });
      }
    } catch (err) {
      setNotification({ message: "Không thể kết nối server.", type: "error" });
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

  // RENDER MA TRẬN
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
            <th style={{ background: "rgb(255 245 211)" }}>LV</th>
            {cols.map(c => (
              <th key={c} style={{ background: "rgb(255 245 211)" }}>{c}</th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.map(r => (
            <tr key={r}>
              <td style={{ background: "rgb(160 201 255 / 20%)", color: "black" }}><b>{r}</b></td>
              {cols.map(c => (
                <td key={c}>{matrix[r]?.[c] ?? ""}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  // RENDER TABLE KEY-VALUE
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

  const { columns = [], preview = [], row_count = 0 } = result || {};

  return (
    <div style={{ padding: '2rem 7rem', margin: 'auto' }}>
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
      <AnalysisHeader
        fileName={fileName}
        rowCount={row_count}
        isEditing={isEditing}
        editError={editError}
        onEditFile={handleEditFile}
      />
      <TableData
        columns={columns}
        preview={preview}
      />
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
  );
}


