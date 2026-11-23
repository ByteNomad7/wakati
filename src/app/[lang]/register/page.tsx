import { routes } from "@/i18n/paths";
import { ComingSoon, comingSoonMetadata } from "@/components/layout/ComingSoon";

// Phase B: replace with the real register feature (see docs/ROADMAP.md).
export const generateMetadata = () => comingSoonMetadata("registerTitle", routes.register);

export default function Page() {
  return <ComingSoon titleKey="registerTitle" />;
}
