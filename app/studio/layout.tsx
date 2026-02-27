export const metadata = {
  title: "Eilers & Friends CMS",
  description: "Content Management Studio",
};

export default function StudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
