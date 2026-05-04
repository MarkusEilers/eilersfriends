import { redirect } from 'next/navigation'

export default function B2bOffersRedirect() {
  // /b2b-offers ist jetzt ein Framework-Eintrag in der DB.
  // Persistente Redirect zur sauberen URL — bestehende Links funktionieren weiter.
  redirect('/frameworks/b2b-angebote')
}
