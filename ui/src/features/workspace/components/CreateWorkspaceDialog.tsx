import { Button } from "@/shared/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { FormField } from "@/shared/ui/form-field";
import { zodResolver } from "@hookform/resolvers/zod";
import { createWorkspaceSchema, type CreateWorkspaceInput } from "@ttm/shared";
import { useForm } from "react-hook-form";
import { useCreateWorkspace } from "../hooks";
import { applyApiErrorToForm, getFieldError } from "@/shared/lib/form";
import FormError from "@/shared/ui/form-error";

type CreateWorkspaceProps = {
  open: boolean;
  onClose: () => void;
  onRefresh: () => void;
};
const CREATE_WORKSPACE_FIELDS = createWorkspaceSchema.keyof().options;
const DialogCreateWorkspace = ({ open, onClose, onRefresh }: CreateWorkspaceProps) => {
  const form = useForm<CreateWorkspaceInput>({
    resolver: zodResolver(createWorkspaceSchema),
    defaultValues: {
      name: "",
      projectName: "",
    },
  });
  const create = useCreateWorkspace();
  const { errors } = form.formState;

  const onSubmit = (data: CreateWorkspaceInput) => {
    create.mutate(data, {
      onError: (error) => applyApiErrorToForm(error, form.setError, CREATE_WORKSPACE_FIELDS),
      onSuccess: () => {
        onClose();
        onRefresh();
      },
    });
  };
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Workspace</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <FormError message={errors?.root?.server?.message} />

          <FormField
            label="Workspace Name"
            type="text"
            error={getFieldError(errors, "name")}
            {...form.register("name")}
          />
          <FormField
            className="my-2"
            label="Project Name"
            type="text"
            error={getFieldError(errors, "projectName")}
            {...form.register("projectName")}
          />
          <Button type="submit" variant={"default"} disabled={create.isPending}>
            {create.isPending ? "Submitting" : "Submit"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default DialogCreateWorkspace;
