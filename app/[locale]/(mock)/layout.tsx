/**
 * Mock-Site layout — used for SalesMade simulation pages.
 *
 * Intentionally NOT rendering EilersFriends Topbar/Navbar/Footer:
 * the simulation pages stage themselves as third-party corporate
 * sites and need to maintain that illusion.
 */
export default function MockLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
