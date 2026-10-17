"use client";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
export type Result = { message: string; ok?: boolean };
export type FormAction = (state: Result, form: FormData) => Promise<Result>;
export function ActionForm({
  action,
  children,
  label,
  disabled = false,
}: {
  action: FormAction;
  children: React.ReactNode;
  label: string;
  disabled?: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, { message: "" });
  return (
    <form action={formAction} className="form">
      <fieldset disabled={disabled || pending}>
        {children}
        <Button type="submit" disabled={disabled || pending}>
          {pending ? "Aguarde…" : label}
        </Button>
      </fieldset>
      {state.message && (
        <p className={state.ok ? "feedback success" : "feedback"} role="status">
          {state.message}
        </p>
      )}
    </form>
  );
}
