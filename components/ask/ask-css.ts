/** Styles der ASK-Funnels, Teaser und Reports. Gleiche Tokens wie das Stories-Designsystem. */
export const ASK_CSS = `
.ask{--ink:#0D0D0B;--blue:#1A5FD4;--blue-d:#154CAA;--tint:#EBF1FF;--panel:#F4F4F2;--line:#E5E7EB;--g7:#374151;--g6:#4B5563;--g5:#6B7280;--g4:#9CA3AF;
  --red:#EB0028;--amber:#E7A500;--green:#1F9D55;--sans:'DM Sans',ui-sans-serif,-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;
  font-family:var(--sans);color:var(--ink);-webkit-font-smoothing:antialiased;line-height:1.55}
.ask *{box-sizing:border-box}
.ask .wrap{max-width:1080px;margin:0 auto;padding:56px 40px 96px}
.ask .eb{display:block;font-size:12px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:var(--blue)}
.ask h1{font-size:52px;line-height:1.04;letter-spacing:-.035em;font-weight:700;margin:14px 0 0;text-wrap:balance}
.ask h2{font-size:32px;line-height:1.12;letter-spacing:-.025em;font-weight:700;margin:10px 0 0;text-wrap:balance}
.ask h3{font-size:20px;line-height:1.25;letter-spacing:-.015em;font-weight:700;margin:0}
.ask p{margin:0;color:var(--g6)}
.ask .lead{font-size:19px;line-height:1.55;margin-top:18px;max-width:620px}
.ask .card{border-radius:20px;padding:32px;background:var(--panel)}
.ask .card.line{background:#fff;border:1px solid var(--line)}
.ask .card.blue{background:var(--blue);color:#fff}.ask .card.blue p{color:rgba(255,255,255,.85)}.ask .card.blue .eb{color:rgba(255,255,255,.75)}
.ask .card.ink{background:var(--ink);color:#fff}.ask .card.ink p{color:rgba(255,255,255,.8)}.ask .card.ink .eb{color:#8FB4FF}
.ask .btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;border-radius:999px;font:700 15px/1 var(--sans);padding:16px 26px;border:0;cursor:pointer;text-decoration:none;white-space:nowrap}
.ask .btn.blue{background:var(--blue);color:#fff}.ask .btn.blue:hover{background:var(--blue-d)}
.ask .btn.white{background:#fff;color:var(--blue)}.ask .btn.ghost{background:transparent;color:var(--blue);box-shadow:inset 0 0 0 1.5px var(--blue)}
.ask .btn[disabled]{opacity:.55;cursor:not-allowed}
.ask .link{background:none;border:0;padding:6px 0;font:500 14px var(--sans);color:var(--g6);cursor:pointer}
.ask .grid{display:grid;grid-template-columns:7fr 5fr;gap:24px;align-items:start}
.ask .promise{list-style:none;margin:24px 0 0;padding:0;display:grid;gap:10px}
.ask .promise li{display:flex;gap:12px;align-items:flex-start;font-size:16px;color:var(--g7)}
.ask .promise li:before{content:"";flex:none;width:20px;height:20px;border-radius:50%;margin-top:2px;background:var(--tint) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'%3E%3Cpath d='M5.5 10.5l3 3 6-7' fill='none' stroke='%231A5FD4' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E") center/20px no-repeat}
.ask .meta{margin-top:18px;font-size:14px;color:var(--g5)}
/* Fragen */
.ask .qcard{background:#fff;border:1px solid var(--line);border-radius:24px;padding:36px;box-shadow:0 30px 60px -40px rgba(14,23,51,.35)}
.ask .qhead{display:flex;justify-content:space-between;align-items:center;gap:12px;font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--g5)}
.ask .qhead .st{color:var(--blue)}
.ask .bars{display:flex;gap:4px;margin-top:12px}.ask .bars span{flex:1;height:5px;border-radius:3px;background:var(--tint)}.ask .bars span.on{background:var(--blue)}
.ask .qt{font-size:28px;font-weight:700;letter-spacing:-.02em;line-height:1.22;margin-top:26px;text-wrap:balance}
.ask .qh{font-size:15px;color:var(--g6);margin-top:8px}
.ask .opts{display:grid;gap:10px;margin-top:24px}
.ask .opt{display:flex;align-items:center;gap:14px;width:100%;text-align:left;background:#fff;border:1.5px solid var(--line);border-radius:14px;padding:15px 16px;font:500 16px/1.35 var(--sans);color:var(--ink);cursor:pointer;transition:border-color .12s,background .12s}
.ask .opt:hover{border-color:var(--blue)}
.ask .opt .k{flex:none;width:30px;height:30px;border-radius:8px;border:1.5px solid var(--line);display:grid;place-items:center;font-size:13px;font-weight:700;color:var(--g6)}
.ask .opt.sel{background:var(--tint);border-color:var(--blue)}.ask .opt.sel .k{background:var(--blue);border-color:var(--blue);color:#fff}
.ask .qfoot{display:flex;justify-content:space-between;align-items:center;margin-top:20px;min-height:32px}
.ask .insight{border-left:3px solid var(--blue);padding:4px 0 4px 18px;font-size:18px;line-height:1.55;color:var(--ink);margin-top:22px}
.ask .note{background:var(--tint);border-radius:12px;padding:12px 16px;font-size:14px;color:var(--blue-d);margin-bottom:18px}
/* Reise-Visual */
.ask .journey{display:flex;flex-direction:column;gap:6px}
.ask .seg{display:flex;align-items:center;gap:12px;margin:0 auto;width:100%}
.ask .seg .bar{height:30px;border-radius:8px;background:#E4E3DF;display:flex;align-items:center;justify-content:center;padding:0 12px;font-size:13px;font-weight:600;color:var(--g7);white-space:nowrap;overflow:hidden;transition:background .3s,color .3s}
.ask .seg .bar.red{background:var(--red);color:#fff}.ask .seg .bar.yellow{background:#FFE7A3;color:#5C4300}.ask .seg .bar.green{background:#D5F2E1;color:#0F5A31}
.ask .seg .bar.on{background:var(--blue);color:#fff}
.ask .seg .bar.first{box-shadow:0 0 0 3px #fff,0 0 0 5px var(--red)}
.ask .legend{display:flex;gap:16px;flex-wrap:wrap;margin-top:14px;font-size:13px;color:var(--g6)}
.ask .legend i{display:inline-block;width:10px;height:10px;border-radius:3px;margin-right:6px;vertical-align:0}
/* Kurzergebnis + Formular */
.ask .first{font-size:40px;font-weight:700;letter-spacing:-.03em;line-height:1.05;margin-top:8px}
.ask .locked{list-style:none;padding:0;margin:16px 0 0;display:grid;gap:10px}
.ask .locked li{display:flex;gap:10px;align-items:flex-start;font-size:15px;color:rgba(255,255,255,.9)}
.ask .locked li:before{content:"";flex:none;width:16px;height:16px;margin-top:3px;background:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Crect x='3' y='7' width='10' height='7' rx='1.5' fill='%23fff'/%3E%3Cpath d='M5.5 7V5a2.5 2.5 0 015 0v2' fill='none' stroke='%23fff' stroke-width='1.6'/%3E%3C/svg%3E") center/16px no-repeat}
.ask form.contact{display:grid;gap:12px;margin-top:22px}
.ask .two{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.ask label.f span{display:block;font-size:12px;font-weight:600;color:rgba(255,255,255,.85);margin-bottom:6px}
.ask label.f span small{font-weight:400;color:rgba(255,255,255,.65)}
.ask input.in{width:100%;border:1px solid rgba(255,255,255,.35);background:rgba(255,255,255,.12);border-radius:12px;padding:14px 16px;font:400 15px var(--sans);color:#fff;outline:none}
.ask input.in::placeholder{color:rgba(255,255,255,.6)}.ask input.in:focus{border-color:#fff;background:rgba(255,255,255,.18)}
.ask .terms{display:flex;gap:10px;align-items:flex-start;font-size:12px;line-height:1.45;color:rgba(255,255,255,.8)}
.ask .terms input{margin-top:2px;flex:none;width:16px;height:16px}.ask .terms a{color:#fff;text-decoration:underline}
.ask .err{font-size:14px;color:#FFD1D8;min-height:1.2em}
/* Report */
.ask .rhead{display:flex;justify-content:space-between;align-items:flex-end;gap:24px;flex-wrap:wrap}
.ask .rows{display:grid;gap:12px;margin-top:22px}
.ask .row{display:grid;grid-template-columns:200px 1fr 56px;gap:16px;align-items:center}
.ask .row .nm{font-weight:600;font-size:15px}
.ask .track{position:relative;height:14px;border-radius:7px;background:var(--panel)}
.ask .track .fill{position:absolute;left:0;top:0;bottom:0;border-radius:7px}
.ask .track .fill.red{background:var(--red)}.ask .track .fill.yellow{background:var(--amber)}.ask .track .fill.green{background:var(--green)}
.ask .track .tick{position:absolute;top:-5px;bottom:-5px;width:2px;background:var(--ink);border-radius:1px}
.ask .row .v{font-weight:700;font-variant-numeric:tabular-nums;text-align:right}
.ask .steps{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:22px}
.ask .step{border-radius:20px;padding:26px;background:#fff;border:1px solid var(--line);display:flex;flex-direction:column;gap:10px}
.ask .step .no{font-size:12px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--red)}
.ask .step.y .no{color:#9A6B00}
.ask .step .fx{margin-top:auto;padding-top:12px;border-top:1px solid var(--line);font-size:14px;color:var(--ink)}
.ask .step .fx b{display:block;font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:var(--g5);margin-bottom:4px}
.ask .chips{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}
.ask .chips span{background:#D5F2E1;color:#0F5A31;border-radius:999px;padding:7px 14px;font-size:14px;font-weight:600}
.ask .alt{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:16px}
.ask .sec{margin-top:48px}
.ask .small{font-size:13px;color:var(--g5)}
/* Teaser */
.sb-ask{max-width:1200px;margin:0 auto;padding:72px 40px 0}
@media(max-width:720px){.sb-ask{padding:48px 20px 0}}
.ask.teaser .tz{display:grid;grid-template-columns:5fr 7fr;gap:28px;align-items:center;background:var(--panel);border-radius:24px;padding:36px}
.ask.teaser .qt{font-size:22px;margin-top:18px}
.ask.teaser .opts{margin-top:16px}
.ask.teaser .opt{padding:12px 14px;font-size:15px}
@media(max-width:900px){.ask .grid,.ask.teaser .tz{grid-template-columns:1fr}.ask .steps{grid-template-columns:1fr}.ask .alt{grid-template-columns:1fr}}
@media(max-width:640px){.ask .wrap{padding:32px 20px 72px}.ask h1{font-size:36px}.ask h2{font-size:26px}.ask .qcard{padding:22px;border-radius:18px}.ask .qt{font-size:22px}
  .ask .two{grid-template-columns:1fr}.ask .card{padding:22px}.ask .row{grid-template-columns:1fr 48px}.ask .row .nm{grid-column:span 2}.ask .first{font-size:30px}.ask.teaser .tz{padding:22px}}
@media print{
  header,footer,nav,.no-print,[data-cookie-banner]{display:none!important}
  .ask .wrap{padding:0}.ask .card,.ask .step{break-inside:avoid}.ask .card.blue,.ask .card.ink{-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .ask .track .fill,.ask .seg .bar{-webkit-print-color-adjust:exact;print-color-adjust:exact}
}
`

.ask .card.line .seg .bar:not(.red):not(.yellow):not(.green):not(.on){background:var(--panel)}
