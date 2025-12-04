// useSvgDrag.js
import { useState } from "react";

export default function useSvgDrag(onDrag) {
  const [dragging, setDragging] = useState(false);

  const handleMouseDown = (e) => {
    setDragging(true);
    e.preventDefault();
  };

  const handleMouseMove = (e, ref) => {
    if (!dragging) return;

    const svg = ref.current.closest("svg");
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const cursorpt = pt.matrixTransform(svg.getScreenCTM().inverse());

    onDrag(cursorpt);
  };

  const handleMouseUp = () => setDragging(false);

  return {
    dragging,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
  };
}
