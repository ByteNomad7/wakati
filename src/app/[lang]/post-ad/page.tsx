import { routes } from "@/i18n/paths";
import { ComingSoon, comingSoonMetadata } from "@/components/layout/ComingSoon";

// Phase B: replace with the real post-ad feature (see docs/ROADMAP.md).
export const generateMetadata = () => comingSoonMetadata("postAdTitle", routes.postAd);

export default function Page() {
  return <ComingSoon titleKey="postAdTitle" />;
}
