import { useTranslations } from "next-intl";
import Link from "next/link";

export default function NotFound() {
  const t = useTranslations();
  
  return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <div className="text-center">
        <h1 className="text-6xl font-bold mb-4">404</h1>
        <p className="text-xl text-muted-foreground mb-8">Seite nicht gefunden</p>
        <Link href="/" className="text-brand underline hover:text-brand/80 transition-colors">
          Zurück zur Startseite
        </Link>
      </div>
    </div>
  );
}
