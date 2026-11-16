import type { Metadata } from "next";
import Catalog from "../_components/Catalog";

export const metadata: Metadata = {
  title: "Shop · Girl's Hood",
  description: "Shop the full Girl's Hood collection of soft, sophisticated Korean-style pieces.",
};

export default function ShopPage({ searchParams }: PageProps<"/shop">) {
  return (
    <Catalog
      eyebrow="The Collection"
      title="Shop"
      intro="Every piece in the collection: soft knits, flowing skirts and easy layers made to mix and match."
      source="all"
      basePath="/shop"
      searchParams={searchParams}
    />
  );
}
