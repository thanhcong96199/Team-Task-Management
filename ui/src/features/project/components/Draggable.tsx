import { useDraggable } from "@dnd-kit/react";
function Draggable({ id, children }: { id: string; children?: React.ReactNode }) {
  const { ref } = useDraggable({ id });

  return (
    <div ref={ref} className="btn my-3">
      {children}
    </div>
  );
}

export default Draggable;
