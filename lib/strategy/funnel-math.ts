/**
 * Know Your Numbers — Funnel-Mathematik (Sales Activity Planner).
 *
 * Uebernommen aus dem „Sales Activity Planner" (Lovable-App, Feb. 2026):
 * Typen, Standardwerte und Rechenlogik unveraendert, damit die Zahlen im
 * Strategie-Schritt dieselben sind wie im Planner. Reine Funktionen — laeuft
 * im Browser und auf dem Server.
 */

export interface SalesParameters {
  yearlyTarget: number; // Jahresziel in €
  averageDealSize: number; // Average Dealsize in €
  minimumDealSize: number; // Minimum Dealsize in €
  largeDealSize: number; // Large/TOP Dealsize in €
  workingMonths: number; // Arbeitsmonate pro Jahr
  workingWeeksPerMonth: number; // Arbeitswochen pro Monat
  workingDaysPerWeek: number; // Arbeitstage pro Woche
  
  // Conversions
  conversionColdToSQL: number; // Cold zu Sales Qualified Lead (%)
  conversionSQLToDeal: number; // SQL zu Deal/Discovery (%)
  conversionDiscoveryToProposal: number; // Discovery zu Proposal (%)
  conversionDealToOrder: number; // Deal/Proposal zu Auftrag (%)
  
  // Zeitbedarfe in Minuten
  timeColdCall: number;
  timeWeCareCall: number;
  timeWinBackCall: number;
  timeGrowThroughCustomer: number;
  timeDiscoveryCall: number;
  timeRecommendationCall: number;
  timeNegotiatedOffer: number;
  timeClosing: number;
  timeBuffer: number;
  
  // Kampagnen-Conversions (%)
  conversionWeCare: number;
  conversionColdCall: number;
  conversionWinBack: number;
  conversionRecommendations: number;
  
  // Quellenverteilung (%)
  distributionCold: number;
  distributionWeCare: number;
  distributionWinBack: number;
  distributionRecommendations: number;
  
  // Deal Mix (%)
  averageDealPercentage: number;
  topDealPercentage: number;
  
  // Current Results Gap
  currentResultsGap: number;
  
  // Zeitraum & Ramp-Up
  planningStartDate: string; // Start der 12-Monats-Periode (ISO date)
  rampUpStartDate: string; // Start der Vertriebsaktivität (ISO date)
  lagColdToDiscovery: number; // Default 2 Wochen
  lagDiscoveryToProposal: number; // Default 4 Wochen
  lagProposalToClose: number; // Default 16 Wochen (ca. 4 Monate)
  
  // Hauptfarben der Seite
  themePrimary: string;
  themeAccent: string;
  themeSuccess: string;
  
  // Farbsequenz (5 Farben für Funnel/Charts)
  colorSequence: string[];
  
  // Marketing ROI
  marketingROI: number;
  
  // Logo (Base64 oder URL)
  logoUrl?: string | null;
  
  // Cash-In Modus: Jahresziel muss als Zahlungseingang realisiert werden
  cashInMode: boolean;
  
  // Planungsmodus: 'target' = vom Umsatzziel rückwärts, 'capacity' = vom Team vorwärts
  planningMode: 'target' | 'capacity';
  
  // Team-Kapazitäten (nur im capacity-Modus relevant)
  sdrCount: number; // Anzahl SDRs
  aeCount: number; // Anzahl AEs
  sdrCapacityPerMonth: number; // Discoveries pro SDR pro Monat
  aeCapacityPerMonth: number; // Proposals pro AE pro Monat
}

export interface CalculatedMetrics {
  // Deals benötigt
  dealsNeededAverage: number;
  dealsNeededTop: number;
  totalDealsNeeded: number;
  
  // Pro Zeiteinheit
  dealsPerMonth: number;
  dealsPerWeek: number;
  dealsPerDay: number;
  
  // Discoveries benötigt
  discoveriesNeededAverage: number;
  discoveriesNeededTop: number;
  totalDiscoveries: number;
  
  // Proposals benötigt
  totalProposals: number;
  
  // SQLs benötigt
  totalSQLs: number;
  
  // Aktivitäten pro Monat
  coldCallsPerMonth: number;
  weCareCallsPerMonth: number;
  winBackCallsPerMonth: number;
  recommendationsPerMonth: number;
  
