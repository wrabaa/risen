// RISEN app shell: data in memory, Home, tabs, Settings, backup, updates. The tabs live in gym.js, meds.js, classes.js, meals.js;
// helpers every file uses are in shared.js.
  const intro=$('intro'), app=$('app');

  // ---- Data: lives in IndexedDB (db.js). This is an in-memory copy for drawing the screens. ----
  const S={settings:{name:'',nameAsked:false,restSec:90},routines:[],workouts:[],sessions:[],exercises:[],meds:[],medlogs:[],classes:[],instructors:[],classlogs:[],recipes:[]};
  async function load(){
    [S.settings,S.routines,S.workouts,S.sessions,S.exercises]=await Promise.all([RisenDB.getSettings(),RisenDB.all('routines'),
      RisenDB.all('workouts'),RisenDB.all('sessions'),RisenDB.all('exercises')]);
    [S.meds,S.medlogs]=await Promise.all([RisenDB.all('meds'),RisenDB.all('medlogs')]);
    [S.classes,S.instructors,S.classlogs]=await Promise.all([RisenDB.all('classes'),RisenDB.all('instructors'),RisenDB.all('classlogs')]);
    S.recipes=await RisenDB.all('recipes');
  }

  // ---- Schedule helpers ----
  const dayKey=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  const isoDay=d=>(d.getDay()+6)%7+1;                       // 1=Mon … 7=Sun
  const activeRoutine=()=>S.routines.find(r=>r.status==='active')||null;
  function routineOn(d){                                    // the routine that was active on that date
    const k=dayKey(d);
    return S.routines.find(r=>dayKey(new Date(r.created))<=k&&(!r.archived||dayKey(new Date(r.archived))>k))||null;
  }
  const wTitle=w=>typeof workoutTitle==='function'?workoutTitle(w):w.name;   // "Chest · Triceps" (gym.js)
  function plannedOn(d){ // workouts scheduled that day, earliest first (a day's plan only counts from the date it got exercises)
    const r=routineOn(d), k=dayKey(d); if(!r) return [];
    return S.workouts.filter(w=>w.routineId===r.id&&(w.days||[]).includes(isoDay(d))&&(w.exercises||[]).length&&(!w.since||w.since<=k))
      .sort((a,b)=>(a.time||'99').localeCompare(b.time||'99')||(a.order||0)-(b.order||0));
  }
  const doneIds=d=>new Set(S.sessions.filter(x=>x.date===dayKey(d)&&x.finishedAt&&!x.extra).map(x=>x.workoutId));
  const skippedIds=d=>new Set(S.sessions.filter(x=>x.date===dayKey(d)&&x.skipped).map(x=>x.workoutId));
  // Planned workouts finished that day whose day plan has changed since (emptied, refilled, other program): a workout that
  // was done stays done, whatever happens to the plan afterwards.
  const keptDone=(list,ids)=>{const p=new Set(list.map(w=>w.id)); return [...ids].filter(id=>!p.has(id)).length};
  function weekDays(){ // Monday to Sunday of this week
    const t=new Date(); t.setHours(0,0,0,0); const mon=new Date(t); mon.setDate(t.getDate()-isoDay(t)+1);
    return [...Array(7)].map((_,i)=>{const d=new Date(mon); d.setDate(mon.getDate()+i); return d});
  }
  function streak(){ // planned sessions done in a row, counting back from today (today doesn't break it if not done yet)
    let n=0; const d=new Date(); d.setHours(0,0,0,0);   // a skipped session (with a reason) neither counts nor breaks it
    for(let i=0;i<730;i++,d.setDate(d.getDate()-1)){
      const ids=doneIds(d), sk=skippedIds(d);
      const list=plannedOn(d); n+=keptDone(list,ids);
      for(const w of list.reverse()){ if(ids.has(w.id)) n++; else if(sk.has(w.id)) continue; else if(i>0) return n; }
    }
    return n;
  }

  // ---- Tiles: add a new tile by adding an entry here ----
  const PLAY=ICONS.play;
  const TILES=[
    {title:'Training', tap:'today', html(){          // the whole tile opens today's day in Gym
      const today=new Date(), day=`<div class="wname">${today.toLocaleDateString('en-GB',{weekday:'long'})}</div>`, go=`<span class="play" aria-hidden="true">${PLAY}</span>`;
      if(S.settings.activeSession) return `<div>${day}<div class="sub">Workout in progress</div></div>${go}`;
      if(!activeRoutine()) return `<div>${day}<div class="sub">No program yet · tap to build it</div></div>`;
      const list=plannedOn(today), ids=doneIds(today), sk=skippedIds(today);
      if(!list.length) return `<div>${day}<div class="sub">Rest day</div></div>`;
      const w=list.find(x=>!ids.has(x.id)&&!sk.has(x.id));
      if(!w){ const doneL=list.filter(x=>ids.has(x.id));
        return `<div>${day}<div class="sub">${doneL.length?'Done today ✓ · '+doneL.map(x=>esc(wTitle(x))).join(' · '):'Skipped today'}</div></div>`; }
      const n=(w.exercises||[]).length;
      return `<div>${day}<div class="sub">${esc(wTitle(w))} · ${n} exercise${n===1?'':'s'}</div></div>${go}`;
    }},
    {title:'This week', stack:true, html(){
      const days=weekDays(), today=dayKey(new Date());
      let plannedN=0, doneN=0;
      const dots=days.map(d=>{
        const sk=skippedIds(d), list=plannedOn(d).filter(w=>!sk.has(w.id)), ids=doneIds(d), kept=keptDone(list,ids), dn=list.filter(w=>ids.has(w.id)).length+kept, all=list.length+kept;
        plannedN+=all; doneN+=dn;
        const cls=[all?'plan':'', all&&dn===all?'done':'', dayKey(d)===today?'today':''].join(' ');
        return `<span class="${cls}">${'MTWTFSS'[isoDay(d)-1]}</span>`;
      }).join('');
      return `<div><div class="big">${doneN}<small>/${plannedN}</small></div><div class="sub">Workouts done</div></div><div class="days">${dots}</div>`;
    }},
    {title:'Streak', html(){
      const n=streak();
      return `<div><div class="big">${n}</div><div class="sub">Planned workout${n===1?'':'s'} in a row</div></div>`;
    }},
    {title:'Supps', tap:'meds', html(){ // the whole tile opens the SUPPS tab (meds.js)
      if(typeof Meds==='undefined') return '';
      const s=Meds.summary();
      if(!s.hasMeds) return `<div><div class="wname">Nothing added yet</div><div class="sub">Add them in Supps</div></div><button class="ghost" data-tab="meds">ADD</button>`;
      if(!s.total) return `<div><div class="wname">No doses today</div><div class="sub">Nothing scheduled</div></div>`;
      if(s.taken===s.total) return `<div><div class="wname">All done today ✓</div><div class="sub">${s.taken} of ${s.total} taken</div></div>`;
      return `<div><div class="wname">${s.taken} of ${s.total} taken today</div><div class="sub">Next: ${esc(s.next.m.name)} · ${esc(s.next.t)}</div></div>`;
    }},
    {title:'Classes', tap:'classes', html(){        // the whole tile opens today's classes
      if(typeof Classes==='undefined') return '';
      if(!S.classes.length) return `<div><div class="wname">No classes yet</div><div class="sub">Add them in Classes</div></div>`;
      const n=Classes.next();
      if(n.none) return `<div><div class="wname">${n.none==='today'?'No classes today':'No more classes today'}</div></div>`;
      return `<div><div class="wname">${n.star?`<span class="tstar" aria-label="My class">${ICONS.star}</span>`:''}${n.now?'Now':'Next'}: ${esc(n.c.name)}</div><div class="sub">${esc(n.c.time)} · ${esc(n.i?n.i.name.split(' ')[0]:'TBA')}</div></div>${Classes.avatar(n.i)}`;
    }},
    {title:'Week summary', stack:true, html(){ // this week (Mon–Sun) at a glance: all three sections in one line
      const wk=weekDays(), a=dayKey(wk[0]), b=dayKey(wk[6]), inWeek=k=>k>=a&&k<=b;
      const workouts=S.sessions.filter(x=>x.finishedAt&&inWeek(x.date)).length;       // every finished workout, extra ones too
      const m=typeof Meds==='undefined'?{taken:0,total:0}:Meds.week();                // doses due up to today
      const classes=S.classlogs.filter(l=>inWeek(l.date)).length;
      return `<div class="stats"><div><b>${workouts}</b><span>Workouts</span></div><div><b>${m.taken}<small>/${m.total}</small></b><span>Supps</span></div><div><b>${classes}</b><span>Classes</span></div></div>`;
    }},
  ];
  // Quiet backup reminder: shows when there's a plan and the last export is missing or older than 7 days
  function renderBackupLine(){
    const last=S.settings.lastExport, days=last?Math.floor((Date.now()-new Date(last))/864e5):null, el=$('backupLine');
    el.hidden=!activeRoutine()||(days!=null&&days<7);
    el.innerHTML=(days==null?'No backup yet':`Last backup: ${days} days ago`)+' · <u>Back up</u>';
  }
  let homeDrawn=false;
  function renderHome(){
    renderBackupLine();
    $('hello').textContent=S.settings.name?'Hello '+S.settings.name:'Hello';
    $('today').textContent=new Date().toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long'});
    $('tiles').classList.toggle('still',homeDrawn); homeDrawn=true;      // the entrance animation plays once, not at every refresh
    $('tiles').innerHTML=TILES.map((t,i)=>`<article class="tile"${t.tap?` data-tap="${t.tap}" role="button" tabindex="0"`:''}><div class="tile-head"><b>${String(i+1).padStart(2,'0')}</b>${t.title}</div>
      <div class="tile-body${t.stack?' stack':''}">${t.html()}</div></article>`).join('');
  }

  // ---- Tabs ----
  function show(view){
    const wasHome=!$('view-home').hidden;
    document.querySelectorAll('.view').forEach(v=>v.hidden=v.id!=='view-'+view);
    if(view!=='classes') $('clsSheet').hidden=true; // the Classes question belongs to the Classes tab only
    if(view==='home'&&!wasHome) renderHome();
    if(view==='home') applyUpdate(); // a new release that arrived while you were busy loads now
    const tabs=[...document.querySelectorAll('.tab')]; tabs.forEach(t=>t.setAttribute('aria-selected',t.dataset.view===view));
    $('tabbar').style.setProperty('--i',Math.max(0,tabs.findIndex(t=>t.dataset.view===view)));          // the glass pill slides to the active tab
  }
  document.querySelector('.tabbar').onclick=e=>{const t=e.target.closest('.tab'); if(!t) return; if(t.dataset.view==='gym') Gym.open(); else if(t.dataset.view==='meds') Meds.open(); else if(t.dataset.view==='classes') Classes.open(); else if(t.dataset.view==='meals') Meals.open(); else show(t.dataset.view)};
  // The floating tab bar steps aside while a text field is focused (keyboard up), and comes back when the focus is gone.
  { const field=e=>e.target.matches&&e.target.matches('input:not([type=file]):not([type=checkbox]):not([type=radio]):not([type=button]),textarea,select');
    document.addEventListener('focusin',e=>{ if(field(e)) document.body.classList.add('typing'); });
    document.addEventListener('focusout',()=>setTimeout(()=>{ const a=document.activeElement; if(!(a&&a.matches&&a.matches('input,textarea,select'))) document.body.classList.remove('typing'); },120)); }
  $('tiles').onclick=e=>{
    const m=e.target.closest('[data-tab]'); if(m) return Meds.open();
    if(e.target.closest('[data-tap="today"]')) Gym.openToday();
    if(e.target.closest('[data-tap="classes"]')) Classes.openToday();
    if(e.target.closest('[data-tap="meds"]')) Meds.open();
  };
  $('tiles').onkeydown=e=>{ if((e.key==='Enter'||e.key===' ')&&e.target.matches('[data-tap]')){ e.preventDefault(); e.target.click(); } };

  // ---- Name: asked once, on first ENTER. Skip = no name, greeting says just "Hello" ----
  async function closeName(name){
    S.settings.name=(name||'').trim(); S.settings.nameAsked=true;
    $('nameInput').blur(); $('nameSheet').hidden=true; renderHome();
    await RisenDB.setSetting('name',S.settings.name); await RisenDB.setSetting('nameAsked',true);
  }
  $('nameForm').onsubmit=e=>{e.preventDefault(); closeName($('nameInput').value)};
  $('nameSkip').onclick=()=>closeName('');

  // ---- ENTER: intro to Home (intro shows only when the app opens) ----
  // If the phone's storage can't be opened, the app must not look empty (that reads as "my data is gone"): a full-screen
  // message says the data is still there and offers to try again. Nothing else runs, so nothing can be saved over it.
  let loaded=false;
  const ready=RisenDB.init().then(load).then(()=>{loaded=true}).catch(e=>{
    console.error(e);
    $('storageWhy').textContent=(e&&e.message)||'Unknown error';
    $('storageFail').hidden=false;
    return new Promise(()=>{}); // never continues
  });
  $('storageRetry').onclick=()=>location.reload();
  // Back to the front (from another app, or the phone was unlocked): Home shows the current day, doses and next class
  document.addEventListener('visibilitychange',()=>{
    if(document.visibilityState==='visible'&&loaded&&!app.classList.contains('hidden')&&!$('view-home').hidden) renderHome();
  });
  $('login').onclick=async()=>{
    await ready; renderHome(); show('home');
    intro.classList.add('hidden'); app.classList.remove('hidden');
    if(!S.settings.nameAsked){ $('nameSheet').hidden=false; setTimeout(()=>$('nameInput').focus(),350); }
    else backupPrompt();
  };

  // ---- Settings ----
  const fmtRest=s=>Math.floor(s/60)+':'+String(s%60).padStart(2,'0');
  function toast(msg){const t=$('toast'); t.textContent=msg; t.classList.add('show'); clearTimeout(toast.t); toast.t=setTimeout(()=>t.classList.remove('show'),2600)}
  function openSettings(){
    $('setName').value=S.settings.name;
    $('restVal').textContent=fmtRest(S.settings.restSec);
    $('settings').classList.add('open'); $('settings').setAttribute('aria-hidden','false'); $('settings').scrollTop=0;
    showVersion();                                  // look again each time Settings opens
  }
  function closeSettings(){
    $('setName').blur(); $('settings').classList.remove('open'); $('settings').setAttribute('aria-hidden','true'); renderHome(); applyUpdate();
  }
  $('gearBtn').onclick=openSettings;
  $('settingsBack').onclick=closeSettings;
  $('setName').oninput=()=>{S.settings.name=$('setName').value.trim(); RisenDB.setSetting('name',S.settings.name).then(()=>savedFlash('setSaved'))};
  $('setName').onkeydown=e=>{if(e.key==='Enter') $('setName').blur()};
  const stepRest=d=>{S.settings.restSec=Math.min(600,Math.max(15,S.settings.restSec+d)); $('restVal').textContent=fmtRest(S.settings.restSec);
    RisenDB.setSetting('restSec',S.settings.restSec).then(()=>savedFlash('setSaved'))};
  $('restMinus').onclick=()=>stepRest(-15);
  $('restPlus').onclick=()=>stepRest(15);
  $('viewIntro').onclick=()=>{
    $('settings').classList.remove('open'); $('settings').setAttribute('aria-hidden','true');
    app.classList.add('hidden'); intro.classList.remove('hidden');
  };

  // ---- Clear all classes (changing gym): classes, instructors and attendance; the gym workouts stay ----
  // ---- Reload gym schedule: schedule classes go back to the latest file; attendance and your own classes stay ----
  $('reloadClasses').onclick=async()=>{
    if(!(await ask({title:'Reload gym schedule?',text:'Classes from the gym schedule go back to the latest version (name, day, time, studio, instructor). Your attendance history, your notes and the classes you added yourself are kept.',ok:'RELOAD'}))) return;
    let r; try{ r=await Classes.reloadSchedule(); }catch(e){ toast('Could not reload: '+e.message); return; }
    renderHome();
    const extra=[r.added?r.added+' new':'', r.removed?r.removed+' removed':''].filter(Boolean).join(', ');
    toast('Schedule reloaded: '+r.total+' classes'+(extra?' ('+extra+')':''));
  };
  $('clearClasses').onclick=async()=>{
    if(!(await ask({title:'Delete all classes?',text:'Deletes all classes, instructors and attendance. Use this when you change gym. Your workouts are not affected.',ok:'DELETE ALL CLASSES',danger:true}))) return;
    try{ await RisenDB.clearClasses(); }catch(e){ toast('Could not clear: '+e.message); return; }
    await load(); Classes.reset(); renderHome(); toast('Classes cleared');
  };

  // ---- Reset all data: suggest export, confirm twice, back to first launch ----
  $('resetBtn').onclick=()=>{$('resetSheet').hidden=false};
  $('resetCancel').onclick=()=>{$('resetSheet').hidden=true};
  $('resetExport').onclick=()=>doExport();
  $('resetGo').onclick=async()=>{
    if(!(await ask({title:'Last check',text:"Delete everything on this phone? This can't be undone.",ok:'DELETE EVERYTHING',danger:true}))) return;
    try{ await RisenDB.resetAll(); }catch(e){ toast('Reset failed: '+e.message); return; }
    $('resetSheet').hidden=true; Gym.reset(); await load(); renderHome();
    $('settings').classList.remove('open'); $('settings').setAttribute('aria-hidden','true');
    app.classList.add('hidden'); intro.classList.remove('hidden'); toast('All data deleted');
  };

  // ---- Backup: export to a file, import from a file ----
  async function exported(){ S.settings.lastExport=new Date().toISOString(); await RisenDB.setSetting('lastExport',S.settings.lastExport); renderHome(); }
  $('backupLine').onclick=()=>doExport();
  // The backup date is saved ONLY when the phone confirms the file went out (share sheet finished). If the share sheet
  // can't open (it only opens right after a tap, and preparing a big backup can take too long), the prepared file is
  // kept for two minutes so the next tap on Export opens the share sheet at once.
  let readyBackup=null; // {file, at}
  async function shareBackup(file){ // 'done' | 'cancel' | 'fail'
    try{ await navigator.share({files:[file]}); return 'done'; }
    catch(e){ return e&&e.name==='AbortError'?'cancel':'fail'; }
  }
  async function buildBackup(){ // the file is put together piece by piece (db.js), so many photos don't overload the phone
    const blob=await RisenDB.exportBlob();
    return {blob, file:new File([blob],'risen-backup-'+dayKey(new Date())+'.json',{type:'application/json'})};
  }
  const canShareFile=f=>{ try{ return !!(navigator.canShare&&navigator.canShare({files:[f]})); }catch(e){ return false; } };
  // Weekly "Back up now?" when the app is opened: only if there is something to lose, the last backup is a week old (or
  // missing) and the question was not asked in the last 7 days. The file is prepared while the question is on screen,
  // so one tap on BACK UP NOW opens the share sheet.
  async function backupPrompt(){
    const has=S.workouts.length||S.sessions.length||S.meds.length||S.recipes.length||S.classlogs.length;
    if(!has||S.settings.activeSession) return;
    const age=iso=>iso?Math.floor((Date.now()-new Date(iso))/864e5):null, last=age(S.settings.lastExport), asked=age(S.settings.backupAsked);
    if((last!=null&&last<7)||(asked!=null&&asked<7)) return;
    S.settings.backupAsked=new Date().toISOString(); RisenDB.setSetting('backupAsked',S.settings.backupAsked);
    buildBackup().then(({file})=>{ if(canShareFile(file)) readyBackup={file,at:Date.now()}; }).catch(()=>{});
    const yes=await ask({title:'Back up now?',text:(last==null?'You have no backup yet.':'Your last backup was '+last+' days ago.')+' Everything is stored only on this phone.',ok:'BACK UP NOW',cancel:'Later'});
    if(yes) doExport();
  }
  async function doExport(){
    if(readyBackup&&Date.now()-readyBackup.at<120000){ // second tap: the file is ready, share straight away
      const f=readyBackup.file; readyBackup=null;
      const r=await shareBackup(f);
      if(r==='done') await exported(); else if(r==='fail') toast('Backup not saved. Try again.');
      return;
    }
    readyBackup=null;
    let blob, file; try{ ({blob,file}=await buildBackup()); }
    catch(e){ toast('Backup not saved: '+e.message); return; }
    const name=file.name;
    if(canShareFile(file)){ // iPhone: Save to Files
      const r=await shareBackup(file);
      if(r==='done') await exported();
      else if(r==='fail'){ readyBackup={file,at:Date.now()}; toast('Backup is ready. Tap Export backup again to save it.'); }
      return;
    }
    // No share sheet (a computer's browser): plain download
    const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=name; document.body.appendChild(a); a.click();
    setTimeout(()=>{URL.revokeObjectURL(a.href); a.remove()},1000); toast('Backup saved'); await exported();
  }
  $('exportBtn').onclick=doExport;
