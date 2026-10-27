import { WorkspaceCard } from "../components/WorkspaceCard";
import { useWorkspaces } from "../hooks";
import { SkeletonCard } from "../components/SkeletonCard";
import { WorkspaceError } from "../components/WorkspaceError";
import { Button } from "@/shared/ui/button";
import { useState } from "react";
import DialogCreateWorkspace from "../components/CreateWorkspaceDialog";

const WorkspaceListPage = () => {
  const [openDialog, setOpenDialog] = useState(false);
  const { data, isLoading, isError, refetch } = useWorkspaces();

  const handleOpenDialog = () => {
    setOpenDialog(true);
  };

  if (isLoading) {
    return <SkeletonCard />;
  } else if (isError) {
    return <WorkspaceError messageError="Something error" onRetry={refetch} />;
  }
  return (
    <div>
      <div className="flex justify-end my-3">
        <Button onClick={handleOpenDialog}>Create workspace</Button>
      </div>
      {data && data.length === 0 ? (
        <p>You don't have any workspace yet</p>
      ) : (
        <div className="w-full flex-1">
          {data?.map((el) => (
            <WorkspaceCard key={el.id} workspaceId={el.id} name={el.name} />
          ))}
        </div>
      )}
      <DialogCreateWorkspace
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        onRefresh={refetch}
      />
    </div>
  );
};

export default WorkspaceListPage;
