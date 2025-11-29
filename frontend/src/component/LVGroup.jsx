import React, { useEffect, useRef, useState } from "react";
import MVDraggable from "./MVDraggable";
import LVDraggable from "./LVDraggable";

export default function LVGroup({ lv, mvs, level, baseX, baseY, onSizeChange, onNodeDrag }) {
  const groupRef = useRef(null);

  const [lvPos, setLvPos] = useState({ x: baseX, y: baseY });
  const [mvPositions, setMvPositions] = useState([]);

  // INIT MV POSITIONS
  useEffect(() => {
    const n = mvs.length;
    const spacingY = 50;
    const spacingX = 150;
    const offset = 170;
    const arr = [];

    switch (level) {
      case 1: {
        const baseXofs = lvPos.x - offset;
        const startY = lvPos.y - ((n - 1) * spacingY) / 2;
        for (let i = 0; i < n; i++) arr.push({ x: baseXofs, y: startY + i * spacingY });
        break;
        
      }
      case 2.1: {
        const baseYofs = lvPos.y - offset;
        const startX = lvPos.x - ((n - 1) * spacingX) / 2;
        for (let i = 0; i < n; i++) arr.push({ x: startX + i * spacingX, y: baseYofs });
        break;
      }
      case 2.2: {
        const baseYofs = lvPos.y + offset;
        const startX = lvPos.x - ((n - 1) * spacingX) / 2;
        for (let i = 0; i < n; i++) arr.push({ x: startX + i * spacingX, y: baseYofs });
        break;
      }
      //Cho case 3 trở lên
      default: {
        const baseXofs = lvPos.x + offset;
        const startY = lvPos.y - ((n - 1) * spacingY) / 2;
        for (let i = 0; i < n; i++) arr.push({ x: baseXofs, y: startY + i * spacingY });
        break;
      }
    }

    setMvPositions(arr);
  }, []);

  // REPORT BOUNDING BOX
  useEffect(() => {
    if (groupRef.current && onSizeChange) {
      onSizeChange(lv.id, groupRef.current.getBBox());
    }
  }, [mvPositions, lvPos]);

  return (
    <>
      {/* LV NODE */}
      <LVDraggable
        lv={lv}
        baseX={lvPos.x}
        baseY={lvPos.y}
        onDrag={(id, newPos) => {
          const dx = newPos.x - lvPos.x;
          const dy = newPos.y - lvPos.y;

          setLvPos(newPos);
          setMvPositions(prev => prev.map(p => ({ x: p.x + dx, y: p.y + dy })));

          onNodeDrag?.(id, newPos);
        }}
      />

      <g ref={groupRef}>
        {mvs.map((mv, i) => {
          const mvPos = mvPositions[i];
          if (!mvPos) return null;

          const loading = mv.loading.toFixed(3);
          const pValue = mv.pValue != null ? mv.pValue.toFixed(3) : null;

          // vector
          const dx = mvPos.x - lvPos.x;
          const dy = mvPos.y - lvPos.y;
          const dist = Math.hypot(dx, dy);

          const lvRadius = 50;
          const startX = lvPos.x + (dx / dist) * lvRadius;
          const startY = lvPos.y + (dy / dist) * lvRadius;

          const endX = mvPos.x - (dx / dist) * 40;
          const endY = mvPos.y - (dy / dist) * 20;

          // MID CUT (same style as SmartPLSDiagram)
          const midX = (startX + endX) / 2;
          const midY = (startY + endY) / 2;
          const cut = 20;

          const pX = -dy / dist; // perpendicular X
          const pY = dx / dist;  // perpendicular Y

          // Loading text offset
          const textX = midX + pX * 5;
          const textY = midY + pY * 5;

          return (
            <g key={mv.id}>
              {/* Transparent clickable hitbox (same style as PATHS) */}
              <line
                x1={startX}
                y1={startY}
                x2={midX - (dx / dist) * cut}
                y2={midY - (dy / dist) * cut}
                stroke="transparent"
                strokeWidth={15}
              />
              <line
                x1={midX + (dx / dist) * cut}
                y1={midY + (dy / dist) * cut}
                x2={endX}
                y2={endY}
                stroke="transparent"
                strokeWidth={15}
              />

              {/* REAL VISIBLE LINE (two segments) */}
              <line
                x1={startX}
                y1={startY}
                x2={midX - (dx / dist) * cut}
                y2={midY - (dy / dist) * cut}
                stroke="black"
                strokeWidth={1}
              />

              <line
                x1={midX + (dx / dist) * cut}
                y1={midY + (dy / dist) * cut}
                x2={endX}
                y2={endY}
                stroke="black"
                strokeWidth={1}
                markerEnd="url(#arrowhead)"
              />

              {/* Loading text (same style as PATH text) */}

              {mv.loading && (
                <text
                  x={textX}
                  y={textY + (level === 1 ? 10 : 0 )}
                  textAnchor="middle"
                  fill="black"
                  fontSize="12"
                  style={{ userSelect: "none", pointerEvents: "none" }}
                >
                   {/* {Number(mv.loading).toFixed(3)} */}
                   {pValue != null ? `${loading} (${pValue})` : loading}
                </text>
              )}

              {/* MV NODE */}
              <MVDraggable
                mv={mv}
                baseX={mvPos.x}
                baseY={mvPos.y}
                onDrag={(id, newPos) => {
                  const arr = [...mvPositions];
                  arr[i] = newPos;
                  setMvPositions(arr);
                  onNodeDrag?.(id, newPos);
                }}
              />
            </g>
          );
        })}
      </g>
    </>
  );
}
