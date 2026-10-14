import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "@ttm/shared";
import { useForm } from "react-hook-form";
import { applyApiErrorToForm, getFieldError } from "@/shared/lib/form";
import { useLogin } from "../hooks";
import { FormField } from "@/shared/ui/form-field";
import { Button } from "@/shared/ui/button";
import FormError from "@/shared/ui/form-error";
import { Link } from "react-router";

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
    <form
      className="w-full max-w-sm mx-auto flex flex-col gap-3"
      onSubmit={form.handleSubmit(onSubmit)}
      noValidate
    >
      <FormError message={errors?.root?.server?.message} />

      <FormField
        label="Email"
        type="email"
        error={getFieldError(errors, "email")}
        {...form.register("email")}
      />

      <FormField
        label="Password"
        type="password"
        error={getFieldError(errors, "password")}
        {...form.register("password")}
      />

      <Button type="submit" variant={"default"} disabled={login.isPending}>
        {login.isPending ? "Logging in..." : "Login"}
      </Button>
      <Button variant={"link"} nativeButton={false} render={<Link to="/register" />}>
        Don't have an account? Sign up
      </Button>
    </form>
  );
}
