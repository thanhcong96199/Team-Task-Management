import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, type RegisterInput } from "@ttm/shared";
import { useForm } from "react-hook-form";
import { useRegister } from "../hooks";
import { applyApiErrorToForm, getFieldError } from "@/shared/lib/form";
import { FormField } from "@/shared/ui/form-field";
import { Button } from "@/shared/ui/button";
import { Link } from "react-router";
import FormError from "@/shared/ui/form-error";

const REGISTER_FIELDS = registerSchema.keyof().options;

export default function RegisterPage() {
  const formRegister = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  const register = useRegister();
  const { errors } = formRegister.formState;

  const onSubmit = (data: RegisterInput) => {
    register.mutate(data, {
      onError: (error) => applyApiErrorToForm(error, formRegister.setError, REGISTER_FIELDS),
    });
  };

  return (
    <form
      className="w-full max-w-sm mx-auto flex flex-col gap-3"
      onSubmit={formRegister.handleSubmit(onSubmit)}
      noValidate
    >
      <FormError message={errors?.root?.server?.message} />

      <FormField
        type="text"
        label="Name"
        error={getFieldError(errors, "name")}
        {...formRegister.register("name")}
      />

      <FormField
        label="Email"
        type="email"
        error={getFieldError(errors, "email")}
        {...formRegister.register("email")}
      />

      <FormField
        label="Password"
        type="password"
        error={getFieldError(errors, "password")}
        {...formRegister.register("password")}
      />

      <Button type="submit" variant={"default"} disabled={register.isPending}>
        {register.isPending ? "Creating account..." : "Create account"}
      </Button>
      <Button variant={"link"} nativeButton={false} render={<Link to="/login" />}>
        Already have an account? Log in
      </Button>
    </form>
  );
}
