import { Link, useParams } from "react-router";
import { useBoardsOfProjectDetail } from "../hooks";
import { SkeletonCard } from "@/features/workspace/components/SkeletonCard";
import { WorkspaceError } from "@/features/workspace/components/WorkspaceError";
import { Card, CardHeader, CardTitle } from "@/shared/ui/card";

const ProjectDetail = () => {
  const params = useParams();
  const projectId = Number(params?.projectId);
  const workspaceId = Number(params?.workspaceId);

  const { data, isLoading, isError, error, refetch } = useBoardsOfProjectDetail(
    projectId,
    workspaceId,
  );
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
      {data && data.length > 0 && (
        <div>
          <h3 className="my-3 font-bold">List Boards of Project </h3>
          <div className="grid grid-cols-3 gap-4">
            {data.map((el) => (
              <Link
                key={el.id}
                to={`/workspaces/${workspaceId}/${projectId}/boards/${el.id}`}
                className="block mb-3 w-full"
              >
                <Card>
                  <CardHeader>
                    <CardTitle>{el.title}</CardTitle>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetail;