  // Zeitbedarf
  hoursPerMonth: number;
  hoursPerWeek: number;
  hoursPerDay: number;
  
  // Lead-Werte pro Phase
  leadValuePhase1: number;
  leadValuePhase2: number;
  leadValuePhase3: number;
  leadValuePhase4: number;
  leadValuePhase5: number;
  
  // Ergebnis pro Zeiteinheit
  revenuePerMonth: number;
  revenuePerWeek: number;
  revenuePerDay: number;
}

export interface FunnelStage {
  name: string;
  nameDe: string;
  count: number;
  value: number;
  conversionToNext: number;
  color: string;
}

export const defaultParameters: SalesParameters = {
  yearlyTarget: 234000,
  averageDealSize: 18500,
  minimumDealSize: 9500,
  largeDealSize: 50000,
  workingMonths: 10.5,
  workingWeeksPerMonth: 4,
  workingDaysPerWeek: 4,
  
  conversionColdToSQL: 2,
  conversionSQLToDeal: 30,
  conversionDiscoveryToProposal: 80,
  conversionDealToOrder: 50,
  
  timeColdCall: 15,
  timeWeCareCall: 30,
  timeWinBackCall: 30,
  timeGrowThroughCustomer: 150,
  timeDiscoveryCall: 90,
  timeRecommendationCall: 90,
  timeNegotiatedOffer: 90,
  timeClosing: 180,
  timeBuffer: 180,
  
  conversionWeCare: 28,
  conversionColdCall: 2,
  conversionWinBack: 5,
  conversionRecommendations: 56,
  
  distributionCold: 80,
  distributionWeCare: 0,
  distributionWinBack: 5,
  distributionRecommendations: 15,
  
  averageDealPercentage: 67,
  topDealPercentage: 33,
  
  currentResultsGap: 84,
  
  // Zeitraum & Ramp-Up Defaults
  planningStartDate: new Date().toISOString().split('T')[0],
  rampUpStartDate: new Date().toISOString().split('T')[0],
  lagColdToDiscovery: 2,
  lagDiscoveryToProposal: 4,
  lagProposalToClose: 16,
  
  // Hauptfarben der Seite
  themePrimary: "#3b5998",
  themeAccent: "#e07850",
  themeSuccess: "#4a9c6d",
  
  // Farbsequenz (5 Farben für Funnel/Charts)
  colorSequence: ["#0F1E3A", "#33415C", "#E07850", "#1A5FD4", "#1A5FD4"],
  
  // Marketing ROI
  marketingROI: 3,
  
  // Logo
  logoUrl: undefined,
  
  // Cash-In Modus
  cashInMode: false,
  
  // Planungsmodus
  planningMode: 'target' as const,
  sdrCount: 1,
  aeCount: 1,
  sdrCapacityPerMonth: 12,
  aeCapacityPerMonth: 18,
};


export function calculateCashInMultiplier(params: SalesParameters): number {
  if (!params.cashInMode) return 1;

  // Gesamtvorlaufzeit bis zum ersten Abschluss (in Monaten)
  const totalLagWeeks = params.lagColdToDiscovery + params.lagDiscoveryToProposal + params.lagProposalToClose;
  const totalLagMonths = totalLagWeeks / 4;

  // Deals sind gleichmäßig verteilt zwischen erstem Abschluss (= totalLagMonths)
  // und letztem möglichen Abschluss (= workingMonths).
  // Durchschnittlicher Abschlussmonat = Mittelpunkt dieses Intervalls.
  const firstCloseMonth = Math.min(totalLagMonths, params.workingMonths);
  const lastCloseMonth = params.workingMonths;
  const avgCloseMonth = (firstCloseMonth + lastCloseMonth) / 2;

  // Ø verbleibende Monate für Cash-Eingang bis Jahresende (12 Monate = 1 Jahr)
  const avgRemainingMonths = Math.max(1, 12 - avgCloseMonth);

  // Multiplikator: 12 / Ø verbleibende Monate
  // Beispiel: Ø Abschluss in Monat 8 → 4 Monate Cash → ×3 mehr Deals nötig
  return 12 / avgRemainingMonths;
}

