/* Generator Jadwal Sidang Skripsi — core offline, tanpa dependensi.
   Semua tanggal menggunakan YYYY-MM-DD dan perhitungan UTC untuk menghindari pergeseran zona waktu. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.ScheduleCore = api;
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : null), function () {
  'use strict';
  const ROOMS = Array.from({length: 14}, (_, i) => 'N' + (701 + i));
  const WINDOWS = {
    'Reguler|1': ['2026-09-28', '2026-10-23'],
    'Reguler|2': ['2026-11-02', '2026-11-06'],
    'Alih Jenjang|1': ['2026-10-05', '2026-10-16'],
    'Alih Jenjang|2': ['2026-11-02', '2026-11-06']
  };
  const ASP_BLACKOUT = new Set(['2026-10-06', '2026-10-14']);
  const MONTHS = {januari:1,jan:1,january:1,februari:2,feb:2,february:2,maret:3,mar:3,march:3,april:4,apr:4,mei:5,may:5,juni:6,jun:6,june:6,juli:7,jul:7,july:7,agustus:8,agu:8,aug:8,august:8,september:9,sep:9,oktober:10,okt:10,oct:10,october:10,november:11,nov:11,desember:12,des:12,dec:12,december:12};
  const DAYS = {minggu:0,sunday:0,sun:0,ahad:0,senin:1,monday:1,mon:1,selasa:2,tuesday:2,tue:2,rabu:3,wednesday:3,wed:3,kamis:4,thursday:4,thu:4,jumat:5,jumaat:5,friday:5,fri:5,sabtu:6,saturday:6,sat:6};
  function normKey(s) {return String(s ?? '').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();}
  function normName(s) {
    let x = String(s ?? '').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
    x = x.split(',')[0].replace(/[.’`]/g, ' ').replace(/\s+/g,' ').trim();
    let last = '';
    while (last !== x) {last=x;x=x.replace(/^(?:prof(?:esor)?|drs?|dra|ir|h|hj|apt|ph\s*d|drg)\b\s*/,'').trim();}
    return x.replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim();
  }
  function validYMD(s) {
    const m=/^(\d{4})-(\d\d)-(\d\d)$/.exec(String(s||'')); if(!m) return null;
    const d = new Date(Date.UTC(+m[1], +m[2]-1, +m[3]));
    return d.getUTCFullYear() === +m[1] && d.getUTCMonth()+1 === +m[2] && d.getUTCDate() === +m[3] ? s : null;
  }
  function ymd(y,m,d) {return validYMD(`${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`);}
  function isoDay(s) {return new Date(s+'T12:00:00Z').getUTCDay();}
  function addDay(s,n=1) {const d=new Date(s+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10);}
  function fmtDate(s) {if (!validYMD(s)) return s||'-';const days=['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'],months=['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];return `${days[isoDay(s)]}, ${+s.slice(8)} ${months[+s.slice(5,7)-1]} ${s.slice(0,4)}`;}
  function expandRange(a,b,cap=40) {if(!a||!b||a>b)return [];let v=[],cur=a;while(cur<=b&&v.length<cap){v.push(cur);cur=addDay(cur)}return v;}
  function parseDate(s) {
    if (s instanceof Date && !isNaN(s)) return ymd(s.getFullYear(),s.getMonth()+1,s.getDate());
    const str=String(s??'').trim().replace(/\u00a0/g,' ');if(!str)return null;
    const iso=/\b(20\d\d)[-\/](\d\d?)[-\/](\d\d?)\b/.exec(str);if(iso)return ymd(+iso[1],+iso[2],+iso[3]);
    const numeric=/\b(\d{1,2})[\/.-](\d{1,2})[\/.-](20\d\d|\d\d)\b/.exec(str);if(numeric){const year=numeric[3].length===2?2000+(+numeric[3]):+numeric[3];return ymd(year,+numeric[2],+numeric[1]);}
    const word=/\b(\d{1,2})\s+([a-zA-Z]+)\s*,?\s*(20\d\d)\b/i.exec(str);if(word&&MONTHS[word[2].toLowerCase()])return ymd(+word[3],MONTHS[word[2].toLowerCase()],+word[1]);
    // Google Visualization terkadang mengirim Date(2026,9,28), bulan dimulai dari nol.
    const gviz=/Date\s*\(\s*(20\d\d)\s*,\s*(\d{1,2})\s*,\s*(\d{1,2})/.exec(str);if(gviz)return ymd(+gviz[1],+gviz[2]+1,+gviz[3]);
    if(/^\d{5}(?:\.0)?$/.test(str)){const n=+str;if(n>40000&&n<60000){const d=new Date(Date.UTC(1899,11,30+n));return d.toISOString().slice(0,10);}}
    return null;
  }
  function parseDates(value) {
    if (!value && value!==0) return [];
    if (Array.isArray(value)) return Array.from(new Set(value.flatMap(parseDates))).sort();
    const text=String(value).replace(/\u00a0/g,' ').replace(/\bs\.?\s*d\.?/gi,' sampai ').replace(/\b(?:sampai|hingga)\b/gi,' sampai ');
    const result = new Set();
    const full=/\b(?:20\d\d[-\/]\d{1,2}[-\/]\d{1,2}|\d{1,2}[\/.-]\d{1,2}[\/.-](?:20\d\d|\d\d)|\d{1,2}\s+[a-zA-Z]+\s*,?\s*20\d\d)\b/g;
    const matches=[...text.matchAll(full)].map(m=>({raw:m[0],start:m.index,date:parseDate(m[0])})).filter(m=>m.date);
    for (const m of matches) result.add(m.date);
    // Misal: 6 dan 14 Oktober 2026 / 6, 14 Oktober 2026.
    const monthYear=/\b(\d{1,2})\s+([a-zA-Z]+)\s+(20\d\d)\b/g;
    for (const m of text.matchAll(monthYear)) {
      const month=MONTHS[m[2].toLowerCase()];if(!month)continue;
      const before=text.slice(Math.max(0,m.index-40),m.index);
      const extra=/(?:^|[,;\s])([1-9]|[12]\d|3[01])\s*(?:,|dan|&|\+)\s*$/.exec(before);
      if(extra){const date=ymd(+m[3],month,+extra[1]);if(date)result.add(date);}
    }
    if(matches.length===2 && /\b(?:sampai|to|hingga)\b|[-–—]/i.test(text.slice(matches[0].start+matches[0].raw.length,matches[1].start))){
      for(const date of expandRange(matches[0].date,matches[1].date))result.add(date);
    }
    if(matches.length===1){
      const m=/\b(\d{1,2})\s*(?:[-–—]|sampai)\s*(\d{1,2})\s+([a-zA-Z]+)\s+(20\d\d)\b/.exec(text);
      if(m && MONTHS[m[3].toLowerCase()])for(const d of expandRange(ymd(+m[4],MONTHS[m[3].toLowerCase()],+m[1]),ymd(+m[4],MONTHS[m[3].toLowerCase()],+m[2])))result.add(d);
    }
    if(matches.length===0){const one=parseDate(text);if(one)result.add(one);}
    return [...result].sort();
  }
  function parseWeekdays(raw) {
    const s=normKey(raw);if(!s)return [];
    const res=new Set();const words=s.split(/\s+/);
    for(let i=0;i<words.length;i++)if(Object.prototype.hasOwnProperty.call(DAYS,words[i])){
      if((words[i+1]==='sampai'||words[i+1]==='sd'||words[i+1]==='hingga'||words[i+1]==='to') && Object.prototype.hasOwnProperty.call(DAYS,words[i+2])){
        const a=DAYS[words[i]],b=DAYS[words[i+2]];for(let d=a;d<=b;d++)res.add(d);i+=2;
      }else res.add(DAYS[words[i]]);
    }
    return [...res];
  }
  function parseSessions(s) {if(s===null||s===undefined||String(s).trim()==='')return [];
    const t=String(s).toLowerCase();if(/\b(?:semua|all|full|seharian)\b/.test(t))return [];
    const matches=[...t.matchAll(/(?:sesi|session)\s*([1-4])\b|\b([1-4])\b/g)].map(m=>+(m[1]||m[2]));return [...new Set(matches)];
  }
  function sessionsFor(date) {
    const day=isoDay(date);
    if(day===5)return [{no:1,start:'07:45',end:'09:30'},{no:2,start:'09:45',end:'11:30'},{no:3,start:'13:30',end:'15:15'}];
    if(day>=1&&day<=4)return [{no:1,start:'08:00',end:'09:45'},{no:2,start:'10:00',end:'11:45'},{no:3,start:'13:00',end:'14:45'},{no:4,start:'15:30',end:'17:15'}];
    return [];
  }
  function dateRange(key,asp=false) {const w=WINDOWS[key];if(!w)return [];return expandRange(...w).filter(d=>sessionsFor(d).length&&(!asp||!ASP_BLACKOUT.has(d)));}
  function sniffDelimiter(t){const line=String(t).split(/\r?\n/).find(x=>x.trim())||'';const vals={',':0,';':0,'\t':0};let q=false;for(let i=0;i<line.length;i++){const ch=line[i];if(ch==='"'){if(q&&line[i+1]==='"')i++;else q=!q;}else if(!q&&ch in vals)vals[ch]++;}return Object.keys(vals).sort((a,b)=>vals[b]-vals[a])[0];}
  function csvParse(text){const t=String(text||'').replace(/^\uFEFF/,'');const sep=sniffDelimiter(t);let rows=[],cell='',row=[],quoted=false;
    for(let i=0;i<t.length;i++){const c=t[i];if(c==='"'){if(quoted&&t[i+1]==='"'){cell+='"';i++;}else quoted=!quoted;}else if(c===sep&&!quoted){row.push(cell);cell='';}else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&t[i+1]==='\n')i++;row.push(cell);if(row.some(v=>v.trim()))rows.push(row);row=[];cell='';}else cell+=c;}
    if(cell!==''||row.length){row.push(cell);if(row.some(v=>v.trim()))rows.push(row);}
    if(!rows.length)return {headers:[],rows:[]};
    let headers=rows.shift().map((v,i)=>v.trim()||'Kolom '+(i+1));
    const seen={};headers=headers.map(h=>{const n=(seen[h]=(seen[h]||0)+1);return n===1?h:`${h} (${n})`;});
    return {headers,rows:rows.map((r,i)=>Object.fromEntries([...headers.map((h,j)=>[h,String(r[j]??'').trim()]),['_row',i+2]]))};
  }
  function csvExport(rows,headers){function cell(v){let s=String(v??'');if(/^[\s]*[=+@\-\t\r]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';}return '\uFEFF'+[headers.map(cell).join(','),...rows.map(r=>headers.map(h=>cell(r[h])).join(','))].join('\r\n');}
  function inferHeader(headers,type,field){const h=headers||[];const norms=h.map(x=>normKey(x));
    const rules={
      panels:{student:[/^nama mahasiswa$/, /^nama mhs$/, /^mahasiswa$/, /nama peserta/,/^nama$/],nim:[/^nim$/, /npm/,/nomor induk/],major:[/^program studi$/, /^prodi$/, /^jurusan$/, /bidang studi/],kind:[/^jenis prodi$/, /^jenis program/,/^jalur/,/jenis mahasiswa/,/^kategori$/],stage:[/^tahap$/, /^gelombang$/, /tahap ujian/,/periode ujian/],chair:[/^ketua penguji$/, /ketua sidang/,/^penguji ketua$/, /^ketua$/],member1:[/^anggota penguji 1$/, /^penguji 1$/, /anggota penguji i$/, /penguji pertama/,/^anggota 1$/],member2:[/^anggota penguji 2$/, /^penguji 2$/, /anggota penguji ii$/, /penguji kedua/,/^anggota 2$/],supervisor:[/^pembimbing 1$/, /^dosen pembimbing$/, /^pembimbing$/, /^pembimbing skripsi$/],title:[/^judul$/, /judul skripsi/,/topik/]},
      rule:{lecturer:[/^nama dosen$/, /^dosen$/, /^nama penguji$/, /^penguji$/, /^nama$/, /dosen penguji/],date:[/tanggal berhalangan/,/tanggal wajib/,/tanggal prioritas/,/^tanggal$/, /tanggal/,/^tgl$/, /date/],day:[/^hari$/, /hari pilihan/, /hari preferensi/,/day/],session:[/^sesi$/, /waktu sesi/,/^session$/]},
      existing:{student:[/^nama mahasiswa$/, /^mahasiswa$/, /^nama$/],nim:[/^nim$/, /npm/],date:[/^tanggal$/, /tanggal ujian/,/^date$/],session:[/^sesi$/, /^session$/],start:[/^mulai$/, /jam mulai/, /waktu mulai/, /^start$/],end:[/^selesai$/, /jam selesai/, /waktu selesai/, /^end$/],time:[/^waktu$/, /jam ujian/],room:[/^ruang$/, /^ruangan$/, /^room$/],chair:[/^ketua penguji$/, /^ketua$/],member1:[/^anggota penguji 1$/, /^penguji 1$/, /^anggota 1$/],member2:[/^anggota penguji 2$/, /^penguji 2$/, /^anggota 2$/]}
    };
    const patterns=(rules[type]||{})[field]||[];
    for(const p of patterns){const i=norms.findIndex(n=>p.test(n));if(i>=0)return h[i];}return '';
  }
  function get(row,m,k){const key=(m||{})[k];return key?String(row[key]??'').trim():'';}
  function kindOf(s){const t=normKey(s);if(/alih jenjang|alih program|transfer|\baj\b/.test(t))return 'Alih Jenjang';if(/reguler|regular|reg\b/.test(t))return 'Reguler';return '';}
  function stageOf(s){const t=normKey(s);if(/\b(?:2|ii|kedua|dua)\b/.test(t))return 2;if(/\b(?:1|i|pertama|satu)\b/.test(t))return 1;return 0;}
  function makeAliasResolver(panels,aliases={}){
    const canon=new Map();for(const p of panels)for(const n of [...p.examiners,p.supervisor]){const key=normName(n);if(key){if(!canon.has(key))canon.set(key,n);}}
    const manual=new Map(Object.entries(aliases).map(([a,b])=>[normName(a),normName(b)]));
    return {resolve(raw){let key=normName(raw);if(manual.has(key))key=manual.get(key);return key;},names:canon,known(k){return canon.has(k)}};
  }
  function buildPanels(source,m,defaults={}){
    const panels=[],warnings=[];const keys=new Set();let duplicates=0;
    (source.rows||[]).forEach((r,i)=>{
      const name=get(r,m,'student'),nim=get(r,m,'nim');const major=get(r,m,'major');
      const klass=kindOf(get(r,m,'kind'))||kindOf(major)||kindOf(defaults.kind),phase=stageOf(get(r,m,'stage'))||stageOf(get(r,m,'kind'))||stageOf(major)||stageOf(defaults.stage);
      const examiners=[get(r,m,'chair'),get(r,m,'member1'),get(r,m,'member2')];
      const supervisor=get(r,m,'supervisor');const p={id:'p'+(i+1),sourceRow:r._row||i+2,name,nim,major,kind:klass,stage:phase,asp:/\basp\b|akuntansi sektor publik/i.test([major,get(r,m,'kind')].join(' ')),examiners,supervisor,title:get(r,m,'title'),errors:[]};
      if(!name)p.errors.push('Nama mahasiswa kosong');if(!major)p.errors.push('Prodi/bidang kosong: aturan pengecualian ASP tidak dapat diperiksa');if(!klass)p.errors.push('Jenis prodi belum dapat ditentukan (Reguler/Alih Jenjang)');if(!phase)p.errors.push('Tahap belum dapat ditentukan (1/2)');
      examiners.forEach((n,j)=>{if(!n)p.errors.push(['Ketua Penguji','Anggota Penguji 1','Anggota Penguji 2'][j]+' kosong');});
      const clean=examiners.filter(Boolean).map(normName);if(new Set(clean).size!==clean.length)p.errors.push('Ada dosen yang tercantum dua kali dalam satu tim penguji');
      const dup=nim?`n:${nim}`:`s:${normKey(name)}|${normKey(major)}`;
      if(name&&keys.has(dup)){p.errors.push('Mahasiswa/NIM terduplikasi dalam data sumber');duplicates++;}else if(name)keys.add(dup);
      panels.push(p);
    });
    if(duplicates)warnings.push(`${duplicates} baris mahasiswa memiliki NIM/nama yang terduplikasi.`);
    return {panels,warnings};
  }
  function buildRules(source,m,resolver,label){const rules=new Map(),warnings=[],foreign=new Map();
    (source.rows||[]).forEach((r,i)=>{
      const raw=get(r,m,'lecturer'),dateStr=get(r,m,'date'),dayStr=get(r,m,'day'),sesStr=get(r,m,'session');
      if(!raw){warnings.push(`${label} baris ${r._row||i+2}: nama dosen kosong; aturan diabaikan.`);return;}
      const dates=parseDates(dateStr),days=parseWeekdays(dayStr || (!dates.length?dateStr:'')),sessions=parseSessions(sesStr);
      if(label==='Wajib'&&!dates.length){warnings.push(`Wajib baris ${r._row||i+2} (${raw}): tanggal tidak terbaca; aturan diabaikan.`);return;}
      if(!dates.length&&!days.length){warnings.push(`${label} baris ${r._row||i+2} (${raw}): tanggal/hari tidak terbaca; aturan diabaikan.`);return;}
      if(dates.length&&days.length&&dates.some(d=>!days.includes(isoDay(d))))warnings.push(`${label} baris ${r._row||i+2} (${raw}): nama hari tidak sesuai tanggal; tanggal numerik dipakai sebagai acuan.`);
      const key=resolver.resolve(raw);if(!resolver.known(key))foreign.set(raw,key);
      if(!rules.has(key))rules.set(key,[]);
      // Ketika tanggal eksplisit ada, jangan biarkan kesalahan nama hari membatalkan aturan keras.
      // Pada preferensi, tanggal dan hari adalah dua cara alternatif untuk memperoleh nilai prioritas.
      if(dates.length)rules.get(key).push({dates:new Set(dates),days:new Set(),sessions:new Set(sessions),raw,sourceRow:r._row||i+2});
      if(days.length&&(!dates.length||label==='Prioritas'))rules.get(key).push({dates:new Set(),days:new Set(days),sessions:new Set(sessions),raw,sourceRow:r._row||i+2});
    });return {rules,warnings,foreign};
  }
  function ruleMatch(entry,date,session){const day=isoDay(date);return (!entry.dates.size||entry.dates.has(date))&&(!entry.days.size||entry.days.has(day))&&(!entry.sessions.size||entry.sessions.has(session));}
  function lecturerAllowed(key,date,session,blocked,required){if((blocked.get(key)||[]).some(r=>ruleMatch(r,date,session)))return false;const rr=required.get(key);return !rr||rr.some(r=>ruleMatch(r,date,session));}
  function preferenceScore(keys,date,session,preferred){let result=0;for(const key of keys)for(const r of (preferred.get(key)||[])){if(ruleMatch(r,date,session)){result+=r.dates.size?220:80;break;}}return result;}
  function parseClock(t){const m=/(\d{1,2})[:.](\d\d)/.exec(String(t||''));return m?String(+m[1]).padStart(2,'0')+':'+m[2]:null;}
  function minute(t){if(!t)return 0;const x=t.split(':').map(Number);return x[0]*60+x[1];}
  function overlap(a,b){return minute(a.start)<minute(b.end)&&minute(b.start)<minute(a.end);}
  function buildExisting(source,m,resolver){const events=[],warnings=[];
    (source.rows||[]).forEach((r,i)=>{
      const rawDate=get(r,m,'date');const date=parseDate(rawDate);const sn=parseSessions(get(r,m,'session'))[0];const session=sessionsFor(date||'2000-01-01').find(s=>s.no===sn);
      const time=get(r,m,'time'),range=time.split(/\s*[-–—]\s*/);
      const start=parseClock(get(r,m,'start'))||(range.length>=2?parseClock(range[0]):null)||session?.start;
      const end=parseClock(get(r,m,'end'))||(range.length>=2?parseClock(range[1]):null)||session?.end;
      const examinerRaw=[get(r,m,'chair'),get(r,m,'member1'),get(r,m,'member2')].filter(Boolean);
      if(!date||!start||!end||minute(start)>=minute(end)){warnings.push(`Jadwal lain baris ${r._row||i+2}: tanggal/waktu tidak terbaca; baris diabaikan.`);return;}
      if(!examinerRaw.length&&!get(r,m,'room'))warnings.push(`Jadwal lain baris ${r._row||i+2}: penguji dan ruang kosong; tidak memblokir slot.`);
      events.push({id:'x'+(i+1),external:true,sourceRow:r._row||i+2,name:get(r,m,'student')||'Jadwal lain #'+(i+1),nim:get(r,m,'nim'),date,session:sn||0,start,end,room:get(r,m,'room').toUpperCase().replace(/\s/g,''),examiners:examinerRaw,keys:[...new Set(examinerRaw.map(x=>resolver.resolve(x)))],status:[],conflicts:[]});
    });
    // Periksa bentrok yang telah ada di CSV eksternal sehingga tidak tersembunyi dari administrator.
    for(let i=0;i<events.length;i++)for(let j=i+1;j<events.length;j++){
      const a=events[i],b=events[j];if(a.date!==b.date||!overlap(a,b))continue;
      const same=a.keys.filter(k=>b.keys.includes(k));
      if(same.length||a.room&&a.room===b.room)warnings.push(`Jadwal lain sudah bentrok: ${a.name} dengan ${b.name} pada ${fmtDate(a.date)} (${same.length?'penguji sama '+same.join(', '):'ruang sama '+a.room}).`);
    }
    return {events,warnings};
  }
  function requiredObligations(required){const list=[],seen=new Set();for(const [key,entries] of required)for(const r of entries)for(const date of r.dates){const k=key+'|'+date;if(!seen.has(k)){seen.add(k);list.push({key,date,raw:r.raw});}}return list;}
  function allCandidates(p,blocked,required,includeSupervisor){const keys=p.examiners.map(normName);if(includeSupervisor&&p.supervisor&&!keys.includes(normName(p.supervisor)))keys.push(normName(p.supervisor));
    const dates=dateRange(`${p.kind}|${p.stage}`,p.asp);const slots=[];
    for(const date of dates)for(const ss of sessionsFor(date))if(keys.every(k=>lecturerAllowed(k,date,ss.no,blocked,required)))slots.push({date,session:ss.no,start:ss.start,end:ss.end});
    return {keys,slots};
  }
  function seeded(seed){let n=seed>>>0;return function(){n+=0x6D2B79F5;let t=n;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296;};}
  function statusFor(events,panels,blocked,required,external=[],opts={}){
    const byId=new Map(panels.map(p=>[p.id,p]));const combined=[...events,...external];
    const checks=new Map(events.map(e=>[e.id,[]]));
    function flag(e,message){if(checks.has(e.id)&&!checks.get(e.id).includes(message))checks.get(e.id).push(message);}
    for(const e of events){const p=byId.get(e.id);const daySessions=sessionsFor(e.date);const s=daySessions.find(s=>s.no===+e.session);
      if(!p){flag(e,'Mahasiswa tidak ditemukan dalam data sumber');continue;}
      if(!s||s.start!==e.start||s.end!==e.end)flag(e,'Sesi/waktu tidak sesuai ketentuan hari tersebut');
      if(!dateRange(`${p.kind}|${p.stage}`,p.asp).includes(e.date))flag(e,'Tanggal di luar periode atau tanggal terlarang Prodi ASP');
      if(!ROOMS.includes(e.room))flag(e,'Ruangan harus N701–N714');
      for(const key of e.keys||[])if(!lecturerAllowed(key,e.date,+e.session,blocked,required))flag(e,`Dosen ${e.examiners[(e.keys||[]).indexOf(key)]||key} berhalangan atau di luar tanggal wajib`);
    }
    for(let i=0;i<combined.length;i++)for(let j=i+1;j<combined.length;j++){
      const a=combined[i],b=combined[j];if(a.date!==b.date||!overlap(a,b))continue;
      const label=x=>`${x.external?'jadwal lain ':'jadwal '}${x.name} (${fmtDate(x.date)}, ${x.start}–${x.end}, ${x.room||'ruang belum diisi'})`;
      const same=(a.keys||[]).filter(k=>(b.keys||[]).includes(k));
      if(same.length){const names=same.map(k=>a.examiners[(a.keys||[]).indexOf(k)]||k).join(', ');flag(a,`Bentrok penguji (${names}) dengan ${label(b)}`);flag(b,`Bentrok penguji (${names}) dengan ${label(a)}`);}
      if(a.room&&a.room===b.room){flag(a,`Bentrok ruangan ${a.room} dengan ${label(b)}`);flag(b,`Bentrok ruangan ${b.room} dengan ${label(a)}`);}
    }
    const daily=new Map();for(const e of events){for(const k of new Set(e.keys||[])){const dk=k+'|'+e.date;daily.set(dk,(daily.get(dk)||0)+1);}}
    for(const e of events)for(const k of new Set(e.keys||[])){const n=daily.get(k+'|'+e.date);const cap=sessionsFor(e.date).length;if(n>cap)flag(e,`Dosen memiliki ${n} sesi pada hari yang hanya menyediakan ${cap} sesi`);}
    return {checks,daily,conflicts:[...checks].filter(([,v])=>v.length).length};
  }
  function generate(panels,ruleSets,options={}){
    const blocked=ruleSets.blocked||new Map(),required=ruleSets.required||new Map(),preferred=ruleSets.preferred||new Map(),external=options.external||[],includeSupervisor=!!options.includeSupervisor;
    const attempts=Math.min(12,Math.max(1,+(options.attempts||4)));const obligations=requiredObligations(required);
    const fresh=panels.filter(p=>!p.errors.length).map(p=>{const cand=allCandidates(p,blocked,required,includeSupervisor);return {...p,keys:cand.keys,slots:cand.slots};});
    const invalid=panels.filter(p=>p.errors.length).map(p=>({panel:p,reason:p.errors.join('; ')}));
    const existingNim=new Set(external.map(x=>x.nim).filter(Boolean));
    const valid=fresh.filter(p=>!existingNim.has(p.nim));
    for(const p of fresh)if(p.nim&&existingNim.has(p.nim))invalid.push({panel:p,reason:'NIM sudah memiliki jadwal dalam CSV jadwal lain'});
    const withSlots=valid.filter(p=>p.slots.length),noSlots=valid.filter(p=>!p.slots.length);
    noSlots.forEach(p=>invalid.push({panel:p,reason:'Tidak ada tanggal/sesi sesuai periode, larangan, dan tanggal wajib seluruh penguji. Periksa aturan berhalangan dan wajib.'}));
    const freq=new Map();for(const p of withSlots)for(const k of p.keys)freq.set(k,(freq.get(k)||0)+1);
    const byDateReq=new Map();for(const o of obligations){const arr=withSlots.filter(p=>p.keys.includes(o.key)&&p.slots.some(s=>s.date===o.date));byDateReq.set(o.key+'|'+o.date,arr);}
    const obligationWarnings=obligations.filter(o=>!(byDateReq.get(o.key+'|'+o.date)||[]).length).map(o=>`Tanggal wajib ${fmtDate(o.date)} (${o.raw}) tidak dapat dipenuhi: tidak ada mahasiswa dan slot yang cocok dengan semua aturan.`);
    function trial(seed){const rand=seeded(seed),assigned=new Map(),dayLoad=new Map(),dayEvents=new Map(),byDay=new Map(),reqCount=new Map(),roomUse=new Map();
      for(const e of external){if(!dayEvents.has(e.date))dayEvents.set(e.date,[]);dayEvents.get(e.date).push(e);for(const k of new Set(e.keys||[])){const lk=k+'|'+e.date;dayLoad.set(lk,(dayLoad.get(lk)||0)+1);}}
      function list(date){return dayEvents.get(date)||[];}
      function candidate(p,slot,maxPerDay=3,skipId=''){
        if(p.keys.some(k=>(dayLoad.get(k+'|'+slot.date)||0)>=maxPerDay))return null;
        const overlapping=list(slot.date).filter(e=>e.id!==skipId&&overlap(slot,e));
        if(overlapping.some(e=>p.keys.some(k=>(e.keys||[]).includes(k))))return null;
        const busyRooms=new Set(overlapping.map(e=>e.room).filter(Boolean));const rooms=ROOMS.filter(r=>!busyRooms.has(r));if(!rooms.length)return null;
        const room=rooms.sort((a,b)=>(roomUse.get(a)||0)-(roomUse.get(b)||0)||a.localeCompare(b))[0];
        const uncovered=p.keys.filter(k=>obligations.some(o=>o.key===k&&o.date===slot.date)&&(reqCount.get(k+'|'+slot.date)||0)===0).length;
        const pref=preferenceScore(p.keys,slot.date,slot.session,preferred);
        const dayCount=byDay.get(slot.date)||0;const avg=p.keys.reduce((t,k)=>t+(dayLoad.get(k+'|'+slot.date)||0),0);
        const fourth=p.keys.some(k=>(dayLoad.get(k+'|'+slot.date)||0)>=3);
        const score=uncovered*3000+pref*2-dayCount*4-avg*12-(fourth?200:0)+rand()*15;
        return {slot,room,score,uncovered,pref};
      }
      function best(p,maxPerDay=3,dateFilter='') {let best=null;for(const s of p.slots){if(dateFilter&&s.date!==dateFilter)continue;const c=candidate(p,s,maxPerDay);if(c&&(!best||c.score>best.score))best=c;}return best;}
      function add(p,c){const e={id:p.id,name:p.name,nim:p.nim,major:p.major,kind:p.kind,stage:p.stage,asp:p.asp,title:p.title,supervisor:p.supervisor,examiners:p.examiners,keys:p.keys,sourceRow:p.sourceRow,date:c.slot.date,session:c.slot.session,start:c.slot.start,end:c.slot.end,room:c.room};assigned.set(p.id,e);
        if(!dayEvents.has(e.date))dayEvents.set(e.date,[]);dayEvents.get(e.date).push(e);byDay.set(e.date,(byDay.get(e.date)||0)+1);roomUse.set(e.room,(roomUse.get(e.room)||0)+1);
        for(const k of p.keys){const key=k+'|'+e.date;dayLoad.set(key,(dayLoad.get(key)||0)+1);if(obligations.some(o=>o.key===k&&o.date===e.date))reqCount.set(key,(reqCount.get(key)||0)+1);}}
      function del(p){const e=assigned.get(p.id);if(!e)return;assigned.delete(p.id);dayEvents.set(e.date,list(e.date).filter(x=>x.id!==p.id));byDay.set(e.date,(byDay.get(e.date)||0)-1);roomUse.set(e.room,(roomUse.get(e.room)||0)-1);for(const k of p.keys){const key=k+'|'+e.date;dayLoad.set(key,(dayLoad.get(key)||0)-1);if(obligations.some(o=>o.key===k&&o.date===e.date))reqCount.set(key,(reqCount.get(key)||0)-1);}}
      const sorted=[...withSlots].sort((a,b)=>a.slots.length-b.slots.length||b.keys.reduce((s,k)=>s+(freq.get(k)||0),0)-a.keys.reduce((s,k)=>s+(freq.get(k)||0),0)||a.id.localeCompare(b.id));
      // Penuhi setiap tanggal wajib dahulu. Jika dua dosen wajib pada tanggal sama, prioritaskan tim yang menutup dua kewajiban sekaligus.
      for(const o of [...obligations].sort((a,b)=>(byDateReq.get(a.key+'|'+a.date)||[]).length-(byDateReq.get(b.key+'|'+b.date)||[]).length||a.date.localeCompare(b.date))){
        if(reqCount.get(o.key+'|'+o.date))continue;
        const eligible=(byDateReq.get(o.key+'|'+o.date)||[]).filter(p=>!assigned.has(p.id)).sort((a,b)=>a.slots.length-b.slots.length);
        let choice=null;for(const p of eligible){const c=best(p,3,o.date)||best(p,sessionsFor(o.date).length,o.date);if(c&&(!choice||c.uncovered>choice.c.uncovered||(c.uncovered===choice.c.uncovered&&p.slots.length<choice.p.slots.length)))choice={p,c};}
        if(choice)add(choice.p,choice.c);
      }
      for(const p of sorted){if(assigned.has(p.id))continue;const c=best(p,3);if(c)add(p,c);}
      // Empat sesi diperbolehkan hanya jika batas lunak tiga sesi tidak lagi cukup.
      for(const p of sorted){if(assigned.has(p.id))continue;const c=best(p,4);if(c)add(p,c);}
      // Perbaikan satu-langkah: geser satu sidang penghalang ke slot lain, tanpa merusak kewajiban tanggal.
      const idToPanel=new Map(withSlots.map(p=>[p.id,p]));
      for(const p of sorted){if(assigned.has(p.id))continue;let fixed=false;
        for(const slot of p.slots.slice(0,120)){
          if(p.keys.some(k=>(dayLoad.get(k+'|'+slot.date)||0)>=sessionsFor(slot.date).length))continue;
          const overlapping=list(slot.date).filter(e=>overlap(slot,e));const brooms=new Set(overlapping.map(e=>e.room).filter(Boolean));if(brooms.size>=ROOMS.length)continue;
          const conflicting=overlapping.filter(e=>p.keys.some(k=>(e.keys||[]).includes(k)));
          const unique=[...new Set(conflicting.map(e=>e.id))];if(unique.length!==1)continue;
          const old=assigned.get(unique[0]);if(!old)continue;const moving=idToPanel.get(old.id);if(!moving)continue;
          if(moving.keys.some(k=>obligations.some(o=>o.key===k&&o.date===old.date)&&(reqCount.get(k+'|'+old.date)||0)<=1))continue;
          del(moving);
          const can=candidate(p,slot,sessionsFor(slot.date).length);if(can){add(p,can);const reposition=best(moving,3)||best(moving,4);if(reposition){add(moving,reposition);fixed=true;break;}del(p);}
          add(moving,{slot:{date:old.date,session:old.session,start:old.start,end:old.end},room:old.room});
        }
        if(fixed)continue;
      }
      const events=[...assigned.values()].sort((a,b)=>a.date.localeCompare(b.date)||a.session-b.session||a.room.localeCompare(b.room));
      const coverage=obligations.filter(o=>(reqCount.get(o.key+'|'+o.date)||0)>0).length;
      const prefScore=events.reduce((n,e)=>n+preferenceScore(e.keys,e.date,e.session,preferred),0);
      const over3=[...dayLoad].filter(([k,v])=>v>3&&!k.includes('|external')).length;
      return {events,assigned,coverage,prefScore,over3,score:events.length*100000+coverage*4000+prefScore*2-over3*150,reqCount};
    }
    let best=null;for(let t=0;t<attempts;t++){const current=trial(1729+t*9973);if(!best||current.score>best.score)best=current;}
    const events=best.events;const unscheduled=[...invalid,...withSlots.filter(p=>!best.assigned.has(p.id)).map(p=>({panel:p,reason:'Seluruh opsi yang memenuhi aturan telah terpakai oleh jadwal penguji/ruangan atau batas sesi dosen. Coba sesuaikan ketentuan sumber.'}))];
    const unmet=obligations.filter(o=>!(best.reqCount.get(o.key+'|'+o.date)||0)).map(o=>`Kewajiban belum terpenuhi: ${o.raw} pada ${fmtDate(o.date)}.`);
    const audited=statusFor(events,panels,blocked,required,external,{includeSupervisor});
    return {events,unscheduled,warnings:[...obligationWarnings,...unmet],requiredTotal:obligations.length,requiredCovered:best.coverage,preferencePoints:best.prefScore,checks:audited.checks,daily:audited.daily,conflicts:audited.conflicts,attempts};
  }
  function csvRowsForSchedule(events,checks){return events.map(e=>({'Tanggal':fmtDate(e.date),'Tanggal ISO':e.date,'Sesi':e.session,'Waktu':`${e.start} - ${e.end}`,'Ruangan':e.room,'NIM':e.nim,'Mahasiswa':e.name,'Prodi':e.major,'Jenis Prodi':e.kind,'Tahap':e.stage,'Judul':e.title,'Ketua Penguji':e.examiners[0],'Anggota Penguji 1':e.examiners[1],'Anggota Penguji 2':e.examiners[2],'Status':(checks.get(e.id)||[]).length?'BENTROK':'AMAN','Keterangan Bentrok':(checks.get(e.id)||[]).join(' | ')}));}
  return {ROOMS,WINDOWS,ASP_BLACKOUT,MONTHS,DAYS,normKey,normName,ymd,isoDay,addDay,fmtDate,expandRange,parseDate,parseDates,parseWeekdays,parseSessions,sessionsFor,dateRange,csvParse,csvExport,inferHeader,kindOf,stageOf,makeAliasResolver,buildPanels,buildRules,buildExisting,requiredObligations,lecturerAllowed,allCandidates,preferenceScore,minute,overlap,statusFor,generate,csvRowsForSchedule};
});
