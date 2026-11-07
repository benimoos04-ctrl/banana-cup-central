// Direct Neon HTTPS SQL driver: no npm dependencies required by Neon Functions raw deployments.
// Each command is a parameterized HTTPS request to Neon's Postgres HTTP gateway.
class NeonHttpClient {
  async query(query, params=[]) {
    const sql=String(query).trim();
    if (!sql) return {rows:[]};
    if (['BEGIN','COMMIT','ROLLBACK'].includes(sql.toUpperCase())) return {rows:[]};
    // Neon HTTP permits one SQL command per request; schema setup can use separate requests.
    if (/^CREATE TABLE IF NOT EXISTS cup\b/i.test(sql) && sql.includes(';')) {
      let result={rows:[]};
      for (const statement of sql.split(';')) if(statement.trim())result=await this.query(statement,[]);
      return result;
    }
    const conn=new URL(process.env.DATABASE_URL);
    const endpoint=`https://${conn.hostname}/sql`;
    const response=await fetch(endpoint, {
      method:'POST',headers:{
        'Content-Type':'application/json',
        'Neon-Connection-String':process.env.DATABASE_URL,
        'Neon-Raw-Text-Output':'false',
      },
      body:JSON.stringify({query:sql,params}),
      signal:AbortSignal.timeout(15000),
    });
    const result=await response.json();
    if(!response.ok){const er=new Error(result.message || result.error || `DB HTTP ${response.status}`); er.code=result.code; throw er;}
    return {rows:result.rows || (Array.isArray(result)? result : [])};
  }
  release(){}
}
class NeonHttpPool {
  async connect(){return new NeonHttpClient();}
}

import crypto from 'node:crypto';

