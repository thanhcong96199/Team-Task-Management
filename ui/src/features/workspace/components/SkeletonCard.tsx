import { Card, CardHeader } from "@/shared/ui/card";
import { Skeleton } from "@/shared/ui/skeleton";

export const SkeletonCard = () => {
  return (
    <Card className="w-full max-w-xs">
      <CardHeader>
        <Skeleton className="h-4 w-2/3" data-testid="skeleton-list_workspace" />
      </CardHeader>
    </Card>
  );
};
