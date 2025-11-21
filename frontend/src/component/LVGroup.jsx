import React, { useEffect, useRef, useState } from "react";
import MVDraggable from "./MVDraggable";
import LVDraggable from "./LVDraggable";

function LVGroup({ lv, mvs, level, baseX, baseY, onSizeChange, onNodeDrag }) {
  const groupRef = useRef(null);

  // Vị trí tuyệt đối của LV
  const [lvPos, setLvPos] = useState({ x: baseX, y: baseY });

  // Vị trí tuyệt đối của từng MV
  const [mvPositions, setMvPositions] = useState([]);

  // Khởi tạo vị trí MV tuyệt đối khi mount
  useEffect(() => {
    const n = mvs.length;
    const spacingY = 50;
    const spacingX = 150;
    const offset = 170;
    const arr = [];

    switch (true) {
      case level === 1: {
        const baseXofs = lvPos.x - offset;
        const startY = lvPos.y - ((n - 1) * spacingY) / 2;
        for (let i = 0; i < n; i++) arr.push({ x: baseXofs, y: startY + i * spacingY });
        break;
      }
      case level === 3: {
        const baseXofs = lvPos.x + offset;
        const startY = lvPos.y - ((n - 1) * spacingY) / 2;
        for (let i = 0; i < n; i++) arr.push({ x: baseXofs, y: startY + i * spacingY });
        break;
      }
      case level === 2.1: {
        const baseYofs = lvPos.y - offset;
        const startX = lvPos.x - ((n - 1) * spacingX) / 2;
        for (let i = 0; i < n; i++) arr.push({ x: startX + i * spacingX, y: baseYofs });
        break;
      }
      case level === 2.2: {
        const baseYofs = lvPos.y + offset;
        const startX = lvPos.x - ((n - 1) * spacingX) / 2;
        for (let i = 0; i < n; i++) arr.push({ x: startX + i * spacingX, y: baseYofs });
        break;
      }
    }

    setMvPositions(arr);
  }, []);

  // Cập nhật bounding box LVGroup cho parent
  useEffect(() => {
    if (groupRef.current && onSizeChange) {
      onSizeChange(lv.id, groupRef.current.getBBox());
    }
  }, [mvPositions, lvPos]);

  return (
    <>
      {/* LV chính, kéo nguyên cụm */}
      <LVDraggable
        lv={lv}
        baseX={lvPos.x}
        baseY={lvPos.y}
        onDrag={(id, newPos) => {
          const dx = newPos.x - lvPos.x;
          const dy = newPos.y - lvPos.y;

          // Update vị trí LV
          setLvPos(newPos);

          // Di chuyển tất cả MV theo delta
          setMvPositions(prev => prev.map(p => ({
            x: p.x + dx,
            y: p.y + dy
          })));

          // Thông báo lên SmartPLSDiagram
          onNodeDrag?.(id, newPos);
        }}
      />

      {/* MV + arrow */}
      <g ref={groupRef}>
        {mvs.map((mv, i) => {
          const mvPos = mvPositions[i];
          if (!mvPos) return null;

          // Tính điểm arrow từ LV → MV
          const dx = mvPos.x - lvPos.x;
          const dy = mvPos.y - lvPos.y;
          const dist = Math.hypot(dx, dy);
          const lvRadius = 50;

          const startX = lvPos.x + (dx / dist) * lvRadius;
          const startY = lvPos.y + (dy / dist) * lvRadius;

          const endX = mvPos.x - (dx / dist) * 40;
          const endY = mvPos.y - (dy / dist) * 20;

          return (
            <g key={mv.id}>
              <line
                x1={startX}
                y1={startY}
                x2={endX}
                y2={endY}
                stroke="black"
                markerEnd="url(#arrowhead)"
              />
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

export default LVGroup;