const pool = new NeonHttpPool();
const ADMIN_PASSWORD=process.env.ADMIN_PASSWORD||'';
const SITE_PASSWORD=process.env.SITE_PASSWORD||'';
const TEAM_LIMIT=8;
const files=/* FILES_INJECT */{};
const HEADERS={'x-content-type-options':'nosniff','x-frame-options':'DENY','referrer-policy':'strict-origin-when-cross-origin','permissions-policy':'camera=(), microphone=(), geolocation=()'};
let bootPromise;
function http(obj,status=200,headers={}){return new Response(JSON.stringify(obj),{status,headers:{...HEADERS,'content-type':'application/json; charset=utf-8',...headers}})}
function err(status,detail){return http({detail},status)}
function text(body,mime){return new Response(body,{headers:{...HEADERS,'content-type':mime,'cache-control':'private, no-store'}})}
function cookieValue(req){const c=req.headers.get('cookie')||'';return c.match(/(?:^|;\s*)banana_session=([^;]+)/)?.[1]||''}
function hasGate(req){
  if(!SITE_PASSWORD || !ADMIN_PASSWORD)return false;
  const value=(req.headers.get('cookie')||'').match(/(?:^|;\s*)banana_gate=([^;]+)/)?.[1]||'';
  const expected=crypto.createHmac('sha256',ADMIN_PASSWORD).update('banana-cup-access-v1:'+SITE_PASSWORD).digest('hex');
  if(value.length!==expected.length)return false;
  return crypto.timingSafeEqual(Buffer.from(value),Buffer.from(expected));
}
function gatePage(message=''){
  const errHtml=message?'<div class="error" role="alert">Passwort stimmt nicht. Bitte nochmals versuchen.</div>':'';
  const html=`<!doctype html><html lang="de-CH"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Geschützter Zugang · Banana United Cup</title><style>
  *{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;background:#080f20;color:#fff;font:16px system-ui,Segoe UI,sans-serif;background-image:radial-gradient(ellipse at 70% 10%,#233661 0,transparent 52%)}.card{width:min(440px,calc(100% - 36px));border:1px solid #395074;border-radius:22px;padding:36px 32px;background:#101e36;box-shadow:0 24px 90px #030912a8}.eyebrow{letter-spacing:.18em;color:#fbd84c;font-weight:800;font-size:12px}.mark{background:#ffe04b;color:#14203a;font-size:27px;font-weight:1000;border-radius:16px;display:inline-grid;place-items:center;width:70px;height:70px;margin-bottom:25px}h1{font-size:34px;line-height:1.08;margin:13px 0 14px}p{color:#c3ccda;line-height:1.6;margin:0 0 27px}label{font-weight:750;font-size:14px;display:block;margin-bottom:10px}input{width:100%;font:inherit;border:1px solid #52617b;background:#071326;padding:16px;color:#fff;border-radius:10px;outline:none}input:focus{border-color:#ffe04b;box-shadow:0 0 0 3px #ffe04b33}button{width:100%;margin-top:15px;border:0;background:#ffe04b;color:#09162a;border-radius:10px;padding:16px;font-size:16px;font-weight:900;cursor:pointer}button:disabled{opacity:.65}.error{background:#532835;color:#fff0f2;border:1px solid #aa596b;padding:12px;border-radius:10px;margin-bottom:15px}.small{font-size:12px;margin-top:20px;color:#7f94b1;text-align:center}</style></head><body><main class="card"><div class="mark">BU.</div><div class="eyebrow">BANANA UNITED · EA FC</div><h1>Privater Cup-Zugang</h1><p>8 Teams. Ein K.-o.-Turnier. Gib das gemeinsame Zugangspasswort ein, um zur Cup-Zentrale zu gelangen.</p>${errHtml}<form id="gate"><label for="password">Zugangspasswort</label><input id="password" name="password" type="password" autocomplete="off" required autofocus placeholder="Passwort eingeben"><button id="submit" type="submit">CUP ÖFFNEN ↗</button></form><div id="message" class="small">Nur für eingeladene Teilnehmer</div></main><script>document.getElementById('gate').addEventListener('submit',async e=>{e.preventDefault();const button=document.getElementById('submit'),message=document.getElementById('message');button.disabled=true;message.textContent='Zugang wird geprüft …';try{const response=await fetch('/api/access',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:document.getElementById('password').value})});if(!response.ok)throw Error('Falsches Passwort');location.replace('/');}catch{message.textContent='Passwort falsch oder Server nicht erreichbar.';button.disabled=false;}});</script></body></html>`;
  return new Response(html,{status:200,headers:{...HEADERS,'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'}});
}
function gateLogin(req){return req.json().catch(()=>({})).then(b=>{
  if(!SITE_PASSWORD||!ADMIN_PASSWORD)return err(503,'Zugangsschutz nicht konfiguriert.');
  const actual=Buffer.from(String(b?.password||''),'utf8'),expected=Buffer.from(SITE_PASSWORD,'utf8');
  if(actual.length!==expected.length||!crypto.timingSafeEqual(actual,expected))return err(401,'Falsches Zugangspasswort.');
  const token=crypto.createHmac('sha256',ADMIN_PASSWORD).update('banana-cup-access-v1:'+SITE_PASSWORD).digest('hex');
  return http({ok:true},200,{'set-cookie':`banana_gate=${token}; Path=/; Max-Age=2592000; HttpOnly; SameSite=Lax; Secure`,'Cache-Control':'no-store'});
});}

