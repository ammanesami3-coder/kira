import type { BookingStatus } from "@/types/database.types";
import type { badgeVariants } from "@/components/ui/badge";
import type { VariantProps } from "class-variance-authority";

type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>["variant"]>;

/** Visual variant per booking status, shared across admin views. */
export const StatusBadgeVariant: Record<BookingStatus, BadgeVariant> = {
  pending: "outline",
  confirmed: "default",
  completed: "secondary",
  cancelled: "destructive",
};
