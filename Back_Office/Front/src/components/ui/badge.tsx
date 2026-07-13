import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90",
        destructive1:
          "border-transparent bg-destructive text-white [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
        success:
          "text-xs font-medium px-3 py-1 rounded-b-2xl rounded-tl-2xl inline-flex items-center gap-1 bg-[#6BCF9D] text-white dark:bg-green-600/10 dark:border-green-600 dark:text-green-400 dark:[a&]:hover:bg-green-400/10 dark:[a&]:hover:text-green-400/90  ",

        update:
          "text-xs font-medium px-3 py-1 rounded-b-2xl rounded-tl-2xl inline-flex items-center gap-1  bg-[#43ced7ff] text-white border-sky-300 dark:bg-sky-400/10 dark:text-sky-400 dark:border-sky-500",
        destructive:
          "text-xs font-medium px-3 py-1 rounded-b-2xl rounded-tl-2xl inline-flex items-center gap-1 bg-red-500 text-white dark:text-destructive dark:bg-destructive/10 dark:border-destructive/50",

        warning:
          "text-xs font-medium px-3 py-1 rounded-b-2xl rounded-tl-2xl inline-flex items-center gap-1 bg-[#FFA559] text-white dark:bg-[#FF8C42]/10 dark:text-[#FF8C42] dark:border-[#FF8C42]/50",

        warning_outline:
          "text-xs font-medium px-3 py-1 rounded-b-2xl rounded-tl-2xl inline-flex items-center gap-1 border border-yellow-400 text-yellow-600",

        blue: "text-xs font-medium px-3 py-1 rounded-b-2xl rounded-tl-2xl inline-flex items-center gap-1 bg-[#3B82F6] text-white dark:bg-blue-600/10 dark:text-blue-400 dark:border-blue-500/50",
        info: "text-xs font-medium px-3 py-1 rounded-b-2xl rounded-tl-2xl inline-flex items-center gap-1 bg-[#BA85FF] text-white dark:bg-purple-600/10 dark:text-purple-400 dark:border-purple-500/50",

        info_outline:
          "text-xs font-medium px-3 py-1 rounded-b-2xl rounded-tl-2xl inline-flex items-center gap-1 border border-[#BA85FF] text-purple-600",

        login:
          "text-xs font-medium px-3 py-1 rounded-b-2xl rounded-tl-2xl inline-flex items-center gap-1 border-gray-500/30 bg-gray-100 text-gray-700 dark:border-gray-400 dark:bg-gray-800 dark:text-gray-200 [a&]:hover:bg-gray-200 [a&]:hover:text-gray-800 dark:[a&]:hover:bg-gray-700 dark:[a&]:hover:text-gray-100",

        logout:
          "text-xs font-medium px-3 py-1 rounded-b-2xl rounded-tl-2xl inline-flex items-center gap-1 border-gray-500/30 bg-gray-100 text-gray-700 dark:border-gray-400 dark:bg-gray-800 dark:text-gray-200 [a&]:hover:bg-gray-200 [a&]:hover:text-gray-800 dark:[a&]:hover:bg-gray-700 dark:[a&]:hover:text-gray-100",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span";

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
