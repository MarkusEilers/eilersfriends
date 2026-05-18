import { redirect } from 'next/navigation'

/**
 * /academy ist historisch — die Inhalte sind nach /salesmade gewandert.
 * Wir behalten die Route nur als Redirect, damit alte Bookmarks
 * und externe Links nicht ins Leere laufen.
 */
export default function AcademyPage() {
  redirect('/salesmade')
}
