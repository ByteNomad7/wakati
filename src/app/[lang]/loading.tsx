import { Container } from "@/components/ui/primitives";
import { ListingGridSkeleton } from "@/components/listings/ListingStates";

export default function Loading() {
  return (
    <Container className="py-10">
      <div className="mb-6 h-8 w-64 animate-pulse rounded bg-navy-100" />
      <ListingGridSkeleton label="Loading / Chargement" count={8} />
    </Container>
  );
}
