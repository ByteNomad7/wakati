import { routes } from "@/i18n/paths";
import { ComingSoon, comingSoonMetadata } from "@/components/layout/ComingSoon";

// Phase B: replace with the real favorites feature (see docs/ROADMAP.md).
export const generateMetadata = () => comingSoonMetadata("favoritesTitle", routes.favorites);

export default function Page() {
  return <ComingSoon titleKey="favoritesTitle" />;
}