$('importBtn').onclick=()=>{$('importFile').value=''; $('importFile').click()};
  $('importFile').onchange=async()=>{
    const f=$('importFile').files[0]; if(!f) return;
    let b; try{ b=JSON.parse(await f.text()) }catch(e){ toast('That file is not a RISEN backup'); return; }
    if(!b||b.app!=='RISEN'){ toast('That file is not a RISEN backup'); return; }
    const when=b.exported?new Date(b.exported).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}):'an earlier date';
  // Say what is in the file before anything is replaced
  const st=b.stores||{}, cnt=k=>Array.isArray(st[k])?st[k].length:0, plural=(n,w)=>n+' '+w+(n===1?'':w.endsWith('s')?'es':'s');
  const old=b.format===1;
  const inside=old?'':[[cnt('workouts'),'gym day'],[cnt('sessions'),'workout'],[cnt('meds'),'med'],[cnt('classes'),'class'],[cnt('recipes'),'recipe'],[cnt('photos'),'photo']]
    .filter(x=>x[0]).map(x=>plural(x[0],x[1])).join(', ');
  // One RISEN sheet: what is in the file, and a way to save what is on the phone first
  if(old){
    if(!(await ask({title:'Old backup',text:'This backup from '+when+' only holds your name and rest timer. Restore those? Everything else on this phone stays as it is.',ok:'RESTORE'}))) return;
  }else{
    const text='Backup from '+when+'.\n'+(inside?'In this file: '+inside+'.':'This backup is empty.')+'\n\nEverything on this phone will be replaced by it.';
    for(;;){
      const r=await ask({title:'Replace everything?',text,extra:'EXPORT FIRST',ok:'REPLACE EVERYTHING',danger:true});
      if(r==='extra'){ await doExport(); continue; }   // saves what is on the phone now, then asks again
      if(!r) return; break;
    }
  }
  let res; try{ res=await RisenDB.importAll(b); }catch(e){ toast(e.message==='Not a RISEN backup'?'That file is not a RISEN backup':e.message); return; }
  await load(); await Gym.followLibrary({force:true}); await Classes.matchSeed(); // an older backup follows the current exercise list and class ids
    openSettings(); renderHome(); toast(res&&res.settingsOnly?'Name and rest timer restored':'Backup restored');
};

