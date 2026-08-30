import os,sys,json,time,re,urllib.request,urllib.parse as up,psycopg2,psycopg2.extras
# Entwickler-Werkzeug: einen Strategie-Agenten ausserhalb der App laufen lassen.
# Nutzung: POSTGRES_URL=... OPENAI_API_KEY=... python3 scripts/run-strategy-agent.py \
#            <agent-key> <step-key> <ausgabe.json> <company-id> <product-id> [material.txt]
# Spiegelt lib/strategy/prompt.ts assemble() und lib/strategy/run.ts runAgent().
CO=sys.argv[4]; PR=sys.argv[5]
u=up.urlsplit(os.environ['POSTGRES_URL'])
c=psycopg2.connect(dbname='postgres',user=up.unquote(u.username),password=up.unquote(u.password),host=u.hostname,port=u.port,sslmode='require')
cur=c.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
agent, step, outfile = sys.argv[1], sys.argv[2], sys.argv[3]

cur.execute("select * from strategy_prompts where agent_key=%s and is_active limit 1",(agent,)); p=cur.fetchone()
cur.execute("select f.key,f.value,coalesce(k.label,f.key) as label from strategy_facts f left join strategy_fact_keys k on k.key=f.key where f.company_id=%s and (f.product_id=%s or f.product_id is null) and f.is_current and f.key = any(%s)",(CO,PR,p['consumes']))
facts={}; labels={}
for r in cur.fetchall(): facts[r['key']]=r['value']; labels[r['key']]=r['label']
missing=[k for k in p['consumes'] if k not in facts]
facts['_material']=open(sys.argv[6]).read() if len(sys.argv)>6 else ''

def s(v): return v if isinstance(v,str) else json.dumps(v,ensure_ascii=False,indent=2)
brief="\n\n".join(f"**{labels.get(k,k)}** ({k})\n{s(v)}" for k,v in facts.items() if k!='_material')
task=re.sub(r'\{\{fact:([a-z0-9_.]+)\}\}', lambda m: s(facts[m.group(1)]) if m.group(1) in facts else '(noch nicht erarbeitet)', p['user_template'])
RULES=['- Antworte ausschließlich im vorgegebenen JSON-Schema. Kein Fließtext davor oder danach.',
'- Jede Aussage ist konkret und auf diesen Kunden bezogen. Keine Allgemeinplätze.',
'- Wo Du etwas annimmst statt weißt, kennzeichne es im Feld evidence als Annahme.',
'- Schreibe auf Deutsch, in der Sprache des Kunden, nicht in Beratersprache.']
system=p['system_prompt'].strip()+"\n\nRegeln für die Ausgabe:\n"+"\n".join(RULES)
parts=['## Was wir über diesen Kunden wissen',brief]
if missing: parts.append(f"\n## Noch offen\nZu diesen Punkten liegt nichts vor: {', '.join(missing)}. Arbeite ohne sie und kennzeichne, wo sie fehlen.")
parts.append(f"\n## Auftrag\n{task}")
user="\n\n".join(parts)

MODEL='gpt-4.1'
body=json.dumps({"model":MODEL,"messages":[{"role":"system","content":system},{"role":"user","content":user}],
 "temperature":float(p['temperature']),
 "response_format":{"type":"json_schema","json_schema":{"name":"ergebnis","schema":p['output_schema'],"strict":False}}}).encode()
t0=time.time()
req=urllib.request.Request('https://api.openai.com/v1/chat/completions',data=body,
 headers={'Authorization':'Bearer '+os.environ['OPENAI_API_KEY'],'Content-Type':'application/json'})
data=json.load(urllib.request.urlopen(req,timeout=300)); dur=int((time.time()-t0)*1000)
parsed=json.loads(data['choices'][0]['message']['content'])
ti=data['usage']['prompt_tokens']; to=data['usage']['completion_tokens']

w=c.cursor()
w.execute("""insert into ai_runs (company_id,product_id,purpose,agent_key,model,input,output,tokens_in,tokens_out,duration_ms,ok,prompt_id,prompt_version,model_role)
 values (%s,%s,'strategy-step',%s,%s,%s::jsonb,%s::jsonb,%s,%s,%s,true,%s,%s,%s) returning id""",
 (CO,PR,agent,MODEL,json.dumps({"system":system[:2000],"user":user[:4000],"promptVersion":p['version']}),json.dumps(parsed,ensure_ascii=False),ti,to,dur,p['id'],p['version'],p['model_role']))
run_id=w.fetchone()[0]

# Verbrauch buchen
w.execute("select input_per_1m,output_per_1m from ai_model_prices where model=%s order by valid_from desc limit 1",(MODEL,))
pr=w.fetchone(); cost=(ti/1e6)*float(pr[0])+(to/1e6)*float(pr[1])
w.execute("select markup_factor from billing_settings where company_id=%s",(CO,)); mf=w.fetchone(); mf=float(mf[0]) if mf else 10.0
amt=round(cost*mf,4)
w.execute("select balance_after from usage_ledger where company_id=%s order by occurred_at desc,created_at desc limit 1",(CO,))
b=w.fetchone(); bal=float(b[0]) if b else 0.0
w.execute("""insert into usage_ledger (company_id,product_id,kind,action,agent_key,model,tokens_in,tokens_out,cost_eur,amount_eur,markup_factor,balance_after,ai_run_id)
 values (%s,%s,'verbrauch',%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)""",(CO,PR,f"icp · {agent}",agent,MODEL,ti,to,round(cost,4),amt,mf,round(bal-amt,4),run_id))

# Fakten schreiben (Version hochzaehlen)
for key in p['produces']:
    short=key.split('.',1)[1]
    val=parsed.get(key) or parsed.get(short)
    if val is None: continue
    w.execute("select id,version from strategy_facts where company_id=%s and product_id=%s and key=%s and is_current",(CO,PR,key))
    old=w.fetchone(); ver=(old[1]+1) if old else 1
    if old: w.execute("update strategy_facts set is_current=false,updated_at=now() where id=%s",(old[0],))
    w.execute("""insert into strategy_facts (company_id,product_id,key,value,source,ai_run_id,confidence,status,is_current,version,supersedes_id)
     values (%s,%s,%s,%s::jsonb,'agent',%s,0.6,'draft',true,%s,%s)""",(CO,PR,key,json.dumps(val,ensure_ascii=False),run_id,ver,old[0] if old else None))
c.commit()
json.dump(parsed,open(outfile,'w'),ensure_ascii=False,indent=1)
print(f"{agent} v{p['version']} · {dur/1000:.1f}s · {ti}+{to} tok · {amt:.3f} EUR · fehlend: {missing or '—'}")
