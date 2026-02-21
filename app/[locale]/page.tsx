import { useTranslations } from "next-intl";

export default function HomePage() {
  const t = useTranslations("home");

  return (
    <main>
      {/* Hero Section */}
      <section className="relative min-h-[80vh] flex items-center justify-center bg-gradient-to-br from-brand-800 via-brand-700 to-brand-900 text-white">
        <div className="container text-center">
          <h1 className="font-display text-5xl md:text-7xl font-bold mb-6">
            {t("hero.title")}
          </h1>
          <p className="text-xl md:text-2xl text-brand-200 max-w-2xl mx-auto mb-10">
            {t("hero.subtitle")}
          </p>
          <a
            href="/programs"
            className="inline-flex items-center px-8 py-4 bg-accent-500 hover:bg-accent-400 text-white font-semibold rounded-lg transition-colors text-lg"
          >
            {t("hero.cta")}
          </a>
        </div>
      </section>

      {/* Programs Preview */}
      <section className="py-24">
        <div className="container">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-center mb-4">
            {t("programs.title")}
          </h2>
          <p className="text-muted-foreground text-center text-lg mb-16 max-w-2xl mx-auto">
            {t("programs.subtitle")}
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            {/* Program cards will be populated from Sanity */}
            <div className="p-8 rounded-xl border bg-card text-card-foreground hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-brand-100 text-brand-600 flex items-center justify-center mb-4 text-xl font-bold">
                S
              </div>
              <h3 className="font-display text-xl font-semibold mb-2">
                SalesMade Academy
              </h3>
              <p className="text-muted-foreground">
                Vertriebsexzellenz für B2B-Teams
              </p>
            </div>
            <div className="p-8 rounded-xl border bg-card text-card-foreground hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-accent-100 text-accent-600 flex items-center justify-center mb-4 text-xl font-bold">
                L
              </div>
              <h3 className="font-display text-xl font-semibold mb-2">
                Liquid Leadership
              </h3>
              <p className="text-muted-foreground">
                Führungskompetenz für die neue Arbeitswelt
              </p>
            </div>
            <div className="p-8 rounded-xl border bg-card text-card-foreground hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-brand-100 text-brand-600 flex items-center justify-center mb-4 text-xl font-bold">
                1:1
              </div>
              <h3 className="font-display text-xl font-semibold mb-2">
                Executive Coaching
              </h3>
              <p className="text-muted-foreground">
                Individuelles Coaching für Führungskräfte
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Frameworks Preview */}
      <section className="py-24 bg-muted/50">
        <div className="container">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-center mb-4">
            {t("frameworks.title")}
          </h2>
          <p className="text-muted-foreground text-center text-lg mb-16 max-w-2xl mx-auto">
            {t("frameworks.subtitle")}
          </p>
          {/* Framework cards will be populated from Sanity */}
        </div>
      </section>
    </main>
  );
}
