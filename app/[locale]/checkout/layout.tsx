// app/[locale]/checkout/layout.tsx
// Strips marketing/portal chrome — full-width checkout
export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-white">{children}</div>
}
