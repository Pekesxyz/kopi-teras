import { ORDER_STATUS_META, type OrderStatusValue } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function OrderStatusBadge({
  status,
  className,
}: {
  status: OrderStatusValue;
  className?: string;
}) {
  const meta = ORDER_STATUS_META[status];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        meta.badgeClass,
        className,
      )}
    >
      {meta.label}
    </span>
  );
}
