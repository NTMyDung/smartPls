<<<<<<< HEAD:frontend/src/pages/Analysis.jsx
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
=======
import { useState } from "react";
import Variable from "../component/Variable";
import StepNavigation from "../component/StepNavigation";
import SmartPLSDiagram from "../component/model";

// Page: UploadCSV
// Mục đích: Cho phép người dùng tải file CSV lên, hiển thị thông tin tóm tắt
// (columns, preview, variables), sau đó dùng component `StepNavigation`
// để chọn các cặp biến và gửi yêu cầu tạo mô hình lên backend.
// Các handler chính:
// - handleUpload: gửi file lên endpoint `/upload-csv`, nhận về `summary` và lưu vào state `result`.
// - handleCreateModel: gửi `pairs` + `result` (summary) và `action` ('pls'|'bootstrap') lên endpoint `/create-model`.

//Chọn file và trả về 10 dòng đầu
export default function UploadCSV() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
>>>>>>> parent of 6b0ed1e (complete):frontend/src/pages/UploadCSV.jsx
  const [pairs, setPairs] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [modelResult, setModelResult] = useState(null);
<<<<<<< HEAD:frontend/src/pages/Analysis.jsx
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
=======

  const handleUpload = async () => {
    if (!file) return alert("Chọn file CSV trước!");
>>>>>>> parent of 6b0ed1e (complete):frontend/src/pages/UploadCSV.jsx

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

  // Hàm gửi request chạy model
  // Nhận tham số `action` ('pls' hoặc 'bootstrap').
  const handleCreateModel = async (action = "pls") => {
<<<<<<< HEAD:frontend/src/pages/Analysis.jsx
    if (!result || !result.session_id) {
      setNotification({ message: "Session không hợp lệ. Hãy upload lại CSV!", type: "error" });
      return;
    }
    if (!pairs.length) {
      setNotification({ message: "Hãy chọn ít nhất 1 cặp biến!", type: "error" });
      return;
=======
  // 1️⃣ Kiểm tra trước khi gửi lên backend
  if (!result || !result.session_id) {
    alert("Session không hợp lệ hoặc đã hết hạn. Vui lòng upload lại file CSV!");
    return;
  }

  if (!action) {
    alert("Hành động mô hình không hợp lệ!");
    return;
  }

  if (!pairs || pairs.length === 0) {
    alert("Vui lòng chọn ít nhất 1 cặp biến!");
    return;
  }

  setIsCreating(true);

  try {
    // 2️⃣ Chuẩn hóa dữ liệu gửi lên backend
    const pairsForBackend = pairs.map(p => ({
      independent: p.independent,
      dependent: p.dependent
    }));

    console.log("Pairs gửi lên:", pairsForBackend);
    console.log("session_id gửi lên:", result.session_id);
    console.log("action:", action);

    // 3️⃣ Gửi request
    const res = await fetch("http://127.0.0.1:8000/create-model", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        pairs: pairsForBackend,
        session_id: result.session_id,
        action: action,
      }),
    });

    // 4️⃣ Xử lý kết quả
    const data = await res.json();

    if (res.ok && data.status === "success") {
      alert("Mô hình được tạo thành công!");
      console.log("data:", data);
      setModelResult(data);
    } else {
      alert("Lỗi backend: " + (data.error || "Không thể tạo mô hình"));
      setModelResult(null);
>>>>>>> parent of 6b0ed1e (complete):frontend/src/pages/UploadCSV.jsx
    }
  } catch (error) {
    console.error("Error:", error);

    // 5️⃣ Nếu lỗi fetch → thường là session hết hạn hoặc backend không nhận session_id
    alert("Không thể kết nối server. Vui lòng upload lại file CSV và thử lại!");

<<<<<<< HEAD:frontend/src/pages/Analysis.jsx
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
=======
  } finally {
    setIsCreating(false);
  }
};

>>>>>>> parent of 6b0ed1e (complete):frontend/src/pages/UploadCSV.jsx

 const mapPLSResultToDiagram = (plsResult) => {
  const { path_coefficients, outer_model, latent_levels, inner_summary } = plsResult;

<<<<<<< HEAD:frontend/src/pages/Analysis.jsx
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
=======
  // 1. Lấy latent variables với level từ backend
  const latentVariables = Object.keys(path_coefficients).map((lvId) => ({
    id: lvId,
    label: lvId,
    level: latent_levels?.[lvId] ?? 1, // fallback level = 1 nếu không có
     rSquare: inner_summary?.["r_squared"]?.[lvId] ?? null,
  }));

  console.log("Latent variables:", latentVariables);

  // 2. Lấy manifest variables từ outer_model
  const manifestVariables = {};
  if (outer_model?.loading) {
    const lvNames = Object.keys(path_coefficients);
    lvNames.forEach((lvId) => {
      manifestVariables[lvId] = Object.entries(outer_model.loading)
        .filter(([mvId]) => mvId.startsWith(lvId)) // giả định MV bắt đầu bằng LV id
        .map(([mvId, loading]) => ({
          id: mvId,
          label: mvId,
          loading,
        }));
    });
  }

  // 3. Lấy paths
  const paths = [];
  Object.entries(path_coefficients).forEach(([from, targets]) => {
    Object.entries(targets).forEach(([to, coef]) => {
      if (from !== to && coef !== 0) {
        paths.push({
          from,
          to,
          coefficient: coef,
          pValue: plsResult.inner_model?.["p>|t|"]?.[`${from} -> ${to}`] ?? 0,
        });
      }
    });
  });

  return { latentVariables, manifestVariables, paths };
};
>>>>>>> parent of 6b0ed1e (complete):frontend/src/pages/UploadCSV.jsx

  const handleRunPls = () => handleCreateModel("pls");
  const handleBootstrap = () => handleCreateModel("bootstrap");

