"use client";

import { useFormStatus } from "react-dom";

type LoadingButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  pending?: boolean;
  pendingLabel: string;
};

export function LoadingButton({ children, disabled, pending = false, pendingLabel, ...props }: LoadingButtonProps) {
  const { pending: formPending } = useFormStatus();
  const isPending = pending || formPending;
  return <button {...props} disabled={disabled || isPending} aria-busy={isPending}>
    {isPending && <span className="spinner" aria-hidden="true" />}
    <span>{isPending ? pendingLabel : children}</span>
  </button>;
}
