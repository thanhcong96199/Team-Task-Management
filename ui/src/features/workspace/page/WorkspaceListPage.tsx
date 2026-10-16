import { WorkspaceCard } from "../components/WorkspaceCard";
import { useWorkspaces } from "../hooks";
import { SkeletonCard } from "../components/SkeletonCard";
import { WorkspaceError } from "../components/WorkspaceError";
import { Button } from "@/shared/ui/button";

const WorkspaceListPage = () => {
    const { data, isLoading, isError, refetch } = useWorkspaces();

    if (isLoading) {
        return <SkeletonCard />
    } else if (isError) {
        return <WorkspaceError messageError="Something error" onRefresh={refetch} />
    }
    return (
        <div>
            <div  className="flex justify-end my-3">
                <Button>Create workspace</Button>
            </div>
            {data && data.length === 0 ? <p>You don't have any workspace yet</p> : (
                <div className="w-full flex-1">
                    {
                        data?.map((el) =>
                        (<WorkspaceCard
                            key={el.id}
                            workspaceId={el.id}
                            name={el.name}
                        />))
                    }
                </div>
            )}

        </div>
    )
}

export default WorkspaceListPage;