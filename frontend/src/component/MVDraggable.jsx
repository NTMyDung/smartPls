import React, { useRef, useState } from "react";
import useSvgDrag from "./useSvgDrag";

export default function MVDraggable({ mv, baseX, baseY, onDrag }) {
  const ref = useRef(null);
  const [pos, setPos] = useState({ x: baseX, y: baseY });

  const drag = useSvgDrag((cursor) => {
    setPos(cursor);
    onDrag?.(mv.id, cursor);
  });

  return (
    <g
      ref={ref}
      onMouseDown={drag.handleMouseDown}
      onMouseMove={(e) => drag.handleMouseMove(e, ref)}
      onMouseUp={drag.handleMouseUp}
      style={{ cursor: "grab" }}
    >
      <rect x={pos.x - 35} y={pos.y - 20} width={70} height={40} fill="yellow" stroke="black" />
      <text x={pos.x} y={pos.y} textAnchor="middle" dominantBaseline="middle">
        {mv.label}
      </text>
    </g>
  );
}
