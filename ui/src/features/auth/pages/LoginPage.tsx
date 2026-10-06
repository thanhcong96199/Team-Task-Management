import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "@ttm/shared";
import { useForm } from "react-hook-form";
import { applyApiErrorToForm } from "@/shared/lib/form";
import { useLogin } from "../hooks";

// Field names come from the shared schema, so they never drift from the backend
const LOGIN_FIELDS = loginSchema.keyof().options;

export default function LoginPage() {
  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });
  const login = useLogin();
  const { errors } = form.formState;

  const onSubmit = (data: LoginInput) => {
    login.mutate(data, {
      onError: (error) => applyApiErrorToForm(error, form.setError, LOGIN_FIELDS),
    });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
      {errors.root?.server && <div role="alert">{errors.root.server.message}</div>}

      <div>
        <label htmlFor="email">Email</label>
        <input id="email" type="email" {...form.register("email")} />
        {errors.email && <span>{errors.email.message}</span>}
      </div>
      <div>
        <label htmlFor="password">Password</label>
        <input id="password" type="password" {...form.register("password")} />
        {errors.password && <span>{errors.password.message}</span>}
      </div>
      <button type="submit" disabled={login.isPending}>
        {login.isPending ? "Logging in..." : "Login"}
      </button>
    </form>
  );
}
