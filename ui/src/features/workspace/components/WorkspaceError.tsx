import { Button } from "@/shared/ui/button";

type WorkspaceError = {
    messageError: string;
    onRefresh: () => void;
}
export const WorkspaceError = ({ messageError, onRefresh }: WorkspaceError) => {
    return (
        <div>
            <p>{messageError}</p>
            <Button onClick={onRefresh}>Try again</Button>
        </div>
    )

}