import { cn } from "cn";
import { Input } from "./input";
import { Label } from "./label";
import { useId, type ComponentProps } from "react";

type FormFieldProps = ComponentProps<typeof Input> & {
  label: string;
  error?: string;
};

export const FormField = ({ label, error, className = "", id, ...inputProps }: FormFieldProps) => {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = `${inputId}-error`;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label htmlFor={inputId}>{label}</Label>
      <Input
        id={inputId}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        {...inputProps}
      />
      {Boolean(error) && (
        <p id={errorId} className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
};
