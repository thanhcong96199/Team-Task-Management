import { Button } from "@/shared/ui/button";
import { Link } from "react-router";

export default function NotFoundPage() {
  return (
    <div>
      <p>Page Not Found</p>
      <Button nativeButton={false} variant={"link"} render={<Link to={"/"} />}>
        Go to home
      </Button>
    </div>
  );
}
