import './InstructionPage.css';

export default function InstructionPage() {
  return (
    <div className="theory-container">
      <div className="theory-hero">
        <h1>Hướng Dẫn Chuẩn Bị Dữ Liệu &amp; Chạy PLS-SEM</h1>
        <p>Instruction for preparing CSV data và sử dụng hệ thống SmartPLS-SEM</p>
      </div>

      <div className="theory-content">
        <section>
          <h2>1. Chuẩn bị dữ liệu</h2>
          <p>
            Để chạy mô hình PLS, bạn cần chuẩn bị bảng dữ liệu dạng bảng (dataset), mỗi dòng là một người trả lời,
            mỗi cột là một biến quan sát (indicator).
          </p>
          <p><strong>✔ Yêu cầu chung:</strong></p>
          <ul>
            <li>Dữ liệu dạng số (numeric)</li>
            <li>Không chứa ký tự đặc biệt</li>
            <li>Không có chữ cái trong cột dữ liệu</li>
            <li>Không chứa merge cells</li>
            <li>Cột đầu tiên không cần là ID</li>
            <li>
              Biến quan sát nên viết không dấu, ví dụ: <code>PU1</code>, <code>PU2</code>, <code>PU3</code>,{' '}
              <code>SAT1</code>, <code>SAT2</code>, <code>INT1</code>
            </li>
          </ul>
        </section>

        <section>
          <h2>2. Hướng dẫn tạo file CSV từ Excel</h2>
          <p>Dưới đây là cách đơn giản nhất để tạo file CSV dùng cho hệ thống.</p>

          <h3>Bước 1: Chuẩn bị dữ liệu trong Excel hoặc Google Sheets</h3>
          <p>Ví dụ cấu trúc (mỗi cột là một biến quan sát):</p>
        <table style={{ borderCollapse: 'collapse', border: '1px solid #000' , width: '50%',}}>
          <tr>
            <th style={{ border: '1px solid #000' }}>PU1</th>
            <th style={{ border: '1px solid #000' }}>PU2</th>
            <th style={{ border: '1px solid #000' }}>PU3</th>
            <th style={{ border: '1px solid #000' }}>SAT1</th>
            <th style={{ border: '1px solid #000' }}>SAT2</th>
            <th style={{ border: '1px solid #000' }}>INT1</th>
          </tr>
          <tr>
            <td style={{ border: '1px solid #000' , textAlign: 'center'}}>5</td>
            <td style={{ border: '1px solid #000' , textAlign: 'center'}} >3</td>
            <td style={{ border: '1px solid #000' , textAlign: 'center'}} >4</td>
            <td style={{ border: '1px solid #000' , textAlign: 'center'}} >2</td>
            <td style={{ border: '1px solid #000' , textAlign: 'center'}} >5</td>
            <td style={{ border: '1px solid #000' , textAlign: 'center'}} >4</td>
          </tr>
          <tr>
            <td style={{ border: '1px solid #000', textAlign: 'center'}} >4</td>
            <td style={{ border: '1px solid #000', textAlign: 'center'}} >5</td>
            <td style={{ border: '1px solid #000', textAlign: 'center'}} >4</td>
            <td style={{ border: '1px solid #000', textAlign: 'center'}} >5</td>
            <td style={{ border: '1px solid #000', textAlign: 'center'}} >3</td>
            <td style={{ border: '1px solid #000', textAlign: 'center'}} >5</td>
          </tr>
        </table>

          <h3>Bước 2: Đặt tên cột đúng chuẩn</h3>
          <ul>
            <li>Viết liền không dấu</li>
            <li>Không ký tự đặc biệt: -, /, @, %</li>
            <li>Không để trống tên cột</li>
            <li>
              Nên dùng cấu trúc: <strong>TÊN_BIẾN + SỐ THỨ TỰ</strong>, ví dụ:
              <ul>
                <li><code>PU1</code>, <code>PU2</code>, <code>PU3</code> (Perceived Usefulness)</li>
                <li><code>TR1</code>, <code>TR2</code> (Trust)</li>
                <li><code>BI1</code>, <code>BI2</code>, <code>BI3</code> (Behavioral Intention)</li>
              </ul>
            </li>
          </ul>

          <h3>Bước 3: Xuất file CSV</h3>
          <p><strong>Nếu dùng Excel:</strong></p>
          <ul>
            <li>File → Save As</li>
            <li>Chọn format: <strong>CSV UTF-8 (Comma delimited) (*.csv)</strong></li>
            <li>Lưu lại</li>
          </ul>
          <p><strong>Nếu dùng Google Sheets:</strong></p>
          <ul>
            <li>File → Download → Comma-separated values (.csv)</li>
          </ul>

          <h3>Bước 4: Kiểm tra file CSV</h3>
          <p>Mở bằng Notepad hoặc VSCode để kiểm tra:</p>
          <ul>
            <li>Dữ liệu phân cách bởi dấu phẩy <code>,</code></li>
            <li>Không có ký tự lạ</li>
            <li>Không lỗi font</li>
          </ul>
          <p><strong>✔ File CSV của bạn đã sẵn sàng!</strong></p>
        </section>

        <section>
          <h2>3. Tải dữ liệu lên hệ thống</h2>
          <p>Sau khi bạn có file CSV:</p>
          <ul>
            <li>Truy cập trang <strong>Phân Tích PLS-SEM</strong></li>
            <li>Nhấn <strong>Upload file</strong></li>
            <li>Chọn file <code>.csv</code> của bạn</li>
          </ul>
          <p>Hệ thống sẽ tự động:</p>
          <ul>
            <li>Đọc dữ liệu</li>
            <li>Hiển thị danh sách các biến</li>
            <li>Cho phép bạn chọn biến tiềm ẩn và chỉ báo tương ứng</li>
          </ul>
        </section>

        <section>
          <h2>4. Thiết lập mô hình PLS-SEM</h2>
          <h3>Bước 1: Chọn biến độc lập (Independent / Exogenous)</h3>
          <p>Ví dụ: <code>PU</code>, <code>PE</code>, <code>TR</code></p>

          <h3>Bước 2: Chọn biến phụ thuộc (Dependent / Endogenous)</h3>
          <p>Ví dụ: <code>SAT</code>, <code>INT</code></p>
        </section>

        <section>
          <h2>5. Chạy mô hình, tính toán PLS và Bootstrapping</h2>
          <p>Khi nhấn <strong>Chạy PLS-SEM</strong>, hệ thống sẽ tự động:</p>
          <h3>✔ Tính mô hình đo lường (Measurement Model)</h3>
          <ul>
            <li>Outer Loadings</li>
            <li>Composite Reliability</li>
            <li>Cronbach’s Alpha</li>
            <li>AVE</li>
            <li>HTMT</li>
          </ul>

          <h3>✔ Tính mô hình cấu trúc (Structural Model)</h3>
          <ul>
            <li>Path coefficients</li>
            <li>R²</li>
            <li>f²</li>
            <li>Q²</li>
          </ul>

          <h3>Tuỳ chọn: Bootstrapping</h3>
          <p>Nếu bạn chọn <strong>Bootstrapping</strong>, hệ thống có thể cung cấp:</p>
          <ul>
            <li>T-statistics</li>
            <li>P-value</li>
            <li>CI Percentile</li>
            <li>CI Bias-Corrected (BCa)</li>
          </ul>
        </section>

        <section>
          <h2>6. Đọc kết quả</h2>
          <h3>🔹 Measurement Model</h3>
          <ul>
            <li>Outer Loadings ≥ 0.708 → tốt</li>
            <li>CR (0.7–0.95) → đáng tin cậy</li>
            <li>AVE ≥ 0.50 → hội tụ tốt</li>
            <li>HTMT ≤ 0.9 → phân biệt tốt</li>
          </ul>

          <h3>🔹 Structural Model</h3>
          <ul>
            <li>Path coefficients: quan hệ mạnh/yếu</li>
            <li>P-value: kiểm định ý nghĩa</li>
            <li>R²: mức độ giải thích</li>
            <li>f²: mức độ ảnh hưởng</li>
            <li>Q² &gt; 0: mô hình có khả năng dự đoán</li>
          </ul>
        </section>
      </div>
    </div>
  );
}


