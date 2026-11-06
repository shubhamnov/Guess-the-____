/* Shared game for Guess the Series and Guess the Web Series. Rows: [show, year, cast, line, emoji, saidBy, where, group].
 * A Global / India / Both switch picks which shows are asked (saved on this device, or ?region=global|india|both).
 * It sits above the questions (switching restarts the round with the new shows) and above Play again on the result screen.
 * Live games always use Both, because a room link does not carry the setting. */
window.GTQSeries=function(cfg){
 const GROUP_NAME={in:'Indian',intl:'International',toon:'Cartoon'};
 const INDIAN=new Set(cfg.indianToons||[]);
 const ALL=cfg.rows.map(([show,year,cast,line,emoji,saidBy,where,group])=>({show,year,cast,star:cast[0]||'',line,emoji,saidBy:saidBy||'',where:where||'',group,
  region:group==='in'||INDIAN.has(show)?'india':'global'}));
 const REGIONS=[['global','🌍 Global'],['india','🇮🇳 India'],['both','Both']],KEY='gtq:region';
 const live=new URLSearchParams(location.search).has('live');
 let region=new URLSearchParams(location.search).get('region');
 if(!REGIONS.some(r=>r[0]===region)){try{region=localStorage.getItem(KEY)}catch(e){region=null}}
 if(live||!REGIONS.some(r=>r[0]===region))region='both';
 let DATA=ALL,ACTORS=[],pool,charPool;
 /* The two leads of every show in play, with its group, for wrong answers. (Supporting cast are only ever right answers.) */
 function useRegion(r){region=r;DATA=r==='both'?ALL:ALL.filter(x=>x.region===r);ACTORS=[];DATA.forEach(x=>x.cast.slice(0,2).forEach(a=>ACTORS.push({name:a,group:x.group})));
  pool=GuessGame.util.deck(DATA,x=>x.show);charPool=GuessGame.util.deck(CHARACTERS.filter(c=>r==='both'||c.item.region===r),x=>x.name)}
 const BY_SHOW=new Map(ALL.map(x=>[x.show,x]));
 const CHARACTERS=cfg.characters.map(([name,show,actor])=>({name,actor,item:BY_SHOW.get(show)})).filter(c=>c.item);
 useRegion(region);
 function otherActors(ctx,item,exclude){
  const bad=new Set(item.cast.concat(exclude||[])),list=ctx.util.shuffle(ACTORS.filter(a=>!bad.has(a.name)));
  const ordered=ctx.hard?list.filter(a=>a.group===item.group).concat(list):list,out=[];
  for(const a of ordered)if(!out.includes(a.name)){out.push(a.name);if(out.length===3)break}
  return out;
 }
 function title(h,item,sub){const e=document.createElement('div');e.className='clue-film';e.style.fontSize=item.show.length>22?'clamp(26px,7vw,40px)':'clamp(34px,10vw,56px)';e.textContent=item.show;const y=document.createElement('small');y.textContent=sub||item.year;e.appendChild(y);h.appendChild(e)}
 function quote(h,text,sub){
  const q=document.createElement('div');q.className='clue-quote';q.textContent=text;
  q.style.fontSize=text.length>70?'clamp(19px,5vw,26px)':text.length>40?'clamp(23px,6.2vw,34px)':'clamp(28px,8vw,46px)';
  const s=document.createElement('div');s.className='clue-sub';s.textContent=sub;h.append(q,s);
 }
 let api;
 api=GuessGame.run(Object.assign({
  onStart(){pool.reset();charPool.reset()},
  formats:['Emoji → show','Character → show','Show → star','Co-star','Line → show','Who said it?',cfg.whereFormat,'Which came first?'],
  next(ctx){
   const item=pool.draw(),level=ctx.hard?'Tricky · same kind of show':'Warm-up';
   const shows=it=>ctx.util.choices(it,DATA,{answer:x=>x.show,group:x=>x.group,hard:ctx.hard});
   const label=item.show+' ('+item.year+')';
   let f=ctx.format(['emoji','emoji','character','character','star','costar','line','saidby','where','first']);
   if(f==='saidby'&&!item.saidBy)f=item.line?'line':'character';
   if(f==='line'&&!item.line)f='emoji';
   if(f==='costar'&&item.cast.length<2)f=item.star?'star':'character';
   if(f==='star'&&!item.star)f='character';
   if(f==='where'){
    const list=(cfg.where[item.group]||[]).filter(w=>w!==item.where);
    if(item.where&&list.length>=3)return {kind:cfg.whereFormat,answer:item.where,options:ctx.util.shuffle([item.where].concat(ctx.util.shuffle(list).slice(0,3))),
     prompt:cfg.wherePrompt,level,explanation:item.show+' '+cfg.whereVerb+' '+item.where+'.',render(h){title(h,item)}};
    f='emoji';
   }
   if(f==='character'){
    const c=charPool.draw(),it=c.item,lab=it.show+' ('+it.year+')';
    return {kind:'Character',answer:it.show,options:shows(it),prompt:'Which show is this character from?',level,
     explanation:c.name+' is from '+lab+(c.actor?', played by '+c.actor:'')+'.',render(h){quote(h,c.name,'Character')}};
   }
   if(f==='first'){
    const src=ctx.util.shuffle(ctx.hard?DATA.filter(x=>x.group===item.group&&x!==item):DATA.filter(x=>x!==item)),picked=[item],years=new Set([item.year]);
    for(const x of src)if(!years.has(x.year)){picked.push(x);years.add(x.year);if(picked.length===4)break}
    if(picked.length===4){
     const sorted=picked.slice().sort((a,b)=>a.year-b.year);
     return {kind:'Oldest show',answer:sorted[0].show,options:ctx.util.shuffle(picked.map(x=>x.show)),prompt:'Which of these shows started first?',level,
      explanation:sorted.map(x=>x.show+' '+x.year).join(' → ')+'.',render(h){ctx.util.bigClue(h,'📅📺','Oldest first')}};
    }
    f='emoji';
   }
   if(f==='costar'){
    const co=item.cast[1];
    return {kind:'Co-star',answer:co,options:ctx.util.shuffle([co].concat(otherActors(ctx,item))),prompt:'Who else stars in this show?',level,
     explanation:co+' stars with '+item.star+' in '+label+'.',render(h){title(h,item,item.year+' · with '+item.star)}};
   }
   if(f==='star')return {kind:'Star',answer:item.star,options:ctx.util.shuffle([item.star].concat(otherActors(ctx,item))),prompt:'Who stars in this show?',level,
    explanation:item.star+' stars in '+label+'.',render(h){title(h,item)}};
   if(f==='saidby')return {kind:'Who said it?',answer:item.saidBy,options:ctx.util.shuffle([item.saidBy].concat(otherActors(ctx,item,[item.saidBy]))),prompt:'Who says this line?',level,
    explanation:item.saidBy+' says it in '+label+'.',render(h){quote(h,'“'+item.line+'”',item.show+' · '+item.year)}};
   if(f==='line')return {kind:'Famous line',answer:item.show,options:shows(item),prompt:'Which show is this line from?',level,explanation:'That line is from '+label+'.',
    render(h){quote(h,'“'+item.line+'”','Famous line')}};
   return {kind:'Emoji plot',answer:item.show,options:shows(item),prompt:'Which show do these emoji describe?',level,explanation:'That was '+label+' · '+GROUP_NAME[item.group]+(item.group==='toon'?'':' show')+'.',
    render(h){const e=document.createElement('div');e.className='clue-emoji';e.style.cssText='font-size:clamp(38px,10.5vw,80px);text-align:center;line-height:1.2;max-width:calc(100% - 24px)';e.setAttribute('role','img');e.setAttribute('aria-label','Emoji plot of a show');e.textContent=item.emoji;h.appendChild(e)}};
  }
 },cfg.game,{note:noteText(),setupIntro({$}){
  if(live)return;
  const css=document.createElement('style');
  css.textContent='.region-pick{display:grid;grid-template-columns:repeat(3,1fr);gap:4px;padding:4px;border:1px solid var(--line);border-radius:16px;background:var(--paper)}'+
   '.region-pick button{border:0;background:none;border-radius:12px;padding:11px 6px;font:inherit;font-size:13px;font-weight:850;color:var(--muted);cursor:pointer}'+
   '.game .region-pick{padding:3px;border-radius:14px}.game .region-pick button{padding:7px 6px;font-size:12px}'+
   '.region-pick button[aria-pressed="true"]{background:var(--ink);color:#fff}.region-pick button:focus-visible{outline:3px solid #7871e8;outline-offset:2px}';
  document.head.appendChild(css);
  const note=$('introNote'),picks=[];
  function makePick(){const pick=document.createElement('div');pick.className='region-pick';pick.setAttribute('role','group');pick.setAttribute('aria-label','Which shows');
   pick.innerHTML=REGIONS.map(r=>'<button type="button" data-region="'+r[0]+'" aria-pressed="'+(r[0]===region)+'">'+r[1]+'</button>').join('');
   pick.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;useRegion(b.dataset.region);try{localStorage.setItem(KEY,region)}catch(err){}
    picks.forEach(p=>p.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',String(x.dataset.region===region))));
    note.innerHTML='';note.append(noteText(),document.createElement('br'),'Personal best saved on this device.');
    if(pick.parentElement.id==='game'&&api)api.start()});
   picks.push(pick);return pick}
  $('startBtn').before(makePick());
  $('againBtn').before(makePick());
  $('game').prepend(makePick());
 }}));
 function noteText(){const shows=DATA.length,chars=CHARACTERS.filter(c=>region==='both'||c.item.region===region).length;
  return (region==='global'?'International shows only: ':region==='india'?'Indian shows only: ':'')+shows+' shows and '+chars+' characters. '+(region==='both'?cfg.game.note:cfg.game.note.replace(/^[^.]*\.\s*/,''))}
};
