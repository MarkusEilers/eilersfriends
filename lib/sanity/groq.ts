// groq tagged template literal - just returns the string as-is
export default function groq(strings: TemplateStringsArray, ...values: unknown[]): string {
  return strings.reduce((result, str, i) => result + str + (values[i] ?? ''), '');
}