if('serviceWorker' in navigator){
    // Check for a new release on launch and each time the app comes back to the foreground
    navigator.serviceWorker.register('sw.js',{updateViaCache:'none'}).then(reg=>{
      document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')reg.update()});
    });
    // When a new release takes over, reload once so the new files show, but never in the middle of something:
    // see applyUpdate() below.
    if(navigator.serviceWorker.controller) navigator.serviceWorker.addEventListener('controllerchange',()=>{ updateWaiting=true; applyUpdate(); });
  }
  // A new release reloads the app only on the intro, or on Home with nothing open and no keyboard up. Anywhere else
  // (a workout, an editor, Settings, a pop-up) it waits until you are back on Home, or until the app is next opened.
  let updateWaiting=false, reloading=false;
  function quietNow(){
    if(!intro.classList.contains('hidden')) return true;
    if($('view-home').hidden) return false;
    if(document.querySelector('.subpage.open,#settings.open,.sheet-wrap:not([hidden]),.pviewer.open')) return false;
    const a=document.activeElement; return !(a&&/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName));
  }
  function applyUpdate(){ if(!updateWaiting||reloading||!quietNow()) return; reloading=true; location.reload(); }
  // ---- Install pop-up ----
  // Opened in a browser instead of from the home-screen icon? On iPhone/iPad a Safari tab and the home-screen app keep SEPARATE
  // data, so anything entered in the wrong one looks "missing" in the other. A pop-up shows how to install RISEN:
  //   iPhone/iPad -> 3 illustrated steps (Share -> Add to Home Screen -> open the icon)
  //   Android, and Chrome/Edge on a computer -> one INSTALL RISEN button (the browser's own install prompt)
  //   anything else (no way to install) -> nothing
  // x closes it for this visit. Never shown in the home-screen app.
  const installEnv=(nav=navigator)=>({
    ios:/iPhone|iPad|iPod/.test(nav.userAgent)||(/Macintosh/.test(nav.userAgent)&&nav.maxTouchPoints>1), // an iPad says "Macintosh"
    app:nav.standalone===true||(window.matchMedia&&matchMedia('(display-mode: standalone)').matches)
  });
  let installEvent=null;
  const installClosed=()=>{ try{ return sessionStorage.getItem('risenInstallHide')==='1'; }catch(e){ return false; } };
  const SHARE_ICON='<svg class="icon" viewBox="0 0 24 24"><path d="M12 15V3M8 7l4-4 4 4M7 10H6a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2h-1"/></svg>';
  const PLUS_ICON='<svg class="icon" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="3"/><path d="M12 8v8M8 12h8"/></svg>';
  function installHtml(kind){
    const x='<button class="sheet-x" type="button" data-install="x" aria-label="Close"><svg class="icon" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg></button>';
    if(kind==='prompt') return x+'<h2>Install RISEN</h2><p>Put RISEN on your home screen. It opens like an app and works without internet.</p>'
      +'<button class="primary" type="button" data-install="go">INSTALL RISEN</button>';
    const step=(n,ill,title,sub)=>`<li class="istep"><div class="ill">${ill}</div><div class="itxt"><b class="inum">${n}</b><strong>${title}</strong><span>${sub}</span></div></li>`;
    return x+'<h2>Add RISEN to your home screen</h2><p>Do this once. Then RISEN opens like an app and works without internet.</p><ol class="isteps">'
      +step(1,`<div class="ill-bar"><i></i><i></i><span class="ill-hot">${SHARE_ICON}</span><i></i><i></i></div>`,'Tap the Share button','The square with an arrow, in the bar at the bottom or top of the page.')
      +step(2,`<div class="ill-row"><span>Add to Home Screen</span>${PLUS_ICON}</div>`,'Tap Add to Home Screen','Scroll down the list if you do not see it. Then tap Add.')
      +step(3,'<div class="ill-icon"><img src="assets/icon-180.png" alt=""><span>RISEN</span></div>','Open RISEN from its icon','Always use the icon, not Safari. Your data lives in the app.')
      +'</ol>';
  }
  function showInstall(kind){ $('installBody').innerHTML=installHtml(kind); $('installBody').dataset.kind=kind; $('installSheet').hidden=false; }
  function hideInstall(){ $('installSheet').hidden=true; $('installBody').innerHTML=''; }
  function closeInstall(){ try{ sessionStorage.setItem('risenInstallHide','1'); }catch(e){} hideInstall(); }
  function installKind(env=installEnv()){ if(env.app) return null; if(env.ios) return 'ios'; return installEvent?'prompt':null; }
  $('installSheet').addEventListener('click',async e=>{
    const t=e.target.closest('[data-install]');
    if(t&&t.dataset.install==='go'){
      const ev=installEvent; installEvent=null; if(!ev) return closeInstall();
      try{ await ev.prompt(); await ev.userChoice; }catch(err){}
      return hideInstall();                                   // installed or declined: the browser has had its say
    }
    if(t||e.target===$('installSheet')) closeInstall();       // x, or a tap outside the pop-up
  });
  addEventListener('beforeinstallprompt',e=>{ e.preventDefault(); installEvent=e; if(!installClosed()&&installKind()==='prompt') showInstall('prompt'); });
  addEventListener('appinstalled',()=>{ installEvent=null; hideInstall(); });
  { const k=installKind(); if(k==='ios'&&!installClosed()) setTimeout(()=>{ if(!installClosed()) showInstall('ios'); },700); }

  // The installed version (small text at the bottom of Settings), to confirm an update arrived. It was sometimes empty in the
  // home-screen app, so it no longer depends on one thing: the cache name is shown at once (fallback), and the running service
  // worker is asked "which version are you?" and its answer, when it comes, replaces it.
  // It shows the version that is RUNNING (the code this page was loaded with), not the newest one that has been downloaded: it is
  // read once, at start, before any update can arrive, and kept. (While an update waits for a quiet moment the worker is already
  // the new one, so asking it later would run ahead of the screens.)
  let runningVersion=null;
  async function showVersion(){
    const el=$('version'), set=v=>{ if(v) el.textContent='v'+v; };
    if(runningVersion) return set(runningVersion);
    let cacheV=null;
    try{ const k=(await caches.keys()).find(n=>n.startsWith('risen-')); if(k){ cacheV=k.slice(6); set(cacheV); } }catch(e){}   // fallback: the cache name
    let said=null;
    try{
      if('serviceWorker' in navigator){
        const sw=navigator.serviceWorker.controller||(await navigator.serviceWorker.ready).active;
        if(sw) said=await new Promise(res=>{ const ch=new MessageChannel(); ch.port1.onmessage=e=>res(e.data&&e.data.version); sw.postMessage('version',[ch.port2]); setTimeout(()=>res(null),3000); });
      }
    }catch(e){}
    set(said);
    runningVersion=said||cacheV;     // fixed from now on (nothing found: stays empty and is tried again)
  }
  showVersion();
