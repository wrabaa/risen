// MUSIC (.112, Siza's Home only): his own songs (Suno), picked from the Files app and kept on the phone (db.js `songs` / `songdata`). One audio player for the whole app;
// the Home card (app.js) only draws what this says. Nothing here goes to the internet or into the backup.
const Music=(()=>{
  const MAX=30*1024*1024, EXT=/\.(mp3|m4a|aac|wav|ogg|flac|mp4)$/i;
  const audio=new Audio(); audio.preload='auto';
  let list=[], order=[], idx=-1, url=null, ready=false, loading=false, startSeq=0, pre=null, cfg={shuffle:()=>true,setShuffle:()=>{}};
  const subs=[], tickSubs=[];
  const emit=()=>subs.forEach(f=>{ try{f();}catch(e){} });
  const cur=()=>list.find(s=>s.id===order[idx])||null;
  const shuffled=a=>{ a=a.slice(); for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; };
  function build(firstId){                                    // the play order; the current song (or the one asked for) goes first
    const ids=list.map(s=>s.id), rest=ids.filter(i=>i!==firstId);
    order=firstId?[firstId].concat(cfg.shuffle()?shuffled(rest):rest):(cfg.shuffle()?shuffled(ids):ids); idx=order.length?0:-1;
  }
  async function load(){
    if(loading) return; loading=true;
    try{ list=(await RisenDB.songs()).sort((a,b)=>String(a.added).localeCompare(String(b.added))); }catch(e){ list=[]; }
    ready=true; loading=false; if(!cur()){ order=[]; idx=-1; } emit();
  }
  async function start(){                                      // load the song at `idx` into the player and play it
    const s=cur(); if(!s) return;
    const my=++startSeq;                                       // two quick taps: only the LAST one may start a song
    let blob=null; try{ blob=await RisenDB.songBlob(s.id); }catch(e){}
    if(my!==startSeq) return;
    if(!blob){ emit(); return; }
    playUrl(s,URL.createObjectURL(blob));
  }
  function playUrl(s,u){                                       // everything here runs at once (no waiting): the phone only lets a locked screen go on with the next song if play() is called straight away
    if(url) URL.revokeObjectURL(url); url=u; audio.src=u; audio.play().catch(()=>{});
    media(s); emit(); prefetch();
  }
  const nextIdx=()=>order.length?(idx+1)%order.length:-1;
  function dropPre(){ if(pre){ URL.revokeObjectURL(pre.url); pre=null; } }
  async function prefetch(){                                   // while a song plays, the NEXT one is already read from the database
    const ni=nextIdx(); if(ni<0) return; const id=order[ni];
    if(pre&&pre.id===id) return; dropPre();
    let blob=null; try{ blob=await RisenDB.songBlob(id); }catch(e){}
    const again=nextIdx(); if(!blob||again<0||order[again]!==id) return;           // the order changed meanwhile: forget it
    dropPre(); pre={id,url:URL.createObjectURL(blob)};
  }
  async function reset(){                                      // after "Reset all data": stop, forget the songs, read the (now empty) list
    startSeq++; dropPre(); audio.pause(); audio.removeAttribute('src'); audio.load(); if(url){ URL.revokeObjectURL(url); url=null; }
    list=[]; order=[]; idx=-1; ready=false; await load();
  }
  function media(s){                                           // the lock-screen / control-centre card (where the phone allows it)
    if(!('mediaSession' in navigator)) return;
    try{ navigator.mediaSession.metadata=new MediaMetadata({title:s.name,artist:'RISEN'});
      navigator.mediaSession.setActionHandler('play',()=>toggle()); navigator.mediaSession.setActionHandler('pause',()=>toggle());
      navigator.mediaSession.setActionHandler('nexttrack',()=>next()); navigator.mediaSession.setActionHandler('previoustrack',()=>prev()); }catch(e){}
  }
  function toggle(){
    if(!list.length) return;
    if(idx<0||!cur()){ build(); return start(); }
    if(audio.paused){ audio.play().catch(()=>{}); } else audio.pause();
  }
  function next(){
    if(!list.length) return;
    if(!order.length||idx<0){ build(); return start(); }
    const ni=nextIdx();
    if(pre&&pre.id===order[ni]){ idx=ni; startSeq++; const u=pre.url; pre=null; playUrl(cur(),u); return; }        // the next song is ready: start it at once
    idx=ni; return start();
  }
  function prev(){ if(!list.length) return; if(audio.currentTime>3&&cur()){ audio.currentTime=0; return; } if(!order.length||idx<0) build(); else idx=(idx-1+order.length)%order.length; return start(); }
  function setShuffle(on){ cfg.setShuffle(on); const c=cur(); if(c){ build(c.id); dropPre(); prefetch(); } emit(); }
  async function add(files){
    let added=0, skipped=0, failed=0;
    for(const f of files){
      if(!(f.type&&f.type.startsWith('audio/'))&&!EXT.test(f.name)){ skipped++; continue; }
      if(f.size>MAX){ skipped++; continue; }
      try{ await RisenDB.addSong({id:'s-'+Date.now().toString(36)+Math.random().toString(36).slice(2,6),name:f.name.replace(/\.[^.]+$/,'').replace(/[_]+/g,' ').trim()||'Song',size:f.size,added:new Date().toISOString()},f); added++; }catch(e){ failed++; }
    }
    await load(); const c=cur(); build(c?c.id:undefined); if(!c) idx=-1; emit(); return {added,skipped,failed};
  }
  async function remove(id){
    const c=cur(), wasCur=c&&c.id===id;
    dropPre(); if(wasCur){ audio.pause(); audio.removeAttribute('src'); audio.load(); if(url){ URL.revokeObjectURL(url); url=null; } }
    await RisenDB.deleteSong(id); await load();
    if(wasCur){ order=[]; idx=-1; } else if(c){ build(c.id); }
    emit();
  }
  audio.addEventListener('play',emit); audio.addEventListener('pause',emit);
  audio.addEventListener('ended',()=>next());
  audio.addEventListener('timeupdate',()=>tickSubs.forEach(f=>{ try{f();}catch(e){} }));
  return {
    init(c){ cfg=c; }, load, reset, toggle, next, prev, setShuffle, add, remove,
    on:f=>subs.push(f), onTick:f=>tickSubs.push(f),
    state:()=>({ready,count:list.length,list,playing:!audio.paused&&!!cur(),name:cur()?cur().name:'',active:!!cur(),shuffle:cfg.shuffle(),pos:audio.currentTime||0,dur:isFinite(audio.duration)?audio.duration:0})
  };
})();