// Hilfsfunktion: Ø verbleibende Monate (für Anzeige in der UI)
export function getCashInRemainingMonths(params: SalesParameters): number {
  const totalLagWeeks = params.lagColdToDiscovery + params.lagDiscoveryToProposal + params.lagProposalToClose;
  const totalLagMonths = totalLagWeeks / 4;
  const firstCloseMonth = Math.min(totalLagMonths, params.workingMonths);
  const avgCloseMonth = (firstCloseMonth + params.workingMonths) / 2;
  return Math.max(1, 12 - avgCloseMonth);
}

export function calculateMetrics(params: SalesParameters): CalculatedMetrics {
  // Im Kapazitäts-Modus: Forward-Berechnung vom Team
  if (params.planningMode === 'capacity') {
    return calculateCapacityMetrics(params);
  }
  
  // Berechne die Anzahl der benötigten Deals direkt vom Ziel
  const targetWithGap = params.yearlyTarget * (params.currentResultsGap / 100);
  
  // Cash-In: Ziel hochgerechnet damit tatsächlich das Jahresziel als Cash fliesst
  const cashInMultiplier = calculateCashInMultiplier(params);
  const effectiveTarget = targetWithGap * cashInMultiplier;
  
  // Einfache Berechnung: Effektives Ziel / durchschnittliche Dealgröße
  const totalDealsNeeded = Math.ceil(effectiveTarget / params.averageDealSize);
  
  // Aufteilung nach Deal-Mix (für Anzeige, nicht für Gesamtzahl)
  const dealsNeededAverage = Math.round(totalDealsNeeded * (params.averageDealPercentage / 100));
  const dealsNeededTop = totalDealsNeeded - dealsNeededAverage;
  
  // Pro Zeiteinheit
  const dealsPerMonth = totalDealsNeeded / params.workingMonths;
  const dealsPerWeek = dealsPerMonth / params.workingWeeksPerMonth;
  const dealsPerDay = dealsPerWeek / params.workingDaysPerWeek;
  
  // Proposals benötigt (basierend auf Conversion Deal zu Auftrag)
  const proposalsNeededAverage = Math.ceil(dealsNeededAverage / (params.conversionDealToOrder / 100));
  const proposalsNeededTop = Math.ceil(dealsNeededTop / (params.conversionDealToOrder / 100));
  const totalProposals = proposalsNeededAverage + proposalsNeededTop;
  
  // Discoveries benötigt (basierend auf Conversion Discovery zu Proposal)
  const discoveriesNeededAverage = Math.ceil(proposalsNeededAverage / (params.conversionDiscoveryToProposal / 100));
  const discoveriesNeededTop = Math.ceil(proposalsNeededTop / (params.conversionDiscoveryToProposal / 100));
  const totalDiscoveries = discoveriesNeededAverage + discoveriesNeededTop;
  
  // SQLs benötigt
  const sqlsNeeded = Math.ceil(totalDiscoveries / (params.conversionSQLToDeal / 100));
  const totalSQLs = sqlsNeeded;
  
  // Aktivitäten basierend auf Quellenverteilung
  const coldCallsNeeded = Math.ceil(
    (sqlsNeeded * (params.distributionCold / 100)) / (params.conversionColdCall / 100)
  );
  const weCareCallsNeeded = Math.ceil(
    (sqlsNeeded * (params.distributionWeCare / 100)) / (params.conversionWeCare / 100)
  );
  const winBackCallsNeeded = Math.ceil(
    (sqlsNeeded * (params.distributionWinBack / 100)) / (params.conversionWinBack / 100)
  );
  const recommendationsNeeded = Math.ceil(
    (sqlsNeeded * (params.distributionRecommendations / 100)) / (params.conversionRecommendations / 100 || 1)
  );
  
  // Pro Monat
  const coldCallsPerMonth = coldCallsNeeded / params.workingMonths;
  const weCareCallsPerMonth = weCareCallsNeeded / params.workingMonths;
  const winBackCallsPerMonth = winBackCallsNeeded / params.workingMonths;
  const recommendationsPerMonth = recommendationsNeeded / params.workingMonths;
  
  // Zeitbedarf berechnen
  const totalMinutesPerMonth = 
    (coldCallsPerMonth * params.timeColdCall) +
    (weCareCallsPerMonth * params.timeWeCareCall) +
    (winBackCallsPerMonth * params.timeWinBackCall) +
    (recommendationsPerMonth * params.timeRecommendationCall) +
    ((totalDiscoveries / params.workingMonths) * params.timeDiscoveryCall) +
    ((totalProposals / params.workingMonths) * params.timeNegotiatedOffer) +
    ((totalDealsNeeded / params.workingMonths) * (params.timeClosing + params.timeBuffer));
  
  const hoursPerMonth = totalMinutesPerMonth / 60;
  const hoursPerWeek = hoursPerMonth / params.workingWeeksPerMonth;
  const hoursPerDay = hoursPerWeek / params.workingDaysPerWeek;
  
  // Lead-Werte pro Phase (rückwärts vom Deal-Wert)
  const avgDealValue = (params.averageDealSize * (params.averageDealPercentage / 100)) + 
                       (params.largeDealSize * (params.topDealPercentage / 100));
  
  const leadValuePhase5 = avgDealValue; // Deal abgeschlossen
  const leadValuePhase4 = leadValuePhase5 * (params.conversionDealToOrder / 100);
  const leadValuePhase3 = leadValuePhase4 * (params.conversionSQLToDeal / 100);
  const leadValuePhase2 = leadValuePhase3 * 0.5; // Qualification
  const leadValuePhase1 = leadValuePhase2 * (params.conversionColdToSQL / 100);
  
  // Ergebnis pro Zeiteinheit (basierend auf effektivem Ziel)
  const revenuePerMonth = effectiveTarget / params.workingMonths;
  const revenuePerWeek = revenuePerMonth / params.workingWeeksPerMonth;
  const revenuePerDay = revenuePerWeek / params.workingDaysPerWeek;
  
  return {
    dealsNeededAverage,
    dealsNeededTop,
    totalDealsNeeded,
    dealsPerMonth,
    dealsPerWeek,
    dealsPerDay,
    discoveriesNeededAverage,
    discoveriesNeededTop,
    totalDiscoveries,
    totalProposals,
    totalSQLs,
    coldCallsPerMonth,
    weCareCallsPerMonth,
    winBackCallsPerMonth,
    recommendationsPerMonth,
    hoursPerMonth,
    hoursPerWeek,
    hoursPerDay,
    leadValuePhase1,
    leadValuePhase2,
    leadValuePhase3,
    leadValuePhase4,
    leadValuePhase5,
    revenuePerMonth,
    revenuePerWeek,
    revenuePerDay,
  };
}

