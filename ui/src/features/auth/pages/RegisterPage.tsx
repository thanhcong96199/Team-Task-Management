import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, type RegisterInput } from "@ttm/shared";
import { useForm } from "react-hook-form"
import { useRegister } from "../hooks";
import { applyApiErrorToForm } from "@/shared/lib/form";
import { FormField } from "@/shared/ui/form-field";
import { Button } from "@/shared/ui/button";

const REGISTER_FIELDS = registerSchema.keyof().options;

export default function RegisterPage() {
    const formRegister = useForm<RegisterInput>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            name: "",
            email: "",
            password: ""
        }
    });

    const register = useRegister();
    const { errors } = formRegister.formState;

    const onSubmit = (data: RegisterInput) => {
        register.mutate(data, {
            onError: (error) => applyApiErrorToForm(error, formRegister.setError, REGISTER_FIELDS),
        })
    }

    return (
        <form
            className="w-[20%] ml-auto mr-auto mt-5"
            onSubmit={formRegister.handleSubmit(onSubmit)}
            noValidate>

            <FormField
                className="mb-3"
                type="text"
                text="Name"
                errors={errors}
                register={formRegister.register('name')}
            />

            <FormField
                className="mb-3"
                text="Email"
                type="email"
                errors={errors}
                register={formRegister.register('email')}
            />

            <FormField
                className="mb-3"
                text="Password"
                type="password"
                errors={errors}
                register={formRegister.register('password')}
            />

            <Button
                type="submit"
                variant={"default"}>Create account</Button>
        </form>
    )
}