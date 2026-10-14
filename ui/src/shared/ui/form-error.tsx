type FormErrorProps = {
  message?: string;
};
export default function FormError({ message }: FormErrorProps) {
  if (!message) return null;
  return (
    <div className="text-sm text-destructive" role="alert">
      {message}
    </div>
  );
}
