import { routes } from "@/i18n/paths";
import { ComingSoon, comingSoonMetadata } from "@/components/layout/ComingSoon";

// Phase B: replace with the real login feature (see docs/ROADMAP.md).
export const generateMetadata = () => comingSoonMetadata("loginTitle", routes.login);

export default function Page() {
  return <ComingSoon titleKey="loginTitle" />;
}
