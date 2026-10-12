import { cn } from "cn"
import { Input } from "./input"
import { Label } from "./label"
import { getFieldError } from "../lib/form"

export const FormField = ({
    className = '',
    ...props
}) => {
    const messageError = getFieldError(props.errors, props.type);
    return (
        <div className={cn(className)}>
            <Label htmlFor={props.text}>{props.text}</Label>
            <Input type={props.type} placeholder={props.text} {...props.register}/>
            {messageError && <span className="text-red-400 text-sm italic">{messageError}</span>}
        </div>
    )

}