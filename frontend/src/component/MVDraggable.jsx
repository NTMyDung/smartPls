import React, { useRef } from "react";
import useSvgDrag from "./useSvgDrag";

export default function MVDraggable({ mv, baseX, baseY, onDrag }) {
  const ref = useRef(null);

  const drag = useSvgDrag((cursor) => {
    onDrag?.(mv.id, cursor);
  });

  return (
    <g
      ref={ref}
      onMouseDown={drag.handleMouseDown}
      onMouseMove={(e) => drag.handleMouseMove(e, ref, { x: baseX, y: baseY })}
      onMouseUp={drag.handleMouseUp}
      style={{ cursor: "grab" }}
    >
      <rect x={baseX - 35} y={baseY - 20} width={70} height={40} fill="yellow" stroke="black" />
      <text x={baseX} y={baseY} textAnchor="middle" dominantBaseline="middle">
        {mv.label}
      </text>
    </g>
  );
}
