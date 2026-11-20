import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default: "bg-[#1B365D] text-white shadow-xs hover:bg-[#005A9C]",
        destructive:
          "bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/30",
        success: "bg-emerald-600 text-white shadow-xs hover:bg-emerald-700",
        outline:
          "border bg-background shadow-xs hover:bg-[#A0E0EF]/40 hover:text-[#1B365D]",
        secondary: "bg-[#E3F5FB] text-[#1B365D] shadow-xs hover:bg-[#A0E0EF]/70",
        ghost: "hover:bg-[#A0E0EF]/40 hover:text-[#1B365D]",
        link: "text-[#005A9C] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-11 rounded-md px-6 text-base has-[>svg]:px-4",
        xl: "h-14 rounded-lg px-8 text-lg has-[>svg]:px-6",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
