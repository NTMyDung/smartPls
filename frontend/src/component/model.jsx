import React, { useState, useEffect } from "react";
import LVGroup from "./LVGroup.jsx";

export default function SmartPLSDiagram({ data }) {
  const mockData = {
    latentVariables: [
      { id: "GSA", label: "GSA", level: 1 },
      { id: "MA", label: "MA", level: 1 },
      { id: "VA", label: "VA", level: 1 },
      { id: "PE", label: "PE", level: 2.1, rSquare: 0.712 },
      { id: "FE", label: "FE", level: 2.2, rSquare: 0.681 },
      { id: "CE", label: "CE", level: 3, rSquare: 0.744 },
    ],
    manifestVariables: {
      GSA: [
        { id: "GSA4", label: "GSA4", loading: 0.813 },
        { id: "GSA3", label: "GSA3", loading: 0.773 },
        { id: "GSA2", label: "GSA2", loading: 0.731 },
        { id: "GSA1", label: "GSA1", loading: 0.692 },
      ],

      MA: [
        { id: "MA5", label: "MA5", loading: 0.813 },
        { id: "MA4", label: "MA4", loading: 0.813 },
        { id: "MA3", label: "MA3", loading: 0.813 },
        { id: "MA2", label: "MA2", loading: 0.813 },
        { id: "MA1", label: "MA1", loading: 0.813 },
      ],
      VA: [
        { id: "VA4", label: "VA4", loading: 0.813 },
        { id: "VA3", label: "VA3", loading: 0.813 },
        { id: "VA2", label: "VA2", loading: 0.813 },
        { id: "VA1", label: "VA1", loading: 0.813 },
      ],
      PE: [
        { id: "PE2", label: "PE2", loading: 0.813 },
        { id: "PE3", label: "PE3", loading: 0.813 },
        { id: "PE1", label: "PE1", loading: 0.813 },
      ],
      FE: [
        { id: "FE1", label: "FE1", loading: 0.813 },
        { id: "FE2", label: "FE2", loading: 0.813 },
        { id: "FE3", label: "FE3", loading: 0.813 },
      ],
      CE: [
        { id: "CE8", label: "CE8", loading: 0.813 },
        { id: "CE7", label: "CE7", loading: 0.813 },
        { id: "CE6", label: "CE6", loading: 0.813 },
        { id: "CE5", label: "CE5", loading: 0.813 },
        { id: "CE4", label: "CE4", loading: 0.813 },
        { id: "CE3", label: "CE3", loading: 0.813 },
        { id: "CE2", label: "CE2", loading: 0.813 },
        { id: "CE1", label: "CE1", loading: 0.813 },
      ],
    },
    paths: [
      { from: "GSA", to: "PE", coefficient: 0.335, pValue: 0.0 },
      { from: "MA", to: "PE", coefficient: 0.251, pValue: 0.001 },
      { from: "VA", to: "PE", coefficient: 0.502, pValue: 0.0 },
      { from: "MA", to: "FE", coefficient: 0.389, pValue: 0.0 },
      { from: "GSA", to: "FE", coefficient: 0.335, pValue: 0.0 },
      { from: "VA", to: "FE", coefficient: 0.146, pValue: 0.014 },
      { from: "PE", to: "CE", coefficient: 0.283, pValue: 0.0 },
      { from: "FE", to: "CE", coefficient: 0.502, pValue: 0.0 },
    ],
  };

  const currentData = {
    latentVariables: data?.latentVariables ?? mockData.latentVariables,
    manifestVariables: data?.manifestVariables ?? mockData.manifestVariables,
    paths: data?.paths ?? mockData.paths,
  };

  const [lvSizes, setLvSizes] = useState({});
  const [lvPositions, setLvPositions] = useState({});
  const [selectedPathIndex, setSelectedPathIndex] = useState(null);

  const handleSizeChange = (lvId, bbox) => {
    setLvSizes((prev) => ({ ...prev, [lvId]: bbox }));
  };

  const handleNodeDrag = (id, pos) => {
    setLvPositions((prev) => ({ ...prev, [id]: pos }));
  };

  const levelPositions = {};
  currentData.latentVariables.forEach((lv) => {
    if (!levelPositions[lv.level]) levelPositions[lv.level] = [];
    levelPositions[lv.level].push(lv);
  });

  const spacingBetweenGroups = 0;
  const baseXStart = window.innerWidth / 3;

  useEffect(() => {
    const positions = {};

    const allHeights = Object.values(lvSizes).map((b) => b?.height ?? 120);
    const totalHeight = allHeights.reduce((a, b) => a + spacingBetweenGroups + b, 0);

    const midY = window.innerHeight / 2;

    const clampY = (y) =>
      Math.max(100, Math.min(y, window.innerHeight - 200));

    const levelLayout = new Proxy(
  {
    1: "left",
    2.1: "top",
    2.2: "bottom",
  },
  {
    get(target, prop) {
      const level = Number(prop);

      // Nếu level >= 3 → auto right
      if (level >= 3) return "right";

      // Nếu tồn tại trong object → lấy
      return target[prop];
    },
  }
);


    Object.entries(levelPositions).forEach(([level, listLvs]) => {
      const type = levelLayout[level];
      const n = listLvs.length;

      listLvs.forEach((lv, i) => {
        const bbox = lvSizes[lv.id];
        const height = bbox ? bbox.height + 80 : 180;
        const spacing = height + 30;

        let posX, posY;

        switch (type) {
          case "left":
            posX = baseXStart - 250;
            posY = midY + (i - (n - 1) / 2) * spacing;
            break;

          case "right":
            posX = baseXStart + 650;
            posY = midY + (i - (n - 1) / 2) * spacing;
            break;

          case "top":
            posX = baseXStart + 200;
            posY = midY - 150 - i * spacing;
            break;

          case "bottom":
            posX = baseXStart + 200;
            posY = midY + 250 + i * spacing;
            break;
        }

        positions[lv.id] = { x: posX, y: clampY(posY) };
      });
    });

    setLvPositions((prev) => ({ ...positions, ...prev }));
  }, [lvSizes]);

  const getNodePosition = (id) => lvPositions[id] ?? null;

  return (
    <div
      style={{
        width: "100%",
        border: "1px solid #ccc",
        overflow: "visible",
        padding: "50px 0",
      }}
    >
      <svg
        width="100%"
        style={{
          overflow: "visible",
          minHeight: "1800px",
        }}
      >
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="10"
            refX="9"
            refY="3"
            orient="auto"
          >
            <polygon points="0 0, 10 3, 0 6" fill="#000" />
          </marker>
        </defs>

        {/* PATHS */}
        {currentData.paths.map((path, i) => {
          const a = getNodePosition(path.from);
          const b = getNodePosition(path.to);
          if (!a || !b) return null;

          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const dist = Math.hypot(dx, dy);
          if (dist === 0) return null;

          const lvRadius = 50;

          const startX = a.x + (dx / dist) * lvRadius;
          const startY = a.y + (dy / dist) * lvRadius;

          const endX = b.x - (dx / dist) * lvRadius;
          const endY = b.y - (dy / dist) * lvRadius;

          const midX = (startX + endX) / 2;
          const midY = (startY + endY) / 2;

          const cutDistance = 22;

          const perpX = -dy / dist;
          const perpY = dx / dist;

          const coef = path.coefficient.toFixed(3);

          const textX = midX + perpX * 5;
          const textY = midY + perpY * 5;

          return (
            <g
              key={i}
              onClick={() =>
                setSelectedPathIndex((prev) => (prev === i ? null : i))
              }
              style={{ cursor: "pointer" }}
            >
              <line
                x1={startX}
                y1={startY}
                x2={midX - (dx / dist) * cutDistance}
                y2={midY - (dy / dist) * cutDistance}
                stroke="transparent"
                strokeWidth={15}
              />
              <line
                x1={midX + (dx / dist) * cutDistance}
                y1={midY + (dy / dist) * cutDistance}
                x2={endX}
                y2={endY}
                stroke="transparent"
                strokeWidth={15}
              />

              <line
                x1={startX}
                y1={startY}
                x2={midX - (dx / dist) * cutDistance}
                y2={midY - (dy / dist) * cutDistance}
                stroke="black"
                strokeWidth={selectedPathIndex === i ? 2 : 1}
              />
              <line
                x1={midX + (dx / dist) * cutDistance}
                y1={midY + (dy / dist) * cutDistance}
                x2={endX}
                y2={endY}
                stroke="black"
                strokeWidth={selectedPathIndex === i ? 2 : 1}
                markerEnd="url(#arrowhead)"
              />

              <text
                x={textX}
                y={textY}
                textAnchor="middle"
                fill="black"
                fontWeight={selectedPathIndex === i ? "bold" : "normal"}
                style={{ userSelect: "none", pointerEvents: "none" }}
              >
                {coef}
              </text>
            </g>
          );
        })}

        {/* LV + MV */}
        {currentData.latentVariables.map((lv) => {
          const pos = lvPositions[lv.id];
          if (!pos) return null;

          return (
            <LVGroup
              key={lv.id}
              lv={lv}
              mvs={currentData.manifestVariables[lv.id] ?? []}
              level={lv.level}
              baseX={pos.x}
              baseY={pos.y}
              onSizeChange={handleSizeChange}
              onNodeDrag={handleNodeDrag}
            />
          );
        })}
      </svg>
    </div>
  );
}
