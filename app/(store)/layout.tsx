import Link from "next/link";
import Header from "../components/Header";
import { SNAPCHAT_USERNAME, formatWhatsAppNumber, snapchatUrl, whatsappChatUrl } from "@/lib/contact";
import { ChatIcon, GhostIcon } from "./_components/icons";

// Shared frame for every customer-facing page: header on top, footer below.
export default function StoreLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <Header />
      {children}
      <footer className="mt-24 border-t border-line bg-blush/40">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-12 sm:flex-row sm:items-end sm:justify-between sm:px-8">
          <div>
            <p className="font-serif text-2xl text-ink">Girl&apos;s Hood</p>
            <p className="mt-2 max-w-xs text-sm text-muted">
             Trendy and elegant fashion pieces for the modern Ghanaian woman.
            </p>
          </div>
          <div className="flex flex-col gap-6 sm:items-end">
            {/* Contact */}
            <ul aria-label="Contact us" className="flex flex-wrap gap-3">
              {whatsappChatUrl ? (
                <li>
                  <a
                    href={whatsappChatUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-full border border-line bg-white px-4 py-2 text-sm text-ink transition-colors hover:border-ink"
                  >
                    <ChatIcon size={17} className="text-whatsapp" />
                    <span>
                      <span className="sr-only">WhatsApp: </span>
                      {formatWhatsAppNumber()}
                    </span>
                  </a>
                </li>
              ) : null}
              <li>
                <a
                  href={snapchatUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-full border border-line bg-white px-4 py-2 text-sm text-ink transition-colors hover:border-ink"
                >
                  <GhostIcon size={17} />
                  <span>
                    <span className="sr-only">Snapchat: </span>@{SNAPCHAT_USERNAME}
                  </span>
                </a>
              </li>
            </ul>

            <nav aria-label="Footer">
              <ul className="flex flex-wrap gap-x-8 gap-y-2 text-sm text-muted">
                <li><Link href="/new-arrivals" className="hover:text-ink">New Arrivals</Link></li>
                <li><Link href="/shop" className="hover:text-ink">Shop</Link></li>
                <li><Link href="/favourites" className="hover:text-ink">Favourites</Link></li>
                <li><Link href="/cart" className="hover:text-ink">Cart</Link></li>
              </ul>
            </nav>
          </div>
        </div>
      </footer>
    </>
  );
}
