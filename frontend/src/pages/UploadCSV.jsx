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
  const [pairs, setPairs] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [modelResult, setModelResult] = useState(null);

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

  // Hàm gửi request chạy model
  // Nhận tham số `action` ('pls' hoặc 'bootstrap').
  const handleCreateModel = async (action = "pls") => {
    if (pairs.length === 0) {
      alert("Vui lòng chọn ít nhất 1 cặp biến!");
      return;
    }
    // Đánh dấu UI là đang chạy
    setIsCreating(true);
    //Gửi dữ liệu lên BE (sử dụng session_id thay vì truyền toàn bộ data)
    try {
      // Loại bỏ field `id` từ pairs vì backend model không cần nó
      const pairsForBackend = pairs.map(p => ({
        independent: p.independent,
        dependent: p.dependent
      }));
      console.log("Pairs gửi lên:", pairsForBackend);
      console.log("result.session_id:", result.session_id);
      console.log("action:", action);


      const res = await fetch("http://127.0.0.1:8000/create-model", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pairs: pairsForBackend,
          session_id: result.session_id,  // Gửi session_id để backend lấy full data
          action: action,
        }),
      });

      //Chờ & lấy KQ trả về
      const data = await res.json();
      if (res.ok) {
        alert("Mô hình được tạo thành công!");
        console.log(data);
        // Lưu kết quả mô hình để hiển thị biểu đồ
        setModelResult(data);
      } else {
        alert("Lỗi: " + (data.error || "Không thể tạo mô hình"));
        setModelResult(null);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Lỗi kết nối: " + error.message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleRunPls = () => handleCreateModel("pls");
  const handleBootstrap = () => handleCreateModel("bootstrap");

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
                <SmartPLSDiagram data={modelResult.diagram} />
                console.log("modelResult:", modelResult);
              </div>
            )}
        </div> 
    )}
    </div>
  );
}
