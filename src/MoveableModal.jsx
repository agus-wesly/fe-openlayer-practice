import { useCallback, useEffect, useRef, useState } from "react";

function MoveableElement() {
  const [isDragging, setIsDragging] = useState(false);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const elementRef = useRef();

  const onMouseDown = (event) => {
    setIsDragging(true);
    const rect = event.target.getBoundingClientRect();
    console.log("x1", event.clientX);
    setOffsetX(event.clientX - rect.left);
    setOffsetY(event.clientY - rect.top);
  };

  const onMouseUp = () => {
    setIsDragging(false);
  };

  const onMouseMove = useCallback(
    (event) => {
      if (isDragging) {
        console.log("x2", event.clientX);
        elementRef.current.style.left = event.clientX - offsetX + "px";
        elementRef.current.style.top = event.clientY - offsetY + "px";
      }
    },
    [isDragging, offsetX, offsetY],
  );

  useEffect(() => {
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);

    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
  }, [onMouseMove]);

  // document.onmouseup = onMouseUp;
  // document.onmousemove = onMouseMove;

  return (
    <div className="w-screen h-screen relative">
      <div
        ref={elementRef}
        className="moveable"
        id="moveableElement"
        onMouseDown={onMouseDown}
        style={{
          width: "100px",
          height: "100px",
          backgroundColor: "#ccc",
          position: "absolute",
          cursor: "move",
        }}
      ></div>
    </div>
  );
}

export default MoveableElement;
