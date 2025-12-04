import './TheoryPage.css';

export default function TheoryPage() {
  return (
    <div className="theory-container">
      <div className="theory-hero">
        <h1>Lý Thuyết Cơ Bản về PLS-SEM</h1>
        <p>(Partial Least Squares – Structural Equation Modeling)</p>
      </div>

      <div className="theory-content">
        <section>
          <p>
            Phương pháp <strong>PLS-SEM</strong> (Partial Least Squares Structural Equation Modeling) là một kỹ thuật
            mô hình hóa thống kê mạnh mẽ, dùng để phân tích các mối quan hệ phức tạp giữa nhiều biến số. Phương pháp
            này đặc biệt phù hợp với các mô hình có:
          </p>
          <ul>
            <li>Nhiều biến tiềm ẩn (latent variables)</li>
            <li>Nhiều chỉ báo quan sát (indicators)</li>
            <li>Mẫu nhỏ hoặc dữ liệu không phân phối chuẩn</li>
            <li>Mục tiêu dự đoán (prediction-oriented)</li>
          </ul>
          <p>
            PLS-SEM thường được sử dụng rộng rãi trong <strong>Quản trị – Marketing – Hệ thống thông tin – Hành vi người dùng – Tài chính – Giáo dục</strong>,
            và cả các mô hình AI nghiên cứu hành vi.
          </p>
        </section>

        <section>
          <h2>1. Mục tiêu của PLS-SEM</h2>
          <p>PLS-SEM tối ưu hóa 2 mục tiêu chính:</p>
          <ol>
            <li>
              <strong>Tối đa hóa phương sai được giải thích (R²)</strong> → Tập trung vào khả năng dự đoán của mô hình.
            </li>
            <li>
              <strong>Ước lượng bền vững dù dữ liệu không chuẩn hóa</strong> → Không đòi hỏi phân phối chuẩn, không đòi hỏi mẫu lớn.
            </li>
          </ol>
        </section>

        <section>
          <h2>2. Cấu trúc mô hình PLS gồm hai phần</h2>
          <p>PLS-SEM chia mô hình thành:</p>
          <h3>(A) Mô hình đo lường (Measurement Model)</h3>
          <p>Mô tả mối quan hệ giữa các biến tiềm ẩn (LV) và các chỉ báo (indicators).</p>
          <p>Có 2 loại chính:</p>
          <ol>
            <li>
              <strong>Mô hình phản xạ (Reflective)</strong> – Biến tiềm ẩn → gây ra chỉ báo.
              <br />
              <em>Ví dụ:</em> “Sự hài lòng” → ảnh hưởng đến “Tôi thích sản phẩm”, “Tôi muốn mua lại”.
            </li>
            <li>
              <strong>Mô hình hình thành (Formative)</strong> – Chỉ báo → tạo nên biến tiềm ẩn.
              <br />
              <em>Ví dụ:</em> “Chất lượng dịch vụ” = tốc độ + đề xuất + độ tin cậy.
            </li>
          </ol>

          <h3>(B) Mô hình cấu trúc (Structural Model)</h3>
          <p>Biểu diễn mối quan hệ giữa các biến tiềm ẩn với nhau (paths).</p>
          <p>
            <em>Ví dụ:</em>
          </p>
          <ul>
            <li>Tiện ích cảm nhận (PU) → Ý định sử dụng (BI)</li>
            <li>Tin tưởng (TR) → Hành vi mua hàng (BH)</li>
          </ul>
        </section>

        <section>
          <h2>3. Các chỉ số quan trọng trong PLS-SEM</h2>

          <h3>Measurement Model (Reflective)</h3>
          <ul>
            <li>
              <strong>Indicator Reliability (Outer Loadings)</strong> – Tiêu chuẩn: ≥ 0.708 (thấp hơn có thể giữ lại nếu AVE cao).
            </li>
            <li>
              <strong>Internal Consistency</strong>
              <ul>
                <li>Cronbach’s Alpha (CA) ≥ 0.7</li>
                <li>Composite Reliability (CR) 0.7 – 0.95</li>
              </ul>
            </li>
            <li>
              <strong>Convergent Validity (Hội tụ)</strong> – AVE ≥ 0.5.
            </li>
            <li>
              <strong>Discriminant Validity (Phân biệt)</strong>
              <ul>
                <li>Fornell–Larcker</li>
                <li>HTMT (prefer) ≤ 0.85 – 0.90</li>
              </ul>
            </li>
          </ul>

          <h3>Formative Measurement Model</h3>
          <ul>
            <li>Significance (Bootstrapping of Weights)</li>
            <li>Multicollinearity (VIF &lt; 3.3)</li>
          </ul>

          <h3>Structural Model</h3>
          <ul>
            <li>
              <strong>Độ phù hợp nội bộ</strong> – R² (hệ số giải thích)
              <ul>
                <li>0.75 = cao</li>
                <li>0.50 = trung bình</li>
                <li>0.25 = thấp</li>
              </ul>
            </li>
            <li>
              <strong>f² (effect size)</strong>
              <ul>
                <li>0.02 nhỏ</li>
                <li>0.15 trung bình</li>
                <li>0.35 lớn</li>
              </ul>
            </li>
            <li>
              <strong>Q² (predictive relevance)</strong> – Q² &gt; 0 → mô hình có ý nghĩa dự đoán.</li>
            <li>
              <strong>Path Coefficients + Bootstrapping</strong> – p-value, t-statistics, confidence intervals (bias-corrected hoặc BCa).
            </li>
          </ul>
        </section>

        <section>
          <h2>4. Ưu điểm của PLS-SEM</h2>
          <ul>
            <li>Không yêu cầu phân phối chuẩn</li>
            <li>Phù hợp mẫu nhỏ (n = 30–100)</li>
            <li>Ước lượng ổn định cho mô hình phức tạp</li>
            <li>Phù hợp nghiên cứu khám phá</li>
            <li>Kết hợp tốt với dữ liệu lớn hoặc machine learning</li>
            <li>Hỗ trợ phân tích đa nhóm (MGA)</li>
          </ul>
        </section>

        <section>
          <h2>5. Khi nào không nên dùng PLS-SEM</h2>
          <ul>
            <li>Khi mục tiêu là kiểm định lý thuyết chặt chẽ</li>
            <li>Khi dữ liệu chuẩn hóa tốt &gt; 500 mẫu (CB-SEM tốt hơn)</li>
            <li>Khi cần đánh giá độ phù hợp mô hình (model fit) chính xác</li>
          </ul>
        </section>

        <section>
          <h2>6. Quy trình tính toán trong PLS (PLS Algorithm)</h2>
          <ol>
            <li>Khởi tạo trọng số (Initialize Weights)</li>
            <li>Ước lượng điểm số biến tiềm ẩn (LV Scores)</li>
            <li>Ước lượng outer model (loadings/weights)</li>
            <li>Ước lượng inner model (path coefficients)</li>
            <li>Lặp lại đến khi hội tụ (Iterative Convergence)</li>
            <li>Bootstrapping để kiểm định ý nghĩa thống kê</li>
            <li>Tính R², f², Q², HTMT, AVE, CR…</li>
          </ol>
        </section>

        <section>
          <h2>7. Bootstrapping trong PLS</h2>
          <p>Bootstrapping là kỹ thuật tái mẫu (resampling) để:</p>
          <ul>
            <li>Kiểm định path coefficients</li>
            <li>Kiểm định outer loadings</li>
            <li>Tính p-value</li>
            <li>Tính confidence interval (BCa, percentile)</li>
          </ul>
          <p>Số lượng bootstrap thường: 500 – 2000 mẫu (phổ biến nhất 5000 mẫu).</p>
        </section>

        <section>
          <h2>8. Các kết quả thường xem trong một báo cáo PLS-SEM</h2>
          <ul>
            <li>Outer Loadings</li>
            <li>Weights (nếu là formative)</li>
            <li>CR, CA</li>
            <li>AVE</li>
            <li>HTMT</li>
            <li>R²</li>
            <li>Q²</li>
            <li>f²</li>
            <li>Path Coefficients</li>
            <li>Bootstrapped T-statistics</li>
            <li>Confidence Intervals</li>
            <li>Phân tích trung gian (Mediation)</li>
            <li>Phân tích điều tiết (Moderation)</li>
          </ul>
        </section>

        <section>
          <h2>9. Ứng dụng của PLS-SEM trong thực tế</h2>
          <ul>
            <li>Mô hình hành vi người dùng (TAM, UTAUT, IS Success)</li>
            <li>Marketing: Loyalty, Satisfaction, Perception</li>
            <li>Thương mại điện tử: Trust → Purchase Intention</li>
            <li>HRM, chiến lược doanh nghiệp</li>
            <li>Giáo dục &amp; khoa học xã hội</li>
            <li>Phân tích khảo sát &amp; dữ liệu nhỏ</li>
          </ul>
        </section>
      </div>
    </div>
  );
}


