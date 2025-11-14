import { useState } from "react";
import Variable from "../component/Variable";
import StepNavigation from "../component/StepNavigation";

export default function UploadCSV() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);

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
            <p><i>* Hãy chắc chắn rằng file của bạn có cột đầu tiên là STT. Nếu không kết quả có thể khác mong đợi!</i></p>
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
            <div style={{ marginTop: "20px" }}>
                <h3>Các biến được phân tích từ File:</h3>                   
                <Variable variables={result.variables} />
            </div>

            {/* =================== STEP NAVIGATION =================== */}
            <h3>Tiến hành chọn các cặp biến </h3>
            <StepNavigation variables={result.variables} />
        </div> 
    )}
    </div>
  );
}
