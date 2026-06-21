import { Navbar } from "@/components/public/navbar";
import { Footer } from "@/components/public/footer";

/**
 * Chrome for the public-facing site (navbar + footer). The admin dashboard
 * lives outside this group, so it gets its own shell with no public chrome.
 */
export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
