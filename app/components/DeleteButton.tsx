"use client";

import { useConfirm } from "@/app/components/ConfirmDialog";

interface Props {
  action: () => Promise<void>;
  confirm?: string;
  className?: string;
  children?: React.ReactNode;
}

export default function DeleteButton({ action, confirm: confirmMsg, className, children }: Props) {
  const confirm = useConfirm();

  return (
    <button
      type="button"
      className={className}
      onClick={async () => {
        if (confirmMsg) {
          const ok = await confirm({ message: confirmMsg, danger: true, confirmLabel: "מחק" });
          if (!ok) return;
        }
        await action();
      }}
    >
      {children ?? "🗑"}
    </button>
  );
}
