import {
  BriefcaseBusiness,
  Building2,
  Car,
  LayoutGrid,
  Shirt,
  Smartphone,
  Sofa,
  Sprout,
  type LucideIcon,
} from "lucide-react";
import type { CategoryIcon as CategoryIconKey } from "@/lib/data/types";

const icons: Record<CategoryIconKey, LucideIcon> = {
  vehicles: Car,
  property: Building2,
  electronics: Smartphone,
  "home-garden": Sofa,
  fashion: Shirt,
  "jobs-services": BriefcaseBusiness,
  agriculture: Sprout,
  other: LayoutGrid,
};

export function CategoryIcon({ icon, className }: { icon: CategoryIconKey | null; className?: string }) {
  const Icon = icons[icon ?? "other"];
  return <Icon aria-hidden="true" className={className} strokeWidth={1.75} />;
}
