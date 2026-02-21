import { PortalSidebar } from "@/components/portal/sidebar";

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <PortalSidebar />
      <main className="flex-1 p-6 md:p-8 lg:p-10">{children}</main>
    </div>
  );
}
