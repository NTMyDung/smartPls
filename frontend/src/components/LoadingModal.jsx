import './LoadingModal.css';

export default function LoadingModal({ isOpen, message = "Đang xử lý..." }) {
  if (!isOpen) return null;

  return (
    <div className="loading-modal-overlay">
      <div className="loading-modal-container">
        <div className="loading-spinner">
          <svg viewBox="0 0 50 50" width="60" height="60">
            <style>{`@keyframes spin {to {transform: rotate(360deg);}}`}</style>
            <circle
              cx="25"
              cy="25"
              r="20"
              fill="none"
              strokeWidth="6"
              stroke="url(#grad)"
              strokeLinecap="round"
              strokeDasharray="70 45"
              style={{
                transformOrigin: "50% 50%",
                animation: "spin 1s linear infinite",
              }}
            />
            <defs>
              <linearGradient id="grad">
                <stop offset="0%" stopColor="#ff8fab" />
                <stop offset="30%" stopColor="#bde0fe" />
                <stop offset="60%" stopColor="#caffbf" />
                <stop offset="100%" stopColor="#ffd6a5" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        <div className="loading-content">
          <h3 className="loading-title">{message}</h3>
          <p className="loading-subtitle">Vui lòng đợi trong giây lát...</p>
        </div>
        <div className="loading-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    </div>
  );
}

