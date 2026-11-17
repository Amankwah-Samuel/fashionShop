import type { Metadata } from "next";
import FavouritesView from "./FavouritesView";

export const metadata: Metadata = {
  title: "Favourites · Girl's Hood",
  description: "Pieces you've saved for later.",
};

export default function FavouritesPage() {
  return (
    <main className="flex-1">
      <FavouritesView />
    </main>
  );
}
