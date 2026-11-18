import { notFound } from 'next/navigation'

/** Fängt alle unbekannten Pfade unter einer Sprache ab, damit die 404-Seite mit Navigation und Sprache rendert. */
export default function CatchAll() {
  notFound()
}
