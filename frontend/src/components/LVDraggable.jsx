import React, { useRef } from "react";
import useSvgDrag from "../components/useSvgDrag";

/**
 * LVDraggable: chỉ nhận vị trí LV từ prop (lvPos),
 * khi kéo sẽ gọi onDrag để LVGroup cập nhật lvPos + mvPositions
 */
export default function LVDraggable({ lv, baseX, baseY, onDrag }) {
  const ref = useRef(null);

  const drag = useSvgDrag((cursor) => {
    // Thông báo lên LVGroup để cập nhật lvPos + di chuyển MV theo delta
    onDrag?.(lv.id, cursor);
  });

  return (
    <g
      ref={ref}
      onMouseDown={drag.handleMouseDown}
      onMouseMove={(e) => drag.handleMouseMove(e, ref, { x: baseX, y: baseY })}
      onMouseUp={drag.handleMouseUp}
      style={{ cursor: "grab" }}
    >
      <circle cx={baseX} cy={baseY} r={50} fill="#1E3A8A" />
      <text
        x={baseX}
        y={baseY}
        textAnchor="middle"
        fill="white"
        fontWeight="bold"
      >
        {lv.label}
      </text>
      {/* R-Square nếu có */}
      {lv.rSquare !== 0 && (
        <text
          x={baseX}
          y={baseY + 28}
          textAnchor="middle"
          fill="white"
          fontSize="13"
        >
          R² = {lv.rSquare}
        </text>
      )}
    </g>
  );
}
