import { Button } from "@/shared/ui/button";
import { Link } from "react-router";

type WorkspaceError = {
  messageError: string;
  backTo?: string;
  actionLabel?: string;
  onRetry?: () => void;
};
export const WorkspaceError = ({ messageError, backTo, actionLabel, onRetry }: WorkspaceError) => {
  return (
    <div>
      <p>{messageError}</p>
      {!backTo && onRetry && <Button onClick={onRetry}>Try again</Button>}
      {backTo && <Link to={`${backTo}`}>{actionLabel}</Link>}
    </div>
  );
};
