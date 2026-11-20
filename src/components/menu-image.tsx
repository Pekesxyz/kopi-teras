import Image from "next/image";
import { Coffee, CupSoda, Cookie, Soup, Tag } from "lucide-react";
import { cn } from "@/lib/utils";

const CATEGORY_STYLE: Record<string, { icon: typeof Coffee; className: string }> = {
  Coffee: {
    icon: Coffee,
    className: "from-[#1B365D] to-[#005A9C] text-[#A0E0EF]",
  },
  "Non-Coffee": {
    icon: CupSoda,
    className: "from-[#005A9C] to-[#60C1E5] text-white",
  },
  Snack: {
    icon: Cookie,
    className: "from-[#60C1E5] to-[#A0E0EF] text-[#1B365D]",
  },
  "Main Course": {
    icon: Soup,
    className: "from-[#1B365D] via-[#005A9C] to-[#60C1E5] text-white",
  },
  Promo: {
    icon: Tag,
    className: "from-[#005A9C] via-[#1B365D] to-[#60C1E5] text-[#A0E0EF]",
  },
};

/** Gambar menu (next/image) dengan placeholder berbasis kategori bila tidak ada gambar. */
export function MenuImage({
  src,
  alt,
  category,
  className,
  sizes = "(max-width: 640px) 40vw, 200px",
}: {
  src: string | null;
  alt: string;
  category: string;
  className?: string;
  sizes?: string;
}) {
  if (src) {
    return (
      <div className={cn("bg-muted relative overflow-hidden", className)}>
        <Image src={src} alt={alt} fill sizes={sizes} className="object-cover" />
      </div>
    );
  }

  const style = CATEGORY_STYLE[category] ?? CATEGORY_STYLE.Coffee;
  const Icon = style.icon;
  return (
    <div
      className={cn(
        "grid place-items-center bg-gradient-to-br",
        style.className,
        className,
      )}
      aria-label={alt}
      role="img"
    >
      <Icon className="size-1/3 opacity-90" strokeWidth={1.5} />
    </div>
  );
}
