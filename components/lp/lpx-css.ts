/**
 * Framework-Seiten im Stil der neuen Startseite: legt sich über die bestehenden LP-Bausteine
 * (Tailwind-Klassen) und gleicht Typografie, Abstände, Flächen und Karten an. Nur innerhalb von .lpx.
 */
export const LPX_CSS = `
.lpx section{padding-top:clamp(64px,8vw,112px)!important;padding-bottom:clamp(64px,8vw,112px)!important;padding-left:clamp(20px,6vw,96px)!important;padding-right:clamp(20px,6vw,96px)!important}
.lpx section.efh{padding-top:clamp(56px,7vw,96px)!important;padding-bottom:clamp(56px,7vw,96px)!important}
.lpx .max-w-3xl,.lpx .max-w-5xl,.lpx .max-w-6xl,.lpx .max-w-7xl{max-width:1200px!important}
.lpx section h2{font-size:clamp(34px,4.4vw,60px)!important;font-weight:600!important;letter-spacing:-.035em!important;line-height:1.05!important;text-wrap:balance;color:#0D0D0B}
.lpx section h3{font-weight:600!important;letter-spacing:-.015em}
.lpx .uppercase.tracking-widest{font-family:'DM Mono',ui-monospace,monospace!important;font-weight:400!important;letter-spacing:.06em!important;color:#7A746E!important;font-size:12px!important;background:none!important;padding:0!important;border:0!important}
.lpx section:not(.lpx-c) .text-center{text-align:left!important}
.lpx section:not(.lpx-c) .mx-auto.max-w-2xl,.lpx section:not(.lpx-c) .mx-auto.max-w-3xl > p{margin-left:0!important}
.lpx section:not(.lpx-c) h2 + p,.lpx section:not(.lpx-c) h2 ~ p.text-base{font-size:clamp(18px,1.5vw,21px)!important;line-height:1.5!important;color:#3A3633!important;max-width:720px}
.lpx .text-gray-600,.lpx .text-gray-700{color:#4A4642!important}
.lpx .text-sm.leading-relaxed{font-size:15px!important;line-height:1.65!important}
.lpx section[style*="250, 250, 248"],.lpx section[style*="#FAFAF8"]{background:linear-gradient(180deg,#F8F5F0 0%,#F3EEE6 100%)!important}
.lpx .rounded-2xl{border-radius:20px!important}
.lpx .rounded-2xl.border,.lpx .border-gray-100,.lpx .border-gray-200{border-color:#E8E2D9!important}
.lpx a.rounded-full,.lpx button.rounded-full[type=submit]{min-height:52px;display:inline-flex;align-items:center;justify-content:center;font-size:15px!important;font-weight:600!important;padding-left:26px;padding-right:26px}
.lpx details summary{font-weight:600}
.lpx section.lpx-coach{background:linear-gradient(170deg,#141311 0%,#0D0D0B 60%,#0A0A09 100%)!important;color:#fff}
.lpx .lpx-coach h3{color:#fff!important;font-size:clamp(26px,2.6vw,36px)!important}
.lpx .lpx-coach p,.lpx .lpx-coach .text-gray-600,.lpx .lpx-coach .text-gray-500{color:#B5B2B0!important}
.lpx .lpx-coach .uppercase.tracking-widest{color:#8FB0EC!important}
.lpx .lpx-coach a{color:#8FB0EC!important}
@media(max-width:640px){.lpx section h2{font-size:clamp(30px,8vw,40px)!important}}
`