function sha(s){return crypto.createHash('sha256').update(s).digest('hex')}
function makeHash(pass){const salt=crypto.randomBytes(16);return salt.toString('hex')+':'+crypto.pbkdf2Sync(pass,salt,310000,32,'sha256').toString('hex')}
function verify(pass,stored){try{const [salt,hex]=stored.split(':');const expected=Buffer.from(hex,'hex');const actual=crypto.pbkdf2Sync(pass,Buffer.from(salt,'hex'),310000,expected.length,'sha256');return crypto.timingSafeEqual(expected,actual)}catch{return false}}
const now=()=>Math.floor(Date.now()/1000);
async function q(c,sql,params=[]){return(await c.query(sql,params)).rows}
async function one(c,sql,params=[]){return(await q(c,sql,params))[0]||null}
async function setup(){const c=await pool.connect();try{await c.query(`CREATE TABLE IF NOT EXISTS cup (id INTEGER PRIMARY KEY CHECK(id=1), name TEXT NOT NULL,format TEXT NOT NULL,group_count INTEGER NOT NULL DEFAULT 2, qualifiers INTEGER NOT NULL DEFAULT 2,double_round INTEGER NOT NULL DEFAULT 0,status TEXT NOT NULL DEFAULT 'anmeldung',created_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS clubs(id INTEGER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,name TEXT NOT NULL UNIQUE,password_hash TEXT NOT NULL,tag TEXT NOT NULL DEFAULT '',color TEXT NOT NULL DEFAULT '#F8D83E',players TEXT NOT NULL DEFAULT '[]',created_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS participants(club_id INTEGER PRIMARY KEY REFERENCES clubs(id) ON DELETE CASCADE,joined_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS matches(id INTEGER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,stage TEXT NOT NULL,group_no INTEGER,round_no INTEGER NOT NULL,slot INTEGER NOT NULL,home_id INTEGER REFERENCES clubs(id),away_id INTEGER REFERENCES clubs(id),home_score INTEGER,away_score INTEGER,winner_id INTEGER REFERENCES clubs(id),kickoff TEXT,feeder_home INTEGER,feeder_away INTEGER,label TEXT NOT NULL DEFAULT '');
CREATE TABLE IF NOT EXISTS sessions(token_hash TEXT PRIMARY KEY,club_id INTEGER REFERENCES clubs(id) ON DELETE CASCADE,is_admin INTEGER NOT NULL DEFAULT 0,expires INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS audit(id INTEGER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,match_id INTEGER,actor TEXT,previous TEXT,updated TEXT,created_at INTEGER NOT NULL);
CREATE UNIQUE INDEX IF NOT EXISTS clubs_name_lower_unique ON clubs (lower(name));`);await q(c,"INSERT INTO cup(id,name,format,group_count,qualifiers,double_round,status,created_at) VALUES (1,'BANANA UNITED OPEN CUP','knockout',2,2,0,'anmeldung',$1) ON CONFLICT DO NOTHING",[now()]);}finally{c.release()}}
async function user(c,req){const t=cookieValue(req);if(!t)return null;const row=await one(c,'SELECT * FROM sessions WHERE token_hash=$1 AND expires>$2',[sha(t),now()]);return row?{club_id:row.club_id,is_admin:!!row.is_admin}:null}
function needed(u,admin=false){if(!u)throw [401,'Bitte zuerst anmelden.'];if(admin&&!u.is_admin)throw [403,'Nur die Turnierleitung darf das ändern.'];return u}
async function authResponse(c,req,club_id=null,is_admin=false){const token=crypto.randomBytes(36).toString('base64url');await q(c,'INSERT INTO sessions(token_hash,club_id,is_admin,expires) VALUES($1,$2,$3,$4)',[sha(token),club_id,is_admin?1:0,now()+2592000]);const cookie=`banana_session=${token}; Path=/; Max-Age=2592000; HttpOnly; SameSite=Lax; Secure`;return http({ok:true},200,{'set-cookie':cookie})}
function standingsRows(rows,games){const stats={};for(const r of rows)stats[r.id]={...r,played:0,wins:0,draws:0,losses:0,gf:0,ga:0,gd:0,points:0};for(const m of games){if(m.home_score===null||m.away_score===null)continue;const a=stats[m.home_id],b=stats[m.away_id];if(!a||!b)continue;a.played++;b.played++;a.gf+=m.home_score;a.ga+=m.away_score;b.gf+=m.away_score;b.ga+=m.home_score;if(m.home_score>m.away_score){a.wins++;a.points+=3;b.losses++}else if(m.home_score<m.away_score){b.wins++;b.points+=3;a.losses++}else{a.draws++;b.draws++;a.points++;b.points++}}return Object.values(stats).map(x=>({...x,gd:x.gf-x.ga})).sort((a,b)=>b.points-a.points||b.gd-a.gd||b.gf-a.gf||a.name.localeCompare(b.name,'de')).map((x,i)=>({...x,rank:i+1}))}
async function getState(c,req){const cup=await one(c,'SELECT * FROM cup WHERE id=1'),raw=await q(c,'SELECT c.id,c.name,c.tag,c.color,c.players FROM clubs c JOIN participants p ON p.club_id=c.id ORDER BY c.name'),clubs=raw.map(x=>({...x,players:JSON.parse(x.players)})),matches=await q(c,"SELECT * FROM matches ORDER BY CASE stage WHEN 'group' THEN 0 WHEN 'league' THEN 0 ELSE 1 END,round_no,group_no,slot,id"),tables={};let roster=await q(c,'SELECT c.id,c.name,c.tag,c.color FROM clubs c JOIN participants p ON p.club_id=c.id ORDER BY c.name');if(cup.format==='groups'){for(let i=1;i<=cup.group_count;i++){const game=matches.filter(m=>m.stage==='group'&&m.group_no===i);const ids=new Set(game.flatMap(m=>[m.home_id,m.away_id]));const rows=standingsRows(roster.filter(r=>ids.has(r.id)),game);if(rows.length)tables['Gruppe '+String.fromCharCode(64+i)]=rows}}else if(cup.format==='league'){tables['Gesamttabelle']=standingsRows(roster,matches.filter(m=>m.stage==='league'))}
const u=await user(c,req);let myclub=clubs.find(x=>x.id===u?.club_id)||null;if(u?.club_id&&!myclub){const x=await one(c,'SELECT id,name,tag,color,players FROM clubs WHERE id=$1',[u.club_id]);if(x)myclub={...x,players:JSON.parse(x.players)}}return {cup,clubs,matches,tables,me:{club:myclub,admin:!!u?.is_admin,logged_in:!!u},generated:matches.length>0,can_start_ko:cup.format==='groups'&&matches.some(x=>x.stage==='group')&&!matches.some(x=>x.stage==='ko')}}
const strings={};function int(x,n=0){return Number.isFinite(Number(x))?Math.trunc(Number(x)):n};function validCup(b){if(!b||String(b.name||'').trim().length<3||String(b.name).length>90)throw [400,'Ungültiger Cup-Name.'];return [String(b.name).trim(),'knockout',2,2,0]}
function roundRobin(ids,double=false){let a=[...ids];if(a.length%2)a.push(null);const n=a.length, out=[];for(let r=0;r<n-1;r++){for(let i=0;i<n/2;i++){let x=a[i],y=a[n-1-i];if(x!=null&&y!=null){if((r+i)%2)[x,y]=[y,x];out.push([r+1,x,y])}}a=[a[0],a[n-1],...a.slice(1,n-1)]}return double?out.concat(out.map(([r,x,y])=>[r+n-1,y,x])):out}
function koLabel(r,n){return ({0:'Finale',1:'Halbfinale',2:'Viertelfinale',3:'Achtelfinale',4:'Sechzehntelfinale'})[n-r]||'K.-o.-Runde'}
async function propagate(c){const matches=await q(c,"SELECT * FROM matches WHERE stage='ko' ORDER BY round_no,slot"),winners={};for(const m of matches){const a=m.feeder_home==null?m.home_id:(winners[m.feeder_home]||null),b=m.feeder_away==null?m.away_id:(winners[m.feeder_away]||null);let winner=m.winner_id;if(a!==m.home_id||b!==m.away_id){await q(c,'UPDATE matches SET home_id=$1,away_id=$2,home_score=NULL,away_score=NULL,winner_id=NULL WHERE id=$3',[a,b,m.id]);winner=null}if(m.feeder_home==null&&m.feeder_away==null&&((a&&!b)||(b&&!a))){winner=a||b;await q(c,'UPDATE matches SET winner_id=$1 WHERE id=$2',[winner,m.id])}winners[m.id]=winner}}
async function bracket(c,teams){if(teams.length<2||teams.length>32)throw [400,'Für den K.-o.-Baum sind 2 bis 32 Vereine notwendig.'];const size=2**Math.ceil(Math.log2(teams.length)),p=[...teams,...Array(size-teams.length).fill(null)],rounds=Math.log2(size);let prev=[];for(let r=1;r<=rounds;r++){let next=[];for(let slot=0;slot<size/2**r;slot++){let rows;if(r===1){let a=p[slot],b=p[size-slot-1];rows=await q(c,"INSERT INTO matches(stage,round_no,slot,home_id,away_id,winner_id,label) VALUES('ko',$1,$2,$3,$4,$5,$6) RETURNING id",[r,slot+1,a,b,a&&!b?a:b&&!a?b:null,koLabel(r,rounds)])}else{rows=await q(c,"INSERT INTO matches(stage,round_no,slot,feeder_home,feeder_away,label) VALUES('ko',$1,$2,$3,$4,$5) RETURNING id",[r,slot+1,prev[2*slot],prev[2*slot+1],koLabel(r,rounds)])}next.push(rows[0].id)}prev=next}await propagate(c)}
async function dispatch(c,req,path,method,b){const u=await user(c,req);if(method==='GET'&&path==='/api/state')return http(await getState(c,req));if(method==='POST'&&path==='/api/register'){if(!b||String(b.name||'').trim().length<3||String(b.name||'').length>55||String(b.password||'').length<6||String(b.password||'').length>128)throw [400,'Vereinsname oder Passwort ungültig.'];const cup=await one(c,'SELECT status FROM cup WHERE id=1');if(cup.status!=='anmeldung')throw [409,'Die Anmeldung ist geschlossen.'];if((await q(c,'SELECT club_id FROM participants')).length>=TEAM_LIMIT)throw [409,'Der Cup ist voll: 8 von 8 Teams angemeldet.'];try{const r=await q(c,'INSERT INTO clubs(name,password_hash,created_at) VALUES($1,$2,$3) RETURNING id',[b.name.trim(),makeHash(b.password),now()]);await q(c,'INSERT INTO participants(club_id,joined_at) VALUES($1,$2)',[r[0].id,now()]);return authResponse(c,req,r[0].id)}catch(e){if(e.code==='23505')throw [409,'Dieser Vereinsname ist bereits vergeben.'];throw e}}
if(method==='POST'&&path==='/api/login'){const row=await one(c,'SELECT * FROM clubs WHERE lower(name)=lower($1)',[String(b.name||'').trim()]);if(!row||!verify(String(b.password||''),row.password_hash))throw [401,'Vereinsname oder Passwort stimmt nicht.'];return authResponse(c,req,row.id)}
if(method==='POST'&&path==='/api/admin/login'){if(!ADMIN_PASSWORD)throw [503,'Admin-Zugang ist noch nicht konfiguriert.'];const actual=Buffer.from(String(b.password||'')),expected=Buffer.from(ADMIN_PASSWORD);if(actual.length!==expected.length||!crypto.timingSafeEqual(actual,expected))throw [401,'Falsches Admin-Passwort.'];return authResponse(c,req,null,true)}
if(method==='POST'&&path==='/api/logout'){const t=cookieValue(req);if(t)await q(c,'DELETE FROM sessions WHERE token_hash=$1',[sha(t)]);return http({ok:true},200,{'set-cookie':'banana_session=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax'})}
if(method==='PATCH'&&path==='/api/me'){needed(u);if(!u.club_id)throw [403,'Bitte als Verein anmelden.'];const color=String(b.color||'#F8D83E');if(!/^#[\da-fA-F]{6}$/.test(color))throw [400,'Ungültige Farbe.'];const players=(Array.isArray(b.players)?b.players:[]).filter(x=>typeof x==='string'&&x.trim()).slice(0,30).map(x=>x.trim().slice(0,45));await q(c,'UPDATE clubs SET tag=$1,color=$2,players=$3 WHERE id=$4',[String(b.tag||'').trim().slice(0,12),color,JSON.stringify(players),u.club_id]);return http({ok:true})}
if(method==='POST'&&path==='/api/join'){needed(u);if(!u.club_id)throw [403,'Nur Vereine können sich anmelden.'];const cup=await one(c,'SELECT status FROM cup WHERE id=1');if(cup.status!=='anmeldung'||(await one(c,'SELECT id FROM matches LIMIT 1')))throw [409,'Die Anmeldung ist geschlossen.'];if((await q(c,'SELECT club_id FROM participants')).length>=TEAM_LIMIT && !(await one(c,'SELECT club_id FROM participants WHERE club_id=$1',[u.club_id])))throw [409,'Der Cup ist voll (8 Teams).'];await q(c,'INSERT INTO participants(club_id,joined_at) VALUES($1,$2) ON CONFLICT DO NOTHING',[u.club_id,now()]);return http({ok:true})}
if(path.startsWith('/api/admin/'))needed(u,true);
if(method==='POST'&&path==='/api/admin/cup'){const [name,format,g,n,d]=validCup(b);if(await one(c,'SELECT id FROM matches LIMIT 1'))throw [409,'Spielplan wurde bereits erstellt.'];await q(c,'UPDATE cup SET name=$1,format=$2,group_count=$3,qualifiers=$4,double_round=$5 WHERE id=1',[name,format,g,n,d]);return http({ok:true})}
if(method==='POST'&&path==='/api/admin/reset'){if(b?.confirm!=='NEUER CUP')throw [400,'Bitte NEUER CUP als Bestätigung eingeben.'];const [name,format,g,n,d]=validCup(b);await q(c,'DELETE FROM matches');await q(c,'DELETE FROM participants');await q(c,'DELETE FROM audit');await q(c,"UPDATE cup SET name=$1,format=$2,group_count=$3,qualifiers=$4,double_round=$5,status='anmeldung',created_at=$6 WHERE id=1",[name,format,g,n,d,now()]);return http({ok:true})}
if(method==='POST'&&path==='/api/admin/registration'){const cup=await one(c,'SELECT status FROM cup WHERE id=1'),status=cup.status==='geschlossen'?'anmeldung':'geschlossen';await q(c,'UPDATE cup SET status=$1 WHERE id=1',[status]);return http({ok:true,status})}
if(method==='POST'&&path==='/api/admin/join'){const id=int(b?.club_id);if(!await one(c,'SELECT id FROM clubs WHERE id=$1',[id]))throw [404,'Verein nicht gefunden.'];if((await q(c,'SELECT club_id FROM participants')).length>=TEAM_LIMIT && !(await one(c,'SELECT club_id FROM participants WHERE club_id=$1',[id])))throw [409,'Maximal 8 Teams zugelassen.'];await q(c,'INSERT INTO participants(club_id,joined_at) VALUES($1,$2) ON CONFLICT DO NOTHING',[id,now()]);return http({ok:true})}
if(method==='GET'&&path==='/api/admin/clubs')return http({clubs:await q(c,'SELECT id,name,tag,color FROM clubs ORDER BY name')});
if(method==='POST'&&path==='/api/admin/remove'){if(await one(c,'SELECT id FROM matches LIMIT 1'))throw [409,'Teilnehmer nach Spielplangenerierung nicht mehr entfernbar.'];await q(c,'DELETE FROM participants WHERE club_id=$1',[int(b?.club_id)]);return http({ok:true})}
if(method==='POST'&&path==='/api/admin/generate'){if(await one(c,'SELECT id FROM matches LIMIT 1'))throw [409,'Es gibt bereits einen Spielplan.'];const cup=await one(c,'SELECT * FROM cup WHERE id=1'),teams=(await q(c,'SELECT club_id FROM participants ORDER BY joined_at,club_id')).map(x=>x.club_id);if(teams.length!==TEAM_LIMIT)throw [400,`Für den K.-o.-Cup werden genau ${TEAM_LIMIT} Teams benötigt. Momentan: ${teams.length}.`];if(cup.format==='knockout'){await bracket(c,teams)}else if(cup.format==='league'){for(const [idx,[r,a,b]] of roundRobin(teams,!!cup.double_round).entries())await q(c,"INSERT INTO matches(stage,round_no,slot,home_id,away_id,label) VALUES('league',$1,$2,$3,$4,$5)",[r,idx+1,a,b,'Spieltag '+r])}else{const count=cup.group_count;if(teams.length<count*2)throw [400,`Für ${count} Gruppen brauchst du mindestens ${count*2} Vereine.`];const groups=Array.from({length:count},()=>[]);teams.forEach((id,i)=>{const row=Math.floor(i/count),pos=row%2?count-1-(i%count):i%count;groups[pos].push(id)});if(groups.some(g=>g.length<cup.qualifiers)||![2,4,8,16].includes(count*cup.qualifiers))throw [400,'Ungültige Gruppenkonfiguration.'];for(let i=0;i<groups.length;i++){for(const [idx,[r,a,b]] of roundRobin(groups[i],!!cup.double_round).entries())await q(c,"INSERT INTO matches(stage,group_no,round_no,slot,home_id,away_id,label) VALUES('group',$1,$2,$3,$4,$5,$6)",[i+1,r,idx+1,a,b,'Gruppe '+String.fromCharCode(65+i)])}}await q(c,"UPDATE cup SET status='geschlossen' WHERE id=1");return http({ok:true})}
if(method==='POST'&&path==='/api/admin/ko/start'){const cup=await one(c,'SELECT * FROM cup WHERE id=1');if(cup.format!=='groups')throw [400,'Nur nach einer Gruppenphase möglich.'];if(await one(c,"SELECT id FROM matches WHERE stage='ko' LIMIT 1"))throw [409,'K.-o.-Phase läuft bereits.'];const games=await q(c,"SELECT * FROM matches WHERE stage='group'");if(!games.length||games.some(m=>m.home_score==null))throw [400,'Zuerst alle Gruppenspiele abschliessen.'];const roster=await q(c,'SELECT c.id,c.name,c.tag,c.color FROM clubs c JOIN participants p ON p.club_id=c.id ORDER BY c.name');const tables=Array.from({length:cup.group_count},(_,i)=>{const group=games.filter(m=>m.group_no===i+1),ids=new Set(group.flatMap(m=>[m.home_id,m.away_id]));return standingsRows(roster.filter(x=>ids.has(x.id)),group)});if(tables.some(x=>x.length<cup.qualifiers))throw [400,'Zu wenige Vereine.'];let teams;if(cup.qualifiers===2){const win=tables.map(g=>g[0].id),runner=tables.map(g=>g[1].id);const opponents=runner.slice(1).concat(runner[0]);teams=win.concat(opponents.reverse())}else teams=tables.map(g=>g[0].id);await bracket(c,teams);return http({ok:true})}
let m=path.match(/^\/api\/matches\/(\d+)\/score$/);if(method==='POST'&&m){needed(u);const id=int(m[1]),match=await one(c,'SELECT * FROM matches WHERE id=$1',[id]);if(!match)throw [404,'Spiel nicht gefunden.'];if(!u.is_admin&&u.club_id!==match.home_id&&u.club_id!==match.away_id)throw [403,'Du darfst nur eigene Spiele eintragen.'];if(!match.home_id||!match.away_id)throw [409,'Die Begegnung steht noch nicht fest.'];const hs=b.home_score===null||b.home_score===undefined?null:int(b.home_score),as=b.away_score===null||b.away_score===undefined?null:int(b.away_score);if((hs===null)!==(as===null)||[hs,as].some(x=>x!==null&&(x<0||x>99)))throw [400,'Bitte gültige Resultate eingeben (0–99).'];let win=null;if(hs!==null&&match.stage==='ko'){win=hs>as?match.home_id:hs<as?match.away_id:null;if(win===null){if(![match.home_id,match.away_id].includes(int(b.winner_id)))throw [400,'Bei Gleichstand Sieger auswählen.'];win=int(b.winner_id)}}await q(c,'UPDATE matches SET home_score=$1,away_score=$2,winner_id=$3 WHERE id=$4',[hs,as,win,id]);await q(c,'INSERT INTO audit(match_id,actor,previous,updated,created_at) VALUES($1,$2,$3,$4,$5)',[id,u.is_admin?'Admin':'Verein '+u.club_id,JSON.stringify({home_score:match.home_score,away_score:match.away_score,winner_id:match.winner_id}),JSON.stringify(b),now()]);if(match.stage==='ko')await propagate(c);return http({ok:true})}
m=path.match(/^\/api\/admin\/matches\/(\d+)$/);if(method==='PATCH'&&m){const id=int(m[1]);if(!await one(c,'SELECT id FROM matches WHERE id=$1',[id]))throw [404,'Spiel nicht gefunden.'];const kickoff=b?.kickoff?String(b.kickoff).trim():null;if(kickoff&&(kickoff.length>45||/[\x00-\x1f]/.test(kickoff)))throw [400,'Ungültige Zeitangabe.'];await q(c,'UPDATE matches SET kickoff=$1 WHERE id=$2',[kickoff,id]);return http({ok:true})}
m=path.match(/^\/api\/admin\/clubs\/(\d+)\/password$/);if(method==='POST'&&m){const id=int(m[1]);if(String(b?.password||'').length<6||String(b?.password||'').length>128)throw [400,'Ungültiges Passwort.'];const rows=await q(c,'UPDATE clubs SET password_hash=$1 WHERE id=$2 RETURNING id',[makeHash(b.password),id]);if(!rows.length)throw [404,'Verein nicht gefunden.'];await q(c,'DELETE FROM sessions WHERE club_id=$1',[id]);return http({ok:true})}
throw [404,'Nicht gefunden.']}
export default {async fetch(req){
  const url=new URL(req.url),path=url.pathname,method=req.method;
  if(method==='GET'&&path==='/healthz')return http({status:'ok'});
  if(method==='POST'&&path==='/api/access')return gateLogin(req);
  if(!hasGate(req)){
    if(method==='GET'&&path==='/')return gatePage();
    return err(401,'Zugangspasswort erforderlich.');
  }
  if(method==='GET'&&path==='/')return text(files.html,'text/html; charset=utf-8');
  if(method==='GET'&&path==='/static/style.css')return text(files.css,'text/css; charset=utf-8');
  if(method==='GET'&&path==='/static/app.js')return text(files.js,'text/javascript; charset=utf-8');
  if(!path.startsWith('/api/'))return err(404,'Nicht gefunden.');
  try{
    if(!bootPromise)bootPromise=setup();await bootPromise;
    const c=await pool.connect();
    try{const body=method==='GET'?{}:await req.json().catch(()=>({}));
      if(method==='GET')return await dispatch(c,req,path,method,body);
      await c.query('BEGIN');
      try{const res=await dispatch(c,req,path,method,body);await c.query('COMMIT');return res}
      catch(e){await c.query('ROLLBACK').catch(()=>{});throw e}
    }finally{c.release()}
  }catch(e){if(Array.isArray(e))return err(e[0],e[1]);console.error('banana-cup-error',e);if(e.code==='23505')return err(409,'Dieser Name ist bereits vergeben.');return err(500,'Serverfehler. Bitte erneut versuchen.')}
}};