/** Standard-Teams für neue Kunden — wie bei OpenTAS bewährt. */
export const DEFAULT_TEAMS: { name: string; program_role_key: string | null }[] = [
  { name: 'Leadership', program_role_key: null },
  { name: 'Sales & Customer Success', program_role_key: 'sales' },
  { name: 'Marketing', program_role_key: 'marketing' },
  { name: 'Product & GTM', program_role_key: 'programm' },
]

export const teamKey = (name: string) =>
  name.toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'team'
