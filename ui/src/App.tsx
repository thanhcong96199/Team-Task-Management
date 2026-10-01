import { useForm } from "react-hook-form"
import type { SubmitHandler } from "react-hook-form"
import { authApi } from "./features/auth/api"


type Inputs = {
  example: string
  exampleRequired: string
}


export default function App() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Inputs>()
  const onSubmit: SubmitHandler<Inputs> = (data) => {
    authApi.login({ email: data.example, password: data.exampleRequired });
  }
// watch input value by passing its name


  return (
    /* "handleSubmit" will validate your inputs before invoking "onSubmit" */
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* register your input into the hook by invoking the "register" function */}
      <input defaultValue="test" {...register("example", { required: true })} />


      {/* include validation with required or other standard HTML validation rules */}
      <input {...register("exampleRequired", { required: true })} />
      {/* errors will return when field validation fails  */}
      {errors.exampleRequired && <span>This field is required</span>}


      <input type="submit" />
      <button type="button" onClick={() => authApi.getMe()}>
        Get Me
      </button>
      <button type="button" onClick={() => authApi.refreshToken()}>
        Refresh Token
      </button>
      <button type="button" onClick={() => authApi.logout()}>
        Logout
      </button>
    </form>
  )
}