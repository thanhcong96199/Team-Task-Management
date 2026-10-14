import { Button } from "@/shared/ui/button";
import { isRouteErrorResponse, useRouteError } from "react-router";

export default function RouteErrorPage() {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    return (
      <div>
        <h1>
          {error.status} {error.statusText}
        </h1>
        <Button onClick={() => window.location.reload()}>Refresh</Button>
      </div>
    );
  } else if (error instanceof Error) {
    return (
      <div>
        <p>
          Failed to fetch dynamically imported module...". Bạn có thể hiện một câu chung cho user
          như "Something went wrong. Please reload the page.
        </p>
        {import.meta.env.DEV && <pre>{error.stack}</pre>}
        <Button onClick={() => window.location.reload()}>Refresh</Button>
      </div>
    );
  } else {
    return (
      <div>
        <h1>Unknown Error</h1>
        <Button onClick={() => window.location.reload()}>Refresh</Button>
      </div>
    );
  }
}
