import type { Metadata } from "next";
import Catalog from "../_components/Catalog";

export const metadata: Metadata = {
  title: "New Arrivals · Girl's Hood",
  description: "The latest pieces just added to Girl's Hood.",
};

export default function NewArrivalsPage({ searchParams }: PageProps<"/new-arrivals">) {
  return (
    <Catalog
      eyebrow="Just In"
      title="New Arrivals"
      intro="Fresh pieces, just landed. Be the first to wear them."
      source="new"
      basePath="/new-arrivals"
      searchParams={searchParams}
    />
  );
}
