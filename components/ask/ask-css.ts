/**
 * Styles der ASK-Funnels, Teaser und Reports — Stories-Designsystem
 * (DM Sans, Blau #1A5FD4, Navy #0E1733, Karopapier-Raster, Schwinge).
 * Bühne: dunkles Navy mit Raster und Lichtkegel, Ergebnis leuchtet darauf.
 */
export const ASK_CSS = `
.ask{--ink:#0D0D0B;--blue:#1A5FD4;--blue-d:#154CAA;--go:#2563FF;--tint:#EBF1FF;--panel:#F4F4F2;--cream:#FAFAF8;--line:#E5E7EB;
  --g7:#374151;--g6:#4B5563;--g5:#6B7280;--g4:#9CA3AF;--navy:#0E1733;--navy-in:#14203F;--navy-line:rgba(170,192,240,.18);--eb-l:#6FA3FF;
  --red:#EB0028;--red-s:#FF3B5C;--amber:#F5B301;--green:#22B573;
  --sans:'DM Sans',ui-sans-serif,-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;
  font-family:var(--sans);color:var(--ink);-webkit-font-smoothing:antialiased;line-height:1.55}
.ask *{box-sizing:border-box}
.ask .wrap{max-width:1160px;margin:0 auto;padding:56px 40px 96px}
.ask .in{max-width:1160px;margin:0 auto;padding:0 40px}
.ask .eb{display:inline-flex;align-items:center;gap:10px;font-size:12px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:var(--blue)}
.ask h1{font-size:52px;line-height:1.04;letter-spacing:-.035em;font-weight:700;margin:14px 0 0;text-wrap:balance}
.ask h2{font-size:34px;line-height:1.1;letter-spacing:-.028em;font-weight:700;margin:10px 0 0;text-wrap:balance}
.ask h3{font-size:21px;line-height:1.25;letter-spacing:-.015em;font-weight:700;margin:0}
.ask p{margin:0;color:var(--g6)}
.ask .lead{font-size:19px;line-height:1.55;margin-top:18px;max-width:620px}
.ask .num{font-variant-numeric:tabular-nums}
.ask .card{border-radius:20px;padding:32px;background:var(--panel)}
.ask .card.line{background:#fff;border:1px solid var(--line)}
.ask .card.blue{background:var(--blue);color:#fff}.ask .card.blue p{color:rgba(255,255,255,.85)}.ask .card.blue .eb{color:rgba(255,255,255,.75)}
.ask .btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;border-radius:999px;font:700 15px/1 var(--sans);padding:17px 26px;border:0;cursor:pointer;text-decoration:none;white-space:nowrap;transition:transform .15s,background .15s,box-shadow .15s}
.ask .btn:hover{transform:translateY(-1px)}
.ask .btn.blue{background:var(--blue);color:#fff;box-shadow:0 14px 30px -14px rgba(26,95,212,.9)}.ask .btn.blue:hover{background:var(--blue-d)}
.ask .btn.go{background:var(--go);color:#fff;box-shadow:0 16px 36px -14px rgba(37,99,255,.9)}
.ask .btn.white{background:#fff;color:var(--blue)}.ask .btn.ghost{background:transparent;color:var(--blue);box-shadow:inset 0 0 0 1.5px var(--blue)}
.ask .btn.glass{background:rgba(255,255,255,.08);color:#fff;box-shadow:inset 0 0 0 1px rgba(255,255,255,.25)}
.ask .btn.full{width:100%}
.ask .btn[disabled]{opacity:.55;cursor:not-allowed;transform:none}
.ask .link{background:none;border:0;padding:6px 0;font:500 14px var(--sans);color:var(--g6);cursor:pointer;text-decoration:none}
.ask .grid{display:grid;grid-template-columns:7fr 5fr;gap:24px;align-items:start}
.ask .promise{list-style:none;margin:24px 0 0;padding:0;display:grid;gap:10px}
.ask .promise li,.ask .ticks li{display:flex;gap:12px;align-items:flex-start;font-size:16px;color:var(--g7)}
.ask .promise li:before,.ask .ticks li:before{content:"";flex:none;width:20px;height:20px;border-radius:50%;margin-top:2px;background:var(--tint) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'%3E%3Cpath d='M5.5 10.5l3 3 6-7' fill='none' stroke='%231A5FD4' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E") center/20px no-repeat}
.ask .ticks{list-style:none;margin:18px 0 0;padding:0;display:grid;gap:10px}
.ask .meta{margin-top:18px;font-size:14px;color:var(--g5)}
.ask .small{font-size:13px;color:var(--g5)}

/* ── Fragen ─────────────────────────────────────────── */
.ask .qcard{background:#fff;border:1px solid var(--line);border-radius:24px;padding:36px;box-shadow:0 30px 60px -40px rgba(14,23,51,.35)}
.ask .qhead{display:flex;justify-content:space-between;align-items:center;gap:12px;font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--g5)}
.ask .qhead .st{color:var(--blue)}
.ask .bars{display:flex;gap:4px;margin-top:12px}.ask .bars span{flex:1;height:5px;border-radius:3px;background:var(--tint);transition:background .3s}.ask .bars span.on{background:var(--blue)}
.ask .qt{font-size:28px;font-weight:700;letter-spacing:-.02em;line-height:1.22;margin-top:26px;text-wrap:balance;animation:askIn .35s ease both}
.ask .qh{font-size:15px;color:var(--g6);margin-top:8px}
.ask .opts{display:grid;gap:10px;margin-top:24px}
.ask .opt{display:flex;align-items:center;gap:14px;width:100%;text-align:left;background:#fff;border:1.5px solid var(--line);border-radius:14px;padding:15px 16px;font:500 16px/1.35 var(--sans);color:var(--ink);cursor:pointer;transition:border-color .12s,background .12s,transform .12s}
.ask .opt:hover{border-color:var(--blue);transform:translateX(2px)}
.ask .opt .k{flex:none;width:30px;height:30px;border-radius:8px;border:1.5px solid var(--line);display:grid;place-items:center;font-size:13px;font-weight:700;color:var(--g6)}
.ask .opt.sel{background:var(--tint);border-color:var(--blue)}.ask .opt.sel .k{background:var(--blue);border-color:var(--blue);color:#fff}
.ask .qfoot{display:flex;justify-content:space-between;align-items:center;margin-top:20px;min-height:32px}
.ask .insight{border-left:3px solid var(--blue);padding:4px 0 4px 18px;font-size:19px;line-height:1.55;color:var(--ink);margin-top:22px;animation:askIn .4s ease both}
.ask .note{background:var(--tint);border-radius:12px;padding:12px 16px;font-size:14px;color:var(--blue-d);margin-bottom:18px}

/* ── Reise (Trichter) ───────────────────────────────── */
.ask .journey{display:flex;flex-direction:column;gap:6px}
.ask .seg{margin:0 auto;width:100%}
.ask .seg .bar{position:relative;height:32px;border-radius:9px;background:#E4E3DF;display:flex;align-items:center;justify-content:center;gap:8px;padding:0 12px;font-size:13px;font-weight:600;color:var(--g7);white-space:nowrap;overflow:hidden;transition:background .35s,color .35s,box-shadow .35s}
.ask .seg .bar .ix{opacity:.55;font-variant-numeric:tabular-nums}
.ask .seg .bar.red{background:var(--red);color:#fff}.ask .seg .bar.yellow{background:#FFE7A3;color:#5C4300}.ask .seg .bar.green{background:#D5F2E1;color:#0F5A31}
.ask .seg .bar.on{background:var(--blue);color:#fff}
.ask .seg .bar.cur{box-shadow:0 0 0 2px #fff,0 0 0 4px var(--blue)}
.ask .card.line .seg .bar:not(.red):not(.yellow):not(.green):not(.on){background:var(--panel)}
/* dunkle Fassung auf der Bühne */
.ask .journey.dark .seg .bar{background:rgba(255,255,255,.06);color:rgba(255,255,255,.55);box-shadow:inset 0 0 0 1px rgba(255,255,255,.06)}
.ask .journey.dark .seg .bar.green{background:linear-gradient(90deg,rgba(34,181,115,.22),rgba(34,181,115,.38),rgba(34,181,115,.22));color:#BFF3D7;box-shadow:inset 0 0 0 1px rgba(34,181,115,.45)}
.ask .journey.dark .seg .bar.yellow{background:linear-gradient(90deg,rgba(245,179,1,.22),rgba(245,179,1,.42),rgba(245,179,1,.22));color:#FFE6A1;box-shadow:inset 0 0 0 1px rgba(245,179,1,.5)}
.ask .journey.dark .seg .bar.red{background:linear-gradient(90deg,#C80022,#FF2D52,#C80022);color:#fff;box-shadow:0 0 0 1px rgba(255,59,92,.7),0 14px 34px -10px rgba(235,0,40,.85)}
.ask .journey.dark .seg .bar.first{animation:askPulse 2.4s ease-in-out 1.4s infinite}
.ask .journey.anim .seg{animation:askGrow .7s cubic-bezier(.2,.8,.2,1) both;animation-delay:calc(var(--i) * 70ms + .15s);transform-origin:center}
.ask .journey .seg .tag{position:absolute;right:10px;top:50%;transform:translateY(-50%);font-size:10px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;background:#fff;color:var(--red);border-radius:999px;padding:3px 8px}
.ask .legend{display:flex;gap:16px;flex-wrap:wrap;margin-top:16px;font-size:13px;color:var(--g6)}
.ask .legend i{display:inline-block;width:10px;height:10px;border-radius:3px;margin-right:7px}
.ask .stage .legend{color:rgba(255,255,255,.65)}

/* ── Bühne (dunkel) ─────────────────────────────────── */
.ask .stage{position:relative;overflow:hidden;background:var(--navy);color:#fff;isolation:isolate}
.ask .stage:before{content:"";position:absolute;inset:0;z-index:-2;
  background-image:linear-gradient(rgba(111,163,255,.075) 1px,transparent 1px),linear-gradient(90deg,rgba(111,163,255,.075) 1px,transparent 1px);background-size:32px 32px;
  -webkit-mask-image:radial-gradient(120% 90% at 70% 30%,#000 30%,transparent 80%);mask-image:radial-gradient(120% 90% at 70% 30%,#000 30%,transparent 80%)}
.ask .stage:after{content:"";position:absolute;inset:-20%;z-index:-3;
  background:radial-gradient(40% 45% at 78% 28%,rgba(37,99,255,.45),transparent 70%),radial-gradient(30% 35% at 15% 85%,rgba(235,0,40,.18),transparent 70%),radial-gradient(50% 60% at 50% 120%,rgba(26,95,212,.35),transparent 70%)}
.ask .stage .wing{position:absolute;right:-60px;bottom:-90px;width:420px;opacity:.05;z-index:-1;pointer-events:none}
.ask .stage .eb{color:var(--eb-l)}
.ask .stage p{color:rgba(255,255,255,.78)}
.ask .stage .in{padding-top:72px;padding-bottom:88px}
.ask .live{width:8px;height:8px;border-radius:50%;background:var(--red-s);box-shadow:0 0 0 0 rgba(255,59,92,.7);animation:askLive 1.8s infinite}
.ask .hero2{display:grid;grid-template-columns:6fr 5fr;gap:56px;align-items:center}
.ask .kick{font-size:15px;font-weight:600;color:rgba(255,255,255,.7);margin-top:22px}
.ask .big{font-size:clamp(44px,6.4vw,84px);font-weight:700;letter-spacing:-.045em;line-height:.98;margin-top:6px;text-wrap:balance}
.ask .big .mark{background:linear-gradient(transparent 78%,rgba(255,59,92,.85) 78%,rgba(255,59,92,.85) 92%,transparent 92%) no-repeat;background-size:0 100%;animation:askMark .9s .9s cubic-bezier(.2,.8,.2,1) forwards;padding:0 .04em}
.ask .stage .lead{color:rgba(255,255,255,.82);font-size:20px;max-width:560px}
.ask .trio{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:34px;max-width:560px}
.ask .trio div{border-radius:16px;padding:16px 16px 14px;background:rgba(255,255,255,.05);box-shadow:inset 0 0 0 1px rgba(255,255,255,.1);backdrop-filter:blur(6px)}
.ask .trio b{display:block;font-size:40px;line-height:1;font-weight:700;letter-spacing:-.04em;font-variant-numeric:tabular-nums}
.ask .trio span{display:block;margin-top:8px;font-size:12px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:rgba(255,255,255,.6)}
.ask .trio .r b{color:var(--red-s)}.ask .trio .y b{color:var(--amber)}.ask .trio .g b{color:var(--green)}
.ask .glassp{border-radius:24px;padding:28px;background:linear-gradient(180deg,rgba(255,255,255,.07),rgba(255,255,255,.03));box-shadow:inset 0 0 0 1px rgba(255,255,255,.1),0 40px 80px -40px rgba(0,0,0,.6);backdrop-filter:blur(10px)}
.ask .rise{animation:askIn .7s cubic-bezier(.2,.8,.2,1) both}
.ask .d1{animation-delay:.1s}.ask .d2{animation-delay:.25s}.ask .d3{animation-delay:.4s}.ask .d4{animation-delay:.55s}.ask .d5{animation-delay:.7s}

/* ── Report-Cover (Vorschau) + Formular ─────────────── */
.ask .unlock{background:var(--cream);padding:96px 0 104px}
.ask .unlock .cols{display:grid;grid-template-columns:6fr 5fr;gap:56px;align-items:center}
.ask .paper-stack{position:relative;max-width:520px;margin:0 auto;padding:10px 0 30px}
.ask .paper{position:relative;background:#fff;border-radius:18px;padding:28px 28px 26px;box-shadow:0 2px 0 rgba(14,23,51,.04),0 50px 90px -40px rgba(14,23,51,.45),0 0 0 1px rgba(14,23,51,.06);transform:rotate(-2.5deg);transition:transform .5s cubic-bezier(.2,.8,.2,1)}
.ask .paper-stack:hover .paper{transform:rotate(-1deg) translateY(-4px)}
.ask .paper.back{position:absolute;inset:26px -14px 4px 22px;transform:rotate(3deg);background:#fff;opacity:.75;padding:0}
.ask .paper .ph{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;padding-bottom:18px;border-bottom:1px solid var(--line)}
.ask .paper .ph .ttl{font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--blue)}
.ask .paper .ph .for{font-size:26px;font-weight:700;letter-spacing:-.03em;line-height:1.1;margin-top:6px;min-height:29px;word-break:break-word}
.ask .paper .ph .for.empty{color:var(--g4)}
.ask .logo-slot{flex:none;width:96px;height:56px;border-radius:12px;border:1.5px dashed #D3D6DD;display:grid;place-items:center;font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--g4);text-align:center;line-height:1.2;overflow:hidden;background:#fff}
.ask .logo-slot.has{border:1px solid var(--line);padding:8px}
.ask .logo-slot img{max-width:100%;max-height:100%;object-fit:contain;animation:askIn .5s ease both}
.ask .paper .mini{display:grid;gap:8px;margin-top:18px}
.ask .paper .mini div{display:grid;grid-template-columns:86px 1fr 26px;gap:10px;align-items:center;font-size:11px;font-weight:600;color:var(--g6)}
.ask .paper .mini i{display:block;height:8px;border-radius:4px;background:var(--panel);position:relative;overflow:hidden}
.ask .paper .mini i:after{content:"";position:absolute;inset:0;width:var(--w);border-radius:4px;background:var(--c)}
.ask .paper .mini em{font-style:normal;height:8px;border-radius:4px;background:#E9EAEE;filter:blur(2px)}
.ask .paper .blurred{margin-top:18px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;filter:blur(3.5px);opacity:.75}
.ask .paper .blurred span{height:64px;border-radius:10px;background:var(--panel)}
.ask .paper .blurred span:first-child{background:#FFE3E8}
.ask .lockchip{position:absolute;left:50%;bottom:18px;transform:translateX(-50%);display:inline-flex;align-items:center;gap:8px;white-space:nowrap;background:var(--navy);color:#fff;font-size:12px;font-weight:700;border-radius:999px;padding:9px 14px;box-shadow:0 12px 30px -12px rgba(14,23,51,.8)}
.ask .lockchip.ok{background:var(--green)}
.ask .form-card{background:#fff;border-radius:24px;padding:34px;box-shadow:0 0 0 1px rgba(14,23,51,.06),0 40px 80px -50px rgba(14,23,51,.5)}
.ask form.contact{display:grid;gap:12px;margin-top:22px}
.ask .two{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.ask label.f{display:block}
.ask label.f span{display:block;font-size:12px;font-weight:600;color:var(--g7);margin-bottom:6px}
.ask label.f span small{font-weight:400;color:var(--g5)}
.ask input.inp{width:100%;border:1.5px solid var(--line);background:#fff;border-radius:12px;padding:14px 16px;font:400 15px var(--sans);color:var(--ink);outline:none;transition:border-color .15s,box-shadow .15s}
.ask input.inp:focus{border-color:var(--blue);box-shadow:0 0 0 4px rgba(26,95,212,.12)}
.ask .terms{display:flex;gap:10px;align-items:flex-start;font-size:12px;line-height:1.45;color:var(--g6)}
.ask .terms input{margin-top:2px;flex:none;width:16px;height:16px;accent-color:var(--blue)}.ask .terms a{color:var(--ink);text-decoration:underline}
.ask .err{font-size:14px;color:var(--red);min-height:1.2em}
.ask .done-ic{width:64px;height:64px;border-radius:50%;background:#E3F7EC;display:grid;place-items:center}
.ask .done-ic path{stroke-dasharray:40;stroke-dashoffset:40;animation:askDraw .6s .2s ease forwards}

/* ── Report ─────────────────────────────────────────── */
.ask .rtop{display:flex;justify-content:space-between;align-items:center;gap:20px;flex-wrap:wrap}
.ask .brandrow{display:flex;align-items:center;gap:14px}
.ask .brandrow .lg{height:60px;min-width:60px;max-width:180px;border-radius:14px;background:#fff;display:grid;place-items:center;padding:10px 14px;box-shadow:0 20px 40px -20px rgba(0,0,0,.6)}
.ask .brandrow .lg img{max-height:40px;max-width:150px;object-fit:contain}
.ask .brandrow .x{font-size:18px;color:rgba(255,255,255,.4)}
.ask .brandrow .ef{display:flex;align-items:center;gap:10px;font-weight:700;letter-spacing:.02em;font-size:15px}
.ask .brandrow .ef img{width:26px;height:26px}
.ask .rhero{display:grid;grid-template-columns:7fr 4fr;gap:48px;align-items:end;margin-top:56px}
.ask .rhero h1{font-size:clamp(40px,5.6vw,72px);letter-spacing:-.045em;line-height:1;margin-top:14px;color:#fff}
.ask .rhero .accent{display:block;width:72px;height:6px;border-radius:3px;margin-top:22px;background:var(--brand,var(--go))}
.ask .gauge{position:relative;width:220px;height:220px;margin-left:auto}
.ask .gauge svg{width:100%;height:100%;transform:rotate(-90deg)}
.ask .gauge .arc{stroke-dasharray:var(--len) 999;stroke-dashoffset:var(--len);animation:askArc 1.4s .3s cubic-bezier(.2,.8,.2,1) forwards}
.ask .gauge .c{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}
.ask .gauge .c b{font-size:64px;line-height:1;font-weight:700;letter-spacing:-.05em;font-variant-numeric:tabular-nums}
.ask .gauge .c span{font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:rgba(255,255,255,.6);margin-top:6px}
.ask .pill{display:inline-flex;align-items:center;gap:8px;border-radius:999px;padding:8px 14px;font-size:13px;font-weight:700}
.ask .pill.red{background:rgba(255,59,92,.15);color:#FF8FA3;box-shadow:inset 0 0 0 1px rgba(255,59,92,.45)}
.ask .pill.yellow{background:rgba(245,179,1,.15);color:#FFD66B;box-shadow:inset 0 0 0 1px rgba(245,179,1,.45)}
.ask .pill.green{background:rgba(34,181,115,.15);color:#7FE3B2;box-shadow:inset 0 0 0 1px rgba(34,181,115,.45)}
.ask .rbody{background:var(--cream)}
.ask .sec{padding-top:88px}
.ask .shead{display:flex;justify-content:space-between;align-items:flex-end;gap:24px;margin-bottom:28px}
.ask .shead p{max-width:420px}
.ask .rows{display:grid;gap:4px}
.ask .row{display:grid;grid-template-columns:34px 200px 1fr 64px 92px;gap:16px;align-items:center;padding:12px 6px;border-bottom:1px solid #F0F0EE;animation:askIn .6s cubic-bezier(.2,.8,.2,1) both;animation-delay:calc(var(--i) * 60ms)}
.ask .row:last-child{border-bottom:0}
.ask .row .ix{width:28px;height:28px;border-radius:8px;background:var(--panel);display:grid;place-items:center;font-size:12px;font-weight:700;color:var(--g6)}
.ask .row.red .ix{background:var(--red);color:#fff}
.ask .row .nm{font-weight:600;font-size:15px}
.ask .track{position:relative;height:12px;border-radius:6px;background:var(--panel)}
.ask .track .fill{position:absolute;left:0;top:0;bottom:0;border-radius:6px;transform-origin:left;animation:askFill 1s cubic-bezier(.2,.8,.2,1) both;animation-delay:calc(var(--i) * 60ms + .2s)}
.ask .track .fill.red{background:linear-gradient(90deg,#C80022,#FF3B5C)}.ask .track .fill.yellow{background:linear-gradient(90deg,#E09E00,#FFC83D)}.ask .track .fill.green{background:linear-gradient(90deg,#16955C,#2BD083)}
.ask .track .tick{position:absolute;top:-6px;bottom:-6px;width:2px;background:var(--ink);border-radius:1px}
.ask .track .tick:after{content:attr(data-l);position:absolute;top:-18px;left:50%;transform:translateX(-50%);font-size:10px;font-weight:700;color:var(--g5);white-space:nowrap}
.ask .row .v{font-size:22px;font-weight:700;letter-spacing:-.02em;text-align:right;font-variant-numeric:tabular-nums}
.ask .st{justify-self:end;font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;border-radius:999px;padding:5px 10px}
.ask .st.red{background:#FFE3E8;color:#B0001F}.ask .st.yellow{background:#FFF1C7;color:#7A5600}.ask .st.green{background:#DDF5E8;color:#0F6B3B}
.ask .navycard{background:var(--navy);border-radius:24px;padding:28px;position:relative;overflow:hidden}
.ask .navycard:before{content:"";position:absolute;inset:0;background-image:linear-gradient(rgba(111,163,255,.07) 1px,transparent 1px),linear-gradient(90deg,rgba(111,163,255,.07) 1px,transparent 1px);background-size:28px 28px;pointer-events:none}
.ask .navycard>*{position:relative}
.ask .navycard .eb{color:var(--eb-l)}
.ask .order{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;counter-reset:o}
.ask .ocard{position:relative;background:#fff;border-radius:24px;padding:30px 28px 26px;box-shadow:0 0 0 1px rgba(14,23,51,.06),0 30px 60px -45px rgba(14,23,51,.5);display:flex;flex-direction:column;gap:12px;animation:askIn .7s cubic-bezier(.2,.8,.2,1) both;animation-delay:calc(var(--i) * 120ms)}
.ask .ocard .n{font-size:96px;line-height:.8;font-weight:700;letter-spacing:-.06em;color:transparent;-webkit-text-stroke:2px var(--red);margin-bottom:8px}
.ask .ocard.y .n{-webkit-text-stroke-color:var(--amber)}
.ask .ocard .when{font-size:12px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--red)}
.ask .ocard.y .when{color:#9A6B00}
.ask .ocard p{color:var(--g7)}
.ask .ocard .fx{margin-top:auto;background:var(--tint);border-radius:14px;padding:14px 16px;font-size:14px;font-weight:600;color:var(--blue-d)}
.ask .ocard .fx b{display:block;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--blue);margin-bottom:4px}
.ask .ocard:not(:last-child):after{content:"";position:absolute;right:-17px;top:62px;width:14px;height:14px;border-top:2px solid var(--g4);border-right:2px solid var(--g4);transform:rotate(45deg)}
.ask .strong{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:12px}
.ask .strong div{background:#fff;border-radius:16px;padding:16px 18px;box-shadow:0 0 0 1px rgba(14,23,51,.06);display:flex;gap:12px;align-items:flex-start}
.ask .strong div:before{content:"";flex:none;width:22px;height:22px;border-radius:50%;background:#DDF5E8 url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'%3E%3Cpath d='M5.5 10.5l3 3 6-7' fill='none' stroke='%2316955C' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E") center/22px no-repeat}
.ask .strong b{display:block;font-size:15px}.ask .strong span{display:block;font-size:14px;color:var(--g6);margin-top:2px}
.ask .rec{display:grid;grid-template-columns:auto 1fr;gap:32px;align-items:center;background:var(--blue);color:#fff;border-radius:28px;padding:40px;position:relative;overflow:hidden}
.ask .rec:after{content:"";position:absolute;right:-80px;top:-120px;width:360px;height:360px;border-radius:50%;background:radial-gradient(closest-side,rgba(255,255,255,.18),transparent)}
.ask .rec .ph{width:132px;height:132px;border-radius:50%;object-fit:cover;object-position:top;box-shadow:0 0 0 6px rgba(255,255,255,.18)}
.ask .rec .eb{color:rgba(255,255,255,.75)}
.ask .rec h2{color:#fff}.ask .rec p{color:rgba(255,255,255,.88);max-width:640px;margin-top:12px}
.ask .alt{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:16px}

/* ── Teaser ─────────────────────────────────────────── */
.sb-ask{max-width:1200px;margin:0 auto;padding:72px 40px 0}
.ask.teaser .tz{display:grid;grid-template-columns:5fr 7fr;gap:28px;align-items:center;background:var(--panel);border-radius:24px;padding:36px}
.ask.teaser .qt{font-size:22px;margin-top:18px}
.ask.teaser .opts{margin-top:16px}
.ask.teaser .opt{padding:12px 14px;font-size:15px}

@keyframes askIn{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
@keyframes askGrow{from{opacity:0;transform:scaleX(.2)}to{opacity:1;transform:none}}
@keyframes askFill{from{transform:scaleX(0)}to{transform:none}}
@keyframes askMark{to{background-size:100% 100%}}
@keyframes askArc{to{stroke-dashoffset:0}}
@keyframes askDraw{to{stroke-dashoffset:0}}
@keyframes askLive{70%{box-shadow:0 0 0 9px rgba(255,59,92,0)}100%{box-shadow:0 0 0 0 rgba(255,59,92,0)}}
@keyframes askPulse{0%,100%{box-shadow:0 0 0 1px rgba(255,59,92,.7),0 14px 34px -10px rgba(235,0,40,.85)}50%{box-shadow:0 0 0 1px rgba(255,59,92,.9),0 0 0 7px rgba(255,59,92,.14),0 14px 44px -6px rgba(235,0,40,1)}}
@media(prefers-reduced-motion:reduce){.ask *,.ask *:before,.ask *:after{animation:none!important;transition:none!important}.ask .big .mark{background-size:100% 100%}.ask .gauge .arc{stroke-dashoffset:0}}

@media(max-width:960px){.ask .grid,.ask.teaser .tz,.ask .hero2,.ask .unlock .cols,.ask .rhero{grid-template-columns:1fr}.ask .order{grid-template-columns:1fr}.ask .ocard:after{display:none}.ask .alt{grid-template-columns:1fr}
  .ask .gauge{margin:0}.ask .rec{grid-template-columns:1fr}.ask .hero2{gap:40px}}
@media(max-width:640px){.ask .wrap{padding:32px 20px 72px}.ask .in{padding:0 20px}.ask h1{font-size:36px}.ask h2{font-size:27px}.ask .qcard{padding:22px;border-radius:18px}.ask .qt{font-size:22px}
  .ask .two{grid-template-columns:1fr}.ask .card,.ask .form-card{padding:22px}.ask .stage .in{padding-top:44px;padding-bottom:56px}.ask .trio b{font-size:30px}
  .ask .row{grid-template-columns:28px 1fr 56px;gap:10px}.ask .row .track{grid-column:2 / span 2}.ask .row .st{display:none}.ask .row .v{grid-row:1;grid-column:3}
  .ask .unlock{padding:64px 0}.ask .sec{padding-top:64px}.ask .shead{flex-direction:column;align-items:flex-start}.ask .rec{padding:26px}.ask .rec .ph{width:96px;height:96px}
  .sb-ask{padding:48px 20px 0}.ask.teaser .tz{padding:22px}.ask .gauge{width:180px;height:180px}}
@media print{
  header,footer,nav,.no-print,[data-cookie-banner]{display:none!important}
  .ask *{animation:none!important}.ask .big .mark{background-size:100% 100%}.ask .gauge .arc{stroke-dashoffset:0}
  .ask .stage,.ask .navycard,.ask .rec,.ask .track .fill,.ask .seg .bar,.ask .st,.ask .row .ix{-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .ask .sec{padding-top:36px}.ask .ocard,.ask .rec,.ask .navycard{break-inside:avoid}.ask .stage .in{padding-top:28px;padding-bottom:36px}
}
`
