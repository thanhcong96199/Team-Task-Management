import { createBrowserRouter } from "react-router";

const route = createBrowserRouter([
    {
        path: "/",
        lazy: async () => {
            const HomePage = (await import("../features/auth/pages/UserInformation")).default;
            return { Component: HomePage };
        },
    },
    {
        path: "/login",
        lazy: async () => {
            const LoginPage = (await import("../features/auth/pages/LoginPage")).default;
            return { Component: LoginPage };
        },
    },
]);

export default route;