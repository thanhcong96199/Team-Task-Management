import { useDroppable } from "@dnd-kit/react";
import { cn } from "cn";

function Droppable({ id, children }: { id: string; children?: React.ReactNode }) {
  const { ref, isDropTarget } = useDroppable({ id });

  return (
    <div ref={ref} className={cn(isDropTarget ? "droppable active" : "droppable", "my-3")}>
      {children}
    </div>
  );
}
export default Droppable;
