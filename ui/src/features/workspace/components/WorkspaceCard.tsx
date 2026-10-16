import { Card, CardHeader, CardTitle } from "@/shared/ui/card"
import { Link } from "react-router";

export type WorkspaceCardProps = {
    name: string;
    workspaceId: number;
}
export const WorkspaceCard = ({ name, workspaceId }: WorkspaceCardProps) => {
    return (
        <Link to={`/workspaces/${workspaceId}`} className="block mb-3 w-full">
            <Card>
                <CardHeader>
                    <CardTitle>{name}</CardTitle>
                </CardHeader>
            </Card>
        </Link>
    )
}