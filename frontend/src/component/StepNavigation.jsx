import { useState, useRef, useEffect } from "react";
import "./StepNavigation.css";

export default function StepNavigation({ variables = [] }) {
  const [pairs, setPairs] = useState([]);
  const [currentIndependent, setCurrentIndependent] = useState([]);
  const [currentDependent, setCurrentDependent] = useState(null);
  const [showIndependentDropdown, setShowIndependentDropdown] = useState(false);
  const [showDependentDropdown, setShowDependentDropdown] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [editingId, setEditingId] = useState(null);
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  
  const dropdownRefIndependent = useRef(null);
  const dropdownRefDependent = useRef(null);

  // Lọc các biến cho dropdown phụ thuộc (chỉ loại trừ biến độc lập trong cơn chọn hiện tại)
  const availableDependentVars = variables.filter(
    (v) => !currentIndependent.includes(v)
  );

  // Lọc các biến cho dropdown độc lập (chỉ loại trừ biến phụ thuộc trong cơn chọn hiện tại)
  const availableIndependentVars = variables.filter(
    (v) => v !== currentDependent
  );

  // Đóng dropdown khi nhấp ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRefIndependent.current && !dropdownRefIndependent.current.contains(event.target)) {
        setShowIndependentDropdown(false);
      }
      if (dropdownRefDependent.current && !dropdownRefDependent.current.contains(event.target)) {
        setShowDependentDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectIndependent = (variable) => {
    if (currentIndependent.includes(variable)) {
      setCurrentIndependent(currentIndependent.filter((v) => v !== variable));
    } else {
      setCurrentIndependent([...currentIndependent, variable]);
    }
  };

  const handleSelectDependent = (variable) => {
    setCurrentDependent(currentDependent === variable ? null : variable);
  };

  const handleAddPair = () => {
    // Kiểm tra điều kiện: biến độc lập không được là biến phụ thuộc
    if (currentIndependent.includes(currentDependent)) {
      alert("Biến phụ thuộc không được là biến độc lập!");
      return;
    }
    
    if (currentIndependent.length > 0 && currentDependent) {
      if (editingId) {
        // Cập nhật cặp đang edit
        setPairs(pairs.map(p => 
          p.id === editingId 
            ? { ...p, independent: [...currentIndependent], dependent: currentDependent }
            : p
        ));
        setEditingId(null);
      } else {
        // Thêm cặp mới
        const newPair = {
          id: Date.now(),
          independent: [...currentIndependent],
          dependent: currentDependent
        };
        setPairs([...pairs, newPair]);
      }
      setCurrentIndependent([]);
      setCurrentDependent(null);
      setShowIndependentDropdown(false);
      setShowDependentDropdown(false);
    } else {
      alert("Vui lòng chọn ít nhất 1 biến độc lập và 1 biến phụ thuộc!");
    }
  };

  const handleEditPair = (pair) => {
    setEditingId(pair.id);
    setCurrentIndependent([...pair.independent]);
    setCurrentDependent(pair.dependent);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setCurrentIndependent([]);
    setCurrentDependent(null);
  };

  const handleRemovePair = (id) => {
    setPairs(pairs.filter(p => p.id !== id));
    if (editingId === id) {
      handleCancelEdit();
    }
  };

  const handleClearAll = () => {
    setPairs([]);
    setCurrentIndependent([]);
    setCurrentDependent(null);
    setShowConfirmClear(false);
  };

  const handleConfirmClear = () => {
    setShowConfirmClear(true);
  };

  return (
    <div>
      {/* Hiển thị biến đang chọn */}
      {(currentIndependent.length > 0 || currentDependent) && (
        <div className="current-selection-container">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
            <h4 style={{ margin: 0 }}>Biến đang chọn:</h4>
          </div>
          
          <div style={{ display: "flex", gap: "15px", alignItems: "center" }}>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", flex: 2 }}>
              {currentIndependent.map((variable) => (
                <span
                  key={variable}
                  className="selected-variable"
                >
                  {variable}
                  <button
                    onClick={() => setCurrentIndependent(currentIndependent.filter(v => v !== variable))}
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
            
            {currentIndependent.length > 0 && currentDependent && (
              <span style={{ color: "#999", fontSize: "16px" }}>→</span>
            )}
            
            <div style={{ flex: 1, display: "flex", gap: "8px", alignItems: "center", justifyContent: "space-between" }}>
              {currentDependent && (
                <span className="selected-variable dependent">
                  {currentDependent}
                  <button
                    onClick={() => setCurrentDependent(null)}
                  >
                    ✕
                  </button>
                </span>
              )}
              
              <button
                onClick={handleAddPair}
                className="btn-add"
                style={{ whiteSpace: "nowrap" }}
              >
                {editingId ? "Cập nhật" : "Thêm"}
              </button>

              {editingId && (
                <button
                  onClick={handleCancelEdit}
                  className="btn-cancel"
                  style={{ whiteSpace: "nowrap" }}
                >
                  Hủy
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      <p></p>

      <div className="step-navigation-container">
        {/* Step 1 - Chọn biến độc lập */}
        <div className="step-dropdown-wrapper" ref={dropdownRefIndependent}>
          <button
            onClick={() => {
              setActiveStep(0);
              setShowIndependentDropdown(!showIndependentDropdown);
            }}
            className={`step-button ${activeStep === 0 ? 'active' : ''}`}
          >
            {currentIndependent.length > 0 
              ? `Chọn biến độc lập (${currentIndependent.length})`
              : "Chọn biến độc lập"
            }
          </button>

          {/* Dropdown Biến độc lập */}
          {showIndependentDropdown && (
            <div className="dropdown-menu">
              {availableIndependentVars.length > 0 ? (
                availableIndependentVars.map((variable) => (
                  <div
                    key={variable}
                    onClick={() => handleSelectIndependent(variable)}
                    className={`dropdown-item ${currentIndependent.includes(variable) ? 'selected' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={currentIndependent.includes(variable)}
                      onChange={() => {}}
                      style={{ cursor: "pointer" }}
                    />
                    <span>{variable}</span>
                  </div>
                ))
              ) : (
                <div className="dropdown-empty">
                  Không có biến
                </div>
              )}
            </div>
          )}
        </div>

        {/* Arrow */}
        <div className="step-arrow">→</div>

        {/* Step 2 - Chọn biến phụ thuộc */}
        <div className="step-dropdown-wrapper" ref={dropdownRefDependent}>
          <button
            onClick={() => {
              setActiveStep(1);
              setShowDependentDropdown(!showDependentDropdown);
            }}
            className={`step-button ${activeStep === 1 ? 'active' : ''}`}
          >
            {currentDependent ? `Chọn biến phụ thuộc (${currentDependent})` : "Chọn biến phụ thuộc"}
          </button>

          {/* Dropdown Biến phụ thuộc */}
          {showDependentDropdown && (
            <div className="dropdown-menu">
              {availableDependentVars.length > 0 ? (
                availableDependentVars.map((variable) => (
                  <div
                    key={variable}
                    onClick={() => handleSelectDependent(variable)}
                    className={`dropdown-item ${currentDependent === variable ? 'selected' : ''}`}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <input
                        type="radio"
                        name="dependent"
                        checked={currentDependent === variable}
                        onChange={() => {}}
                        style={{ cursor: "pointer" }}
                      />
                      <span>{variable}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="dropdown-empty">
                  Không có biến
                </div>
              )}
            </div>
          )}
        </div>

        {/* Remove Button */}
        <button
          onClick={handleConfirmClear}
          className="btn-clear"
        >
          ✕
        </button>
      </div>

      {/* Confirm Clear Popup */}
      {showConfirmClear && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: "white",
            borderRadius: "8px",
            padding: "20px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
            maxWidth: "400px",
            textAlign: "center"
          }}>
            <h3 style={{ margin: "0 0 15px 0", color: "#333" }}>Xác nhận xóa</h3>
            <p style={{ margin: "0 0 20px 0", color: "#666" }}>
              Bạn có chắc chắn muốn xóa tất cả các cặp biến đã chọn?
            </p>
            <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
              <button
                onClick={() => setShowConfirmClear(false)}
                style={{
                  backgroundColor: "#e5e7eb",
                  color: "#333",
                  border: "none",
                  borderRadius: "6px",
                  padding: "10px 20px",
                  cursor: "pointer",
                  fontWeight: "500",
                  fontSize: "14px",
                  transition: "all 0.3s ease"
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = "#d1d5db";
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = "#e5e7eb";
                }}
              >
                Hủy
              </button>
              <button
                onClick={handleClearAll}
                style={{
                  backgroundColor: "#ff4444",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  padding: "10px 20px",
                  cursor: "pointer",
                  fontWeight: "500",
                  fontSize: "14px",
                  transition: "all 0.3s ease"
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = "#cc0000";
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = "#ff4444";
                }}
              >
                Xóa tất cả
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hiển thị các cặp biến đã chọn */}
      {pairs.length > 0 && (
        <div className="pairs-container">
          <h4>Các cặp biến đã chọn:</h4>
          
          <div className="pairs-list">
            {pairs.map((pair, index) => (
              <div
                key={pair.id}
                className={`pair-item ${editingId === pair.id ? 'editing' : ''}`}
              >
                <div className="pair-content">
                  <span className="pair-number">#{index + 1}</span>
                  
                  <div className="pair-variables">
                    {pair.independent.map((v) => (
                      <span
                        key={v}
                        className="variable-tag independent"
                      >
                        {v}
                      </span>
                    ))}
                    
                    <span style={{ color: "#999" }}>→</span>
                    
                    <span
                      className="variable-tag dependent"
                    >
                      {pair.dependent}
                    </span>
                  </div>
                </div>
                
                <div className="pair-buttons">
                  <button
                    onClick={() => handleEditPair(pair)}
                    className="btn-edit"
                  >
                    Chỉnh sửa
                  </button>
                  
                  <button
                    onClick={() => handleRemovePair(pair.id)}
                    className="btn-remove"
                  >
                    Xóa
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
