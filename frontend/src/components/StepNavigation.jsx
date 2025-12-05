import { useState, useEffect } from "react";
import "./StepNavigation.css";

// StepNavigation (new design)
// - Mỗi hàng: 1 biến độc lập + nhiều biến phụ thuộc
// - Không trùng biến độc lập giữa các hàng
// - Không trùng biến phụ thuộc trong cùng hàng, và không được trùng với biến độc lập của hàng đó
// - onPairsChange: callback nhận danh sách các cặp { independent, dependent }

export default function StepNavigation({ variables = [], onPairsChange }) {
  const [rows, setRows] = useState([
    { id: Date.now(), independent: "", dependents: [""] },
  ]);

  // Cập nhật kết quả cho cha mỗi khi rows thay đổi
  useEffect(() => {
    if (!onPairsChange) return;

    const pairs = rows.flatMap((row) => {
      if (!row.independent) return [];
      return row.dependents
        .filter(Boolean)
        .map((dep) => ({ independent: row.independent, dependent: dep }));
    });

    onPairsChange(pairs);
  }, [rows, onPairsChange]);

  const usedIndependentVars = rows
    .map((r) => r.independent)
    .filter(Boolean);

  const canAddRow = variables.some(
    (v) => !usedIndependentVars.includes(v)
  );

  const handleIndependentChange = (rowId, value) => {
    setRows((prev) =>
      prev.map((row) =>
        row.id === rowId
          ? {
              ...row,
              independent: value,
              // Xoá các phụ thuộc trùng với independent mới (nếu có)
              dependents: row.dependents.map((d) => (d === value ? "" : d)),
            }
          : row
      )
    );
  };

  const handleDependentChange = (rowId, depIndex, value) => {
    setRows((prev) =>
      prev.map((row) => {
        if (row.id !== rowId) return row;

        if (!value) {
          const newDeps = [...row.dependents];
          newDeps[depIndex] = "";
          return { ...row, dependents: newDeps };
        }

        if (value === row.independent) return row;

        const usedByOthers = row.dependents.filter(
          (d, idx) => idx !== depIndex && d
        );
        if (usedByOthers.includes(value)) return row;

        const newDeps = [...row.dependents];
        newDeps[depIndex] = value;
        return { ...row, dependents: newDeps };
      })
    );
  };

  const handleAddDependentSelect = (rowId) => {
    setRows((prev) =>
      prev.map((row) => {
        if (row.id !== rowId) return row;
        return {
          ...row,
          dependents: [...row.dependents, ""],
        };
      })
    );
  };

  const handleRemoveDependent = (rowId, value) => {
    setRows((prev) =>
      prev.map((row) =>
        row.id === rowId
          ? {
              ...row,
              dependents: row.dependents.filter((d) => d !== value),
            }
          : row
      )
    );
  };

  const handleAddRow = () => {
    if (!canAddRow) return;
    setRows((prev) => [
      ...prev,
      {
        id: Date.now() + Math.random(),
        independent: "",
        dependents: [""],
      },
    ]);
  };

  const handleRemoveRow = (rowId) => {
    setRows((prev) =>
      prev.length === 1 ? prev : prev.filter((row) => row.id !== rowId)
    );
  };

  return (
    <div className="step-nav-root">
      <div className="step-rows">
        {rows.map((row, index) => {
          const availableIndependent = variables.filter(
            (v) =>
              // Cho phép giữ lại independent hiện tại trong options
              v === row.independent ||
              !rows.some(
                (r) => r.id !== row.id && r.independent === v
              )
          );

          return (
            <div key={row.id} className="step-row">
              <div className="step-column">
                <label className="step-label">Biến độc lập</label>
                <select
                  className="step-select"
                  value={row.independent || ""}
                  onChange={(e) =>
                    handleIndependentChange(row.id, e.target.value)
                  }
                >
                  <option value="">Chọn biến độc lập</option>
                  {availableIndependent.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>

              {/* Arrow */}
              <div className="step-arrow">→</div>

              {/* Dependents (right) */}
              <div className="step-column step-column-dependent">
                <label className="step-label">Biến phụ thuộc</label>

                <div className="dep-controls">
                  {row.dependents.map((dep, depIndex) => {
                    const usedByOthers = row.dependents.filter(
                      (d, idx) => idx !== depIndex && d
                    );
                    const availableDependents = variables.filter(
                      (v) => v !== row.independent && !usedByOthers.includes(v)
                    );

                    return (
                      <select
                        key={depIndex}
                        className="step-select dep-select"
                        value={dep || ""}
                        onChange={(e) =>
                          handleDependentChange(
                            row.id,
                            depIndex,
                            e.target.value
                          )
                        }
                        disabled={
                          !row.independent || availableDependents.length === 0
                        }
                      >
                        <option value="">
                          {row.independent
                            ? "Chọn biến phụ thuộc"
                            : "Chọn biến độc lập trước"}
                        </option>
                        {availableDependents.map((v) => (
                          <option key={v} value={v}>
                            {v}
                          </option>
                        ))}
                      </select>
                    );
                  })}

                  <button
                    type="button"
                    className="btn-add-dep"
                    onClick={() => handleAddDependentSelect(row.id)}
                    disabled={
                      !row.independent ||
                      variables.filter(
                        (v) =>
                          v !== row.independent &&
                          !row.dependents.filter(Boolean).includes(v)
                      ).length === 0
                    }
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Remove row */}
              <button
                type="button"
                className="btn-remove-row"
                onClick={() => handleRemoveRow(row.id)}
                disabled={rows.length === 1}
                title={rows.length === 1 ? "Không thể xóa hàng cuối" : "Xóa hàng"}
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>

      {/* Add row */}
      <div className="add-row-container">
        <button
          type="button"
          className="btn-add-row"
          onClick={handleAddRow}
          disabled={!canAddRow}
        >
          + Thêm hàng
        </button>
        {!canAddRow && (
          <span className="add-row-hint">
            Tất cả biến đã được dùng làm biến độc lập.
          </span>
        )}
      </div>
    </div>
  );
}
