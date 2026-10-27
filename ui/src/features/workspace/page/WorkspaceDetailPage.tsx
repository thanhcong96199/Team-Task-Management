import { Link, useParams } from "react-router";
import { SkeletonCard } from "../components/SkeletonCard";
import { WorkspaceError } from "../components/WorkspaceError";
import { useWorkspaceDetail } from "../hooks";
import { Card, CardHeader, CardTitle } from "@/shared/ui/card";

const WorkspaceDetailPage = () => {
  const params = useParams();

  const workspaceId = Number(params?.workspaceId);
  const { data, isLoading, isError, error, refetch } = useWorkspaceDetail(workspaceId);

  if (isLoading) {
    return <SkeletonCard />;
  } else if (isError) {
    if (error.status === 404) {
      return (
        <WorkspaceError
          messageError="Workspace not found"
          backTo="/"
          actionLabel="Go back to workspace list page"
        />
      );
    }
    return <WorkspaceError messageError="Something went wrong" onRetry={refetch} />;
  }
  return (
    <div>
      <h2>Workspace Name: {data?.name}</h2>
      <p>Total member: {data?.memberCount || 0}</p>
      <p>Total project: {data?.projectCount || 0}</p>
      {data?.projects && data?.projects?.length > 0 && (
        <div>
          <p>List Project</p>
          {data?.projects?.map((el) => (
            <Link to={`/workspaces/${workspaceId}/${el.id}`} className="block mb-3 w-full">
              <Card>
                <CardHeader>
                  <CardTitle>{el.name}</CardTitle>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default WorkspaceDetailPage;
