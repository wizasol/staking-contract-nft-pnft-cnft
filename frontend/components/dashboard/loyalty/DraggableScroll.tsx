import React, { useRef, useState } from "react";

interface DraggableProps {
  rootClass?: string;
  children: React.ReactNode;
}

const DraggableScroll: React.FC<DraggableProps> = ({
  rootClass = "",
  children,
}) => {
  const ourRef = useRef<HTMLDivElement | null>(null);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const mouseCoords = useRef<{
    startX: number;
    startY: number;
    scrollLeft: number;
    scrollTop: number;
  }>({
    startX: 0,
    startY: 0,
    scrollLeft: 0,
    scrollTop: 0,
  });
  const [isScrolling, setIsScrolling] = useState(false);

  const handleDragStart = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (!ourRef.current) return;
    const slider = ourRef.current.children[0] as HTMLElement;
    const startX = e.pageX - slider.offsetLeft;
    const startY = e.pageY - slider.offsetTop;
    const scrollLeft = slider.scrollLeft;
    const scrollTop = slider.scrollTop;
    mouseCoords.current = { startX, startY, scrollLeft, scrollTop };
    setIsMouseDown(true);
  };

  const handleDragEnd = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    setIsMouseDown(false);
    if (!ourRef.current) return;
  };

  const handleDrag = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (!isMouseDown || !ourRef.current) return;
    e.preventDefault();
    const slider = ourRef.current.children[0] as HTMLElement;
    const x = e.pageX - slider.offsetLeft;
    const y = e.pageY - slider.offsetTop;
    const walkX = (x - mouseCoords.current.startX) * 1.5;
    const walkY = (y - mouseCoords.current.startY) * 1.5;
    slider.scrollLeft = mouseCoords.current.scrollLeft - walkX;
    slider.scrollTop = mouseCoords.current.scrollTop - walkY;
  };

  return (
    <div
      ref={ourRef}
      onMouseDown={handleDragStart}
      onMouseUp={handleDragEnd}
      onMouseMove={handleDrag}
      onMouseLeave={handleDragEnd}
      onClick={(e) => {
        e.stopPropagation();
      }}
      className={rootClass + " flex overflow-x-scroll"}
    >
      {children}
    </div>
  );
};

export default DraggableScroll;
