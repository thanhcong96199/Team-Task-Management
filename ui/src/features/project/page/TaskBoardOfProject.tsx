import { useParams } from "react-router";
import { SkeletonCard } from "@/features/workspace/components/SkeletonCard";
import { WorkspaceError } from "@/features/workspace/components/WorkspaceError";
import { DragDropProvider } from "@dnd-kit/react";
import Droppable from "../components/Droppable";
import Draggable from "../components/Draggable";
import { Card, CardHeader, CardTitle } from "@/shared/ui/card";
import { queryClient } from "@/shared/lib/queryClient";
import { tasksQueryOptions } from "../queries";
import { useQuery } from "@tanstack/react-query";
import { isTaskStatus, TASK_STATUSES } from "@ttm/shared";
import type { DragEndEvent } from "@dnd-kit/react";
import { moveTask } from "../utils";

const TaskBoardOfProject = () => {
  const params = useParams();
  const projectId = Number(params?.projectId);
  const workspaceId = Number(params?.workspaceId);
  const boardId = Number(params?.boardId);

  const opts = tasksQueryOptions(projectId, workspaceId, boardId);
  const { data, isError, error, isLoading, refetch } = useQuery(opts);

  const handleDragEnd = (event: DragEndEvent) => {
    const idSource = event.operation.source?.id;
    let parent = null;
    if (event.canceled) return;
    if (isTaskStatus(event.operation.target?.id)) {
      parent = event.operation.target?.id;
    }

    if (parent && idSource) {
      queryClient.setQueryData(opts.queryKey, (old) => old && moveTask(old, +idSource, parent));
    }
  };

  if (isLoading) {
    return <SkeletonCard />;
  } else if (isError) {
    if (error.status === 404) {
      return (
        <WorkspaceError
          messageError="Board not found"
          backTo="/"
          actionLabel="Go back to Project list page"
        />
      );
    }
    return <WorkspaceError messageError="Something went wrong" onRetry={refetch} />;
  }

  return (
    <div>
      <DragDropProvider onDragEnd={handleDragEnd}>
        <section className="drop-layout grid grid-cols-4 gap-6 mt-[3rem]">
          {/* {parent == null ? draggable : null} */}
          {TASK_STATUSES.map((item) => (
            <Droppable id={item} key={item}>
              <p>{item}</p>
              {data &&
                data[item]?.map((el) => (
                  <Draggable id={`${el.id}`} key={el.id}>
                    <Card>
                      <CardHeader>
                        <CardTitle>{el.title}</CardTitle>
                      </CardHeader>
                    </Card>
                  </Draggable>
                ))}
            </Droppable>
          ))}
        </section>
      </DragDropProvider>
    </div>
  );
};

export default TaskBoardOfProject;