export function generateFunnelStages(params: SalesParameters, metrics: CalculatedMetrics): FunnelStage[] {
  // Rückwärts vom Ziel berechnen:
  // 1. Abschlüsse (Closed Won) = totalDealsNeeded
  const closedWon = metrics.totalDealsNeeded;
  
  // 2. Angebote (Proposals) = Abschlüsse / Abschluss-Conversion (50%)
  const proposals = Math.ceil(closedWon / (params.conversionDealToOrder / 100));
  
  // 3. Bedarfsanalyse (Discovery) = Proposals / Discovery-zu-Proposal-Conversion (80%)
  const discoveries = Math.ceil(proposals / (params.conversionDiscoveryToProposal / 100));
  
  // 4. SQLs (Qualifiziert) = Discoveries / SQL-zu-Discovery-Conversion (30%)
  const sqlsNeeded = Math.ceil(discoveries / (params.conversionSQLToDeal / 100));
  
  // 5. Gewichtete Conversion von Erstkontakt → Qualifiziert (SQL)
  // basierend auf Quellenverteilung × Kampagnen-Conversions
  const weightedColdToSQL = 
    (params.distributionCold / 100) * (params.conversionColdCall / 100) +
    (params.distributionWeCare / 100) * (params.conversionWeCare / 100) +
    (params.distributionWinBack / 100) * (params.conversionWinBack / 100) +
    (params.distributionRecommendations / 100) * (params.conversionRecommendations / 100);
  
  // 6. Cold Leads (Erstkontakt) = SQLs / gewichtete Conversion
  const totalLeads = Math.ceil(sqlsNeeded / weightedColdToSQL);
  
  // Farben aus der Konfiguration verwenden
  const colors = params.colorSequence || [
    "#1a1a1a", "#1a1a1a", "#e07850", "#0099e5", "#0099e5"
  ];
  
  // Die konfigurierten Raten werden direkt angezeigt (nicht die berechneten)
  return [
    {
      name: "Cold Leads",
      nameDe: "Erstkontakt",
      count: totalLeads,
      value: metrics.leadValuePhase1,
      conversionToNext: weightedColdToSQL * 100, // Gewichtete %
      color: colors[0],
    },
    {
      name: "Qualified",
      nameDe: "Qualifizierung",
      count: sqlsNeeded,
      value: metrics.leadValuePhase2,
      conversionToNext: params.conversionSQLToDeal, // 30%
      color: colors[1],
    },
    {
      name: "Discovery",
      nameDe: "Bedarfsanalyse",
      count: discoveries,
      value: metrics.leadValuePhase3,
      conversionToNext: params.conversionDiscoveryToProposal, // 80%
      color: colors[2],
    },
    {
      name: "Proposal",
      nameDe: "Angebot",
      count: proposals,
      value: metrics.leadValuePhase4,
      conversionToNext: params.conversionDealToOrder, // 50%
      color: colors[3],
    },
    {
      name: "Closed Won",
      nameDe: "Abschluss",
      count: closedWon,
      value: metrics.leadValuePhase5,
      conversionToNext: 100,
      color: colors[4],
    },
  ];
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatNumber(value: number, decimals: number = 0): string {
  return new Intl.NumberFormat("de-DE", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatPercent(value: number | undefined | null): string {
  if (value === undefined || value === null || isNaN(value)) return "0%";
  return `${value.toFixed(2)}%`;
}

// Kapazitäts-basierte Vorwärtsberechnung
function calculateCapacityMetrics(params: SalesParameters): CalculatedMetrics {
  // SDR-Output: Discoveries pro Monat
  const discoveriesPerMonth = params.sdrCount * params.sdrCapacityPerMonth;
  
  // Proposals pro Monat (limitiert durch AE-Kapazität)
  const proposalsFromDiscoveries = discoveriesPerMonth * (params.conversionDiscoveryToProposal / 100);
  const aeProposalCapacity = params.aeCount * params.aeCapacityPerMonth;
  const proposalsPerMonth = Math.min(proposalsFromDiscoveries, aeProposalCapacity);
  
  // Closes pro Monat
  const closesPerMonth = proposalsPerMonth * (params.conversionDealToOrder / 100);
  
  // Hochrechnung auf Jahr
  const totalDiscoveries = Math.round(discoveriesPerMonth * params.workingMonths);
  const totalProposals = Math.round(proposalsPerMonth * params.workingMonths);
  const totalDealsNeeded = Math.round(closesPerMonth * params.workingMonths);
  const achievableRevenue = totalDealsNeeded * params.averageDealSize;
  
  // Deal-Mix Aufteilung
  const dealsNeededAverage = Math.round(totalDealsNeeded * (params.averageDealPercentage / 100));
  const dealsNeededTop = totalDealsNeeded - dealsNeededAverage;
  
  // Pro Zeiteinheit
  const dealsPerMonth = totalDealsNeeded / params.workingMonths;
  const dealsPerWeek = dealsPerMonth / params.workingWeeksPerMonth;
  const dealsPerDay = dealsPerWeek / params.workingDaysPerWeek;
  
  // Discovery-Aufteilung
  const discoveriesNeededAverage = Math.round(totalDiscoveries * (params.averageDealPercentage / 100));
  const discoveriesNeededTop = totalDiscoveries - discoveriesNeededAverage;
  
  // SQLs rückwärts berechnen
  const totalSQLs = Math.ceil(totalDiscoveries / (params.conversionSQLToDeal / 100));
  
  // Aktivitäten basierend auf SQLs
  const coldCallsNeeded = Math.ceil(
    (totalSQLs * (params.distributionCold / 100)) / (params.conversionColdCall / 100)
  );
  const weCareCallsNeeded = Math.ceil(
    (totalSQLs * (params.distributionWeCare / 100)) / (params.conversionWeCare / 100)
  );
  const winBackCallsNeeded = Math.ceil(
    (totalSQLs * (params.distributionWinBack / 100)) / (params.conversionWinBack / 100)
  );
  const recommendationsNeeded = Math.ceil(
    (totalSQLs * (params.distributionRecommendations / 100)) / (params.conversionRecommendations / 100 || 1)
  );
  
  const coldCallsPerMonth = coldCallsNeeded / params.workingMonths;
  const weCareCallsPerMonth = weCareCallsNeeded / params.workingMonths;
  const winBackCallsPerMonth = winBackCallsNeeded / params.workingMonths;
  const recommendationsPerMonth = recommendationsNeeded / params.workingMonths;
  
  // Zeitbedarf
  const totalMinutesPerMonth = 
    (coldCallsPerMonth * params.timeColdCall) +
    (weCareCallsPerMonth * params.timeWeCareCall) +
    (winBackCallsPerMonth * params.timeWinBackCall) +
    (recommendationsPerMonth * params.timeRecommendationCall) +
    (discoveriesPerMonth * params.timeDiscoveryCall) +
    (proposalsPerMonth * params.timeNegotiatedOffer) +
    (closesPerMonth * (params.timeClosing + params.timeBuffer));
  
  const hoursPerMonth = totalMinutesPerMonth / 60;
  const hoursPerWeek = hoursPerMonth / params.workingWeeksPerMonth;
  const hoursPerDay = hoursPerWeek / params.workingDaysPerWeek;
  
  // Lead-Werte
  const avgDealValue = (params.averageDealSize * (params.averageDealPercentage / 100)) + 
                       (params.largeDealSize * (params.topDealPercentage / 100));
  const leadValuePhase5 = avgDealValue;
  const leadValuePhase4 = leadValuePhase5 * (params.conversionDealToOrder / 100);
  const leadValuePhase3 = leadValuePhase4 * (params.conversionSQLToDeal / 100);
  const leadValuePhase2 = leadValuePhase3 * 0.5;
  const leadValuePhase1 = leadValuePhase2 * (params.conversionColdToSQL / 100);
  
  const revenuePerMonth = achievableRevenue / params.workingMonths;
  const revenuePerWeek = revenuePerMonth / params.workingWeeksPerMonth;
  const revenuePerDay = revenuePerWeek / params.workingDaysPerWeek;
  
  return {
    dealsNeededAverage,
    dealsNeededTop,
    totalDealsNeeded,
    dealsPerMonth,
    dealsPerWeek,
    dealsPerDay,
    discoveriesNeededAverage,
    discoveriesNeededTop,
    totalDiscoveries,
    totalProposals,
    totalSQLs,
    coldCallsPerMonth,
    weCareCallsPerMonth,
    winBackCallsPerMonth,
    recommendationsPerMonth,
    hoursPerMonth,
    hoursPerWeek,
    hoursPerDay,
    leadValuePhase1,
    leadValuePhase2,
    leadValuePhase3,
    leadValuePhase4,
    leadValuePhase5,
    revenuePerMonth,
    revenuePerWeek,
    revenuePerDay,
  };
}

// Erreichbaren Umsatz im Kapazitätsmodus berechnen
export function getAchievableRevenue(params: SalesParameters): number {
  const discoveriesPerMonth = params.sdrCount * params.sdrCapacityPerMonth;
  const proposalsFromDiscoveries = discoveriesPerMonth * (params.conversionDiscoveryToProposal / 100);
  const aeProposalCapacity = params.aeCount * params.aeCapacityPerMonth;
  const proposalsPerMonth = Math.min(proposalsFromDiscoveries, aeProposalCapacity);
  const closesPerMonth = proposalsPerMonth * (params.conversionDealToOrder / 100);
  const totalDeals = Math.round(closesPerMonth * params.workingMonths);
  const grossRevenue = totalDeals * params.averageDealSize;
  // Im Cash-In Modus: erreichbarer Cash = Brutto / Multiplikator
  if (params.cashInMode) {
    const multiplier = calculateCashInMultiplier(params);
    return grossRevenue / multiplier;
  }
  return grossRevenue;
}


// ── Hochlauf (12 Monate) — dieselbe Logik wie im RampUpChart des Planners ──
export interface RampMonth { monthIndex: number; label: string; coldCalls: number; discoveries: number; proposals: number; closes: number }

export function rampUp(params: SalesParameters, metrics: CalculatedMetrics): RampMonth[] {
  let start = new Date(params.rampUpStartDate)
  if (isNaN(start.getTime())) start = new Date()
  const totalMonths = 12
  const targetCloses = metrics.totalDealsNeeded
  const targetProposals = Math.ceil(targetCloses / (params.conversionDealToOrder / 100))
  const targetDiscoveries = Math.ceil(targetProposals / (params.conversionDiscoveryToProposal / 100))
  const targetSQLs = Math.ceil(targetDiscoveries / (params.conversionSQLToDeal / 100))
  const targetLeads = Math.ceil(targetSQLs / (params.conversionColdToSQL / 100))
  const dDisc = params.lagColdToDiscovery / 4
  const dProp = dDisc + params.lagDiscoveryToProposal / 4
  const dClose = dProp + params.lagProposalToClose / 4
  const cold = targetLeads / totalMonths
  const disc = targetDiscoveries / Math.max(1, totalMonths - dDisc)
  const prop = targetProposals / Math.max(1, totalMonths - dProp)
  const close = targetCloses / Math.max(1, totalMonths - dClose)
  const out: RampMonth[] = []
  for (let i = 0; i < totalMonths; i++) {
    const d = new Date(start.getFullYear(), start.getMonth() + i, 1)
    out.push({
      monthIndex: i + 1,
      label: d.toLocaleDateString('de-DE', { month: 'short', year: '2-digit' }),
      coldCalls: Math.round((i + 1) * cold),
      discoveries: Math.round(Math.max(0, i + 1 - dDisc) * disc),
      proposals: Math.round(Math.max(0, i + 1 - dProp) * prop),
      closes: Math.round(Math.max(0, i + 1 - dClose) * close),
    })
  }
  return out
}

// ── Team-OKRs — dieselbe Logik wie TeamOKR im Planner ──
export interface TeamOkrs {
  sdr: { calls: [number, number, number]; conversations: [number, number, number]; sqls: [number, number, number] }
  ae: { pipeline: [number, number, number]; deals: [number, number, number]; revenue: [number, number, number] }
}

export function teamOkrs(params: SalesParameters, metrics: CalculatedMetrics): TeamOkrs {
  const totalMonths = 12
  const targetCloses = metrics.totalDealsNeeded
  const targetProposals = Math.ceil(targetCloses / (params.conversionDealToOrder / 100))
  const targetDiscoveries = Math.ceil(targetProposals / (params.conversionDiscoveryToProposal / 100))
  const targetSQLs = Math.ceil(targetDiscoveries / (params.conversionSQLToDeal / 100))
  const targetLeads = Math.ceil(targetSQLs / (params.conversionColdToSQL / 100))
  const dDisc = params.lagColdToDiscovery / 4
  const dClose = dDisc + params.lagDiscoveryToProposal / 4 + params.lagProposalToClose / 4
  const effClose = Math.max(1, totalMonths - dClose)
  const coldRate = targetLeads / totalMonths
  const closeRate = targetCloses / effClose
  const avgMonthlySQLs = coldRate * (params.conversionColdToSQL / 100)
  const avgMonthlyCloses = (effClose * closeRate) / totalMonths
  const w = params.workingWeeksPerMonth
  const sqlsWeek = avgMonthlySQLs / w
  const convWeek = Math.ceil(sqlsWeek * 5)
  const convMonth = convWeek * w
  const callsMonth = Math.ceil(coldRate)
  const callsWeek = Math.ceil(callsMonth / w)
  const pipeQ = (params.yearlyTarget / 4) * 2
  const pipeM = pipeQ / 3
  const dealsM = avgMonthlyCloses
  const revM = dealsM * params.averageDealSize
  return {
    sdr: {
      calls: [callsWeek, callsMonth, callsMonth * 3],
      conversations: [convWeek, convMonth, convMonth * 3],
      sqls: [sqlsWeek, avgMonthlySQLs, avgMonthlySQLs * 3],
    },
    ae: {
      pipeline: [pipeM / w, pipeM, pipeQ],
      deals: [dealsM / w, dealsM, dealsM * 3],
      revenue: [revM / w, revM, revM * 3],
    },
  }
}

/** Gespeicherte Werte mit den Standardwerten auffuellen. */
export function withDefaults(p: Partial<SalesParameters> | null | undefined): SalesParameters {
  return { ...defaultParameters, ...(p ?? {}) } as SalesParameters
}
