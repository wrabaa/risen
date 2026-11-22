// PRAYER TIMES (.108, Siza's Home only): calculated on the phone, no internet. Method: Muslim World League (Fajr 18°, Isha 17°, Asr standard shadow).
// Default place Baabda, Lebanon; the phone's own clock and time zone (summer / winter time) are used. Nothing here saves anything: app.js keeps the settings.
const Prayer=(()=>{
  const NAMES=['fajr','sunrise','dhuhr','asr','maghrib','isha'], LABEL={fajr:'Fajr',sunrise:'Sunrise',dhuhr:'Dhuhr',asr:'Asr',maghrib:'Maghrib',isha:'Isha'};
  const DEF={lat:33.834,lon:35.543};
  const rad=d=>d*Math.PI/180, deg=r=>r*180/Math.PI, sd=d=>Math.sin(rad(d)), cd=d=>Math.cos(rad(d));
  function jd(y,m,d){ if(m<=2){y-=1;m+=12} const A=Math.floor(y/100), B=2-A+Math.floor(A/4); return Math.floor(365.25*(y+4716))+Math.floor(30.6001*(m+1))+d+B-1524.5; }
  // minutes after midnight (local clock) of each time on the day of `date`, before the user's minute fine-tuning
  function base(date,lat,lon){
    const tz=-new Date(date.getFullYear(),date.getMonth(),date.getDate(),12).getTimezoneOffset()/60;
    const D=jd(date.getFullYear(),date.getMonth()+1,date.getDate())-2451545.0;
    const g=(357.529+0.98560028*D)%360, q=(280.459+0.98564736*D)%360, L=(q+1.915*sd(g)+0.020*sd(2*g))%360, e=23.439-0.00000036*D;
    const RA=((deg(Math.atan2(cd(e)*sd(L),cd(L)))/15)%24+24)%24, decl=deg(Math.asin(sd(e)*sd(L)));
    let eqt=q/15-RA; eqt=((eqt+12)%24+24)%24-12;
    const noon=12+tz-lon/15-eqt;
    const hour=(a)=>{ const x=(-sd(a)-sd(lat)*sd(decl))/(cd(lat)*cd(decl)); return deg(Math.acos(Math.max(-1,Math.min(1,x))))/15; };
    const aAsr=deg(Math.atan(1/(1+Math.tan(rad(Math.abs(lat-decl)))))), tAsr=deg(Math.acos((sd(aAsr)-sd(lat)*sd(decl))/(cd(lat)*cd(decl))))/15;
    const h=x=>Math.round(x*60);
    return {fajr:h(noon-hour(18)), sunrise:h(noon-hour(0.833)), dhuhr:h(noon+1/60), asr:h(noon+tAsr), maghrib:h(noon+hour(0.833)), isha:h(noon+hour(17))};
  }
  // with the user's fine-tuning (minutes, any number, + or −)
  function times(date,place,offs){
    const b=base(date,place&&place.lat!=null?place.lat:DEF.lat,place&&place.lon!=null?place.lon:DEF.lon), o={};
    for(const n of NAMES) o[n]=b[n]+(Number(offs&&offs[n])||0);
    return o;
  }
  const clock=m=>{ m=((Math.round(m)%1440)+1440)%1440; return String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0'); };
  // the next of the five prayers (Sunrise is shown but never counted to): {name, at (Date), inMin}
  function next(now,place,offs){
    const five=['fajr','dhuhr','asr','maghrib','isha'], nowM=now.getHours()*60+now.getMinutes()+now.getSeconds()/60;
    const t=times(now,place,offs);
    for(const n of five) if(t[n]>nowM) return {name:n,time:t[n],inMin:Math.ceil(t[n]-nowM-1e-9)};
    const tm=new Date(now.getFullYear(),now.getMonth(),now.getDate()+1,12), t2=times(tm,place,offs);
    return {name:'fajr',time:t2.fajr,inMin:Math.ceil(1440-nowM+t2.fajr-1e-9),tomorrow:true};
  }
  const left=m=>Math.floor(m/60)+':'+String(m%60).padStart(2,'0');            // 2:29 (hours:minutes)
  // the Islamic date: the day changes at Maghrib; `adj` = the user's ±days (Lebanon often starts a month by moon sighting)
  function hijri(now,place,offs,adj){
    let d=new Date(now.getFullYear(),now.getMonth(),now.getDate(),12);
    const mag=times(now,place,offs).maghrib; if(now.getHours()*60+now.getMinutes()>=mag) d=new Date(d.getTime()+864e5);
    d=new Date(d.getTime()+(Number(adj)||0)*864e5);
    try{ const p=new Intl.DateTimeFormat('en-u-ca-islamic',{day:'numeric',month:'long',year:'numeric'}).formatToParts(d), g=t=>(p.find(x=>x.type===t)||{}).value;
      return g('day')+' '+g('month')+' '+String(g('year')).replace(/\s*AH$/i,'')+' AH'; }catch(e){ return ''; }
  }
  return {NAMES,LABEL,DEF,times,next,left,clock,hijri};
})();