<<<<<<< HEAD:frontend/src/pages/Analysis.jsx
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
=======
    return (
        <div style={{ padding: "20px" }}>
        <h1>Tải CSV + Xử lý</h1>

        <input
            type="file"
            accept=".csv"
            onChange={(e) => setFile(e.target.files[0])}
        />

        <button onClick={handleUpload} style={{ marginLeft: "10px" }}>
            Upload
        </button>
>>>>>>> parent of 6b0ed1e (complete):frontend/src/pages/UploadCSV.jsx

        {result && (
            <div style={{ marginTop: "30px" }}>
            
            {/* =================== THÔNG TIN =================== */}
            <h2>Kết quả thống kê</h2>

            <p>{result.row_count} dòng / {result.columns.length} cột</p>
            {/* <p><i>* Hãy chắc chắn rằng file của bạn có cột đầu tiên là STT. Nếu không kết quả có thể khác mong đợi!</i></p> */}
            {/* =================== PREVIEW =================== */}

            <div
                style={{
                maxHeight: "300px", // chiều cao tối đa khung
                maxWidth: "100%", // chiều rộng tối đa
                overflow: "auto", // hiện thanh trượt khi vượt quá kích thước
                border: "1px solid #ccc", // viền khung
                marginBottom: "30px",
                }}
            >
                <table
                border="1"
                cellPadding="8"
                style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontSize: "12px",
                    textAlign: "center", // căn giữa các ô
                }}
                >
                <thead>
                    <tr>
                    {result.columns.map((col) => (
                        <th key={col} style={{ backgroundColor: "#f0f0f0" }}>
                        {col}
                        </th>
                    ))}
                    </tr>
                </thead>

                <tbody>
                    {result.preview.map((row, i) => (
                    <tr key={i}>
                        {result.columns.map((col) => (
                        <td key={col}>{String(row[col])}</td>
                        ))}
                    </tr>
                    ))}
                </tbody>
                </table>
            </div>
            {/* =================== Thống kê biến đọc từ file =================== */}
            <div style={{ marginTop: "20px" }}>
                <h3>Các biến được phân tích từ File:</h3>                   
                <Variable variables={result.variables} />
            </div>

<<<<<<< HEAD:frontend/src/pages/Analysis.jsx
  const { columns = [], preview = [], row_count = 0 } = result || {};

  return (
    <div style={{ padding: '2rem 7rem', margin: '74px auto 74px auto' }}>
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


=======
            {/* =================== Chọn các cặp biến =================== */}
            <h3>Tiến hành chọn các cặp biến </h3>
            <StepNavigation variables={result.variables} onPairsChange={setPairs} />

            {/* =================== Tạo 2 nút Chạy PLS và Bootstrap =================== */}
            {pairs.length > 0 && (
              <div style={{ marginTop: "30px", textAlign: "center", display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <button
                  onClick={handleRunPls}
                  disabled={isCreating}
                  style={{
                    padding: "12px 20px",
                    backgroundColor: isCreating ? "#999" : "#059669",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: isCreating ? "not-allowed" : "pointer",
                    fontSize: "16px",
                    fontWeight: "bold",
                    transition: "all 0.3s ease"
                  }}
                >
                  {isCreating ? "Đang tạo mô hình..." : "Chạy PLS-SEM"}
                </button>

                <button
                  onClick={handleBootstrap}
                  disabled={isCreating}
                  style={{
                    padding: "12px 20px",
                    backgroundColor: isCreating ? "#999" : "#0ea5e9",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: isCreating ? "not-allowed" : "pointer",
                    fontSize: "16px",
                    fontWeight: "bold",
                    transition: "all 0.3s ease"
                  }}
                >
                  {isCreating ? "Đang chạy bootstrap..." : "Bootstrap"}
                </button>
              </div>
            )}

            {/* =================== Hiển thị biểu đồ SmartPLS nếu mô hình chạy thành công =================== */}
            {modelResult && modelResult.status === "success" && (
              <div style={{ marginTop: "40px" }}>
                {console.log("Mapped diagram data:", mapPLSResultToDiagram(modelResult))}
                <SmartPLSDiagram data={mapPLSResultToDiagram(modelResult)} />
              </div>
            )}
        </div> 
    )}
    </div>
  );
}
>>>>>>> parent of 6b0ed1e (complete):frontend/src/pages/UploadCSV.jsx
