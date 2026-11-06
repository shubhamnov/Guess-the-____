/* Shared game for Guess the Series and Guess the Web Series. Rows: [show, year, cast, line, emoji, saidBy, where, group].
 * The site-wide Global / India / Both switch (shared/region.js) picks which shows are asked.
 * cfg.animated: shows whose cast are voice actors (cartoons in the toon group have no cast at all). Their actor questions
 * say "voices" and offer other animated shows' voice leads; with too few of those, the show gets another kind of question. */
window.GTQSeries=function(cfg){
 const GROUP_NAME={in:'Indian',intl:'International',toon:'Cartoon'};
 const INDIAN=new Set(cfg.indianToons||[]),ANIMATED=new Set(cfg.animated||[]);
 const ALL=cfg.rows.map(([show,year,cast,line,emoji,saidBy,where,group])=>({show,year,cast,star:cast[0]||'',line,emoji,saidBy:saidBy||'',where:where||'',group,animated:ANIMATED.has(show),
  region:group==='in'||INDIAN.has(show)?'india':'global'}));
 let region=GTQRegion.get();
 let DATA=ALL,ACTORS=[],VOICES=[],pool,charPool;
 /* The two leads of every show in play, with its group, for wrong answers. (Supporting cast are only ever right answers.)
  * Animated shows' voice leads are kept apart, so a screen star is never up against a voice actor, or the reverse. */
 function useRegion(r){region=r;DATA=r==='both'?ALL:ALL.filter(x=>x.region===r);ACTORS=[];VOICES=[];DATA.forEach(x=>x.cast.slice(0,2).forEach(a=>(x.animated?VOICES:ACTORS).push({name:a,group:x.group})));
  pool=GuessGame.util.deck(DATA,x=>x.show);charPool=GuessGame.util.deck(CHARACTERS.filter(c=>r==='both'||c.item.region===r),x=>x.name)}
 const BY_SHOW=new Map(ALL.map(x=>[x.show,x]));
 const CHARACTERS=cfg.characters.map(([name,show,actor])=>({name,actor,item:BY_SHOW.get(show)})).filter(c=>c.item);
 useRegion(region);
 function otherActors(ctx,item,exclude){
  const bad=new Set(item.cast.concat(exclude||[])),list=ctx.util.shuffle((item.animated?VOICES:ACTORS).filter(a=>!bad.has(a.name)));
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
 GuessGame.run(Object.assign({
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
     explanation:c.name+' is from '+lab+(c.actor?(it.animated?', voiced by ':', played by ')+c.actor:'')+'.',render(h){quote(h,c.name,'Character')}};
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
   if(f==='costar'||f==='star'||f==='saidby'){
    const wrong=otherActors(ctx,item,f==='saidby'?[item.saidBy]:null),v=item.animated;
    if(wrong.length<3)f=item.line?'line':'emoji'; // an animated show with too few other voice actors to choose from
    else if(f==='costar'){
     const co=item.cast[1];
     return {kind:'Co-star',answer:co,options:ctx.util.shuffle([co].concat(wrong)),prompt:v?'Who else voices a lead in this show?':'Who else stars in this show?',level,
      explanation:co+(v?' voices a lead with ':' stars with ')+item.star+' in '+label+'.',render(h){title(h,item,item.year+(v?' · animated · voiced with ':' · with ')+item.star)}};
    }
    else if(f==='star')return {kind:'Star',answer:item.star,options:ctx.util.shuffle([item.star].concat(wrong)),prompt:v?'Who voices the lead in this show?':'Who stars in this show?',level,
     explanation:item.star+(v?' voices the lead in ':' stars in ')+label+'.',render(h){title(h,item,v?item.year+' · animated':item.year)}};
    else return {kind:'Who said it?',answer:item.saidBy,options:ctx.util.shuffle([item.saidBy].concat(wrong)),prompt:v?'Who voices the character who says this line?':'Who says this line?',level,
     explanation:item.saidBy+(v?' voices that line in ':' says it in ')+label+'.',render(h){quote(h,'“'+item.line+'”',item.show+' · '+item.year)}};
   }
   if(f==='line')return {kind:'Famous line',answer:item.show,options:shows(item),prompt:'Which show is this line from?',level,explanation:'That line is from '+label+'.',
    render(h){quote(h,'“'+item.line+'”','Famous line')}};
   return {kind:'Emoji plot',answer:item.show,options:shows(item),prompt:'Which show do these emoji describe?',level,explanation:'That was '+label+' · '+GROUP_NAME[item.group]+(item.group==='toon'?'':' show')+'.',
    render(h){const e=document.createElement('div');e.className='clue-emoji';e.style.cssText='font-size:clamp(38px,10.5vw,80px);text-align:center;line-height:1.2;max-width:calc(100% - 24px)';e.setAttribute('role','img');e.setAttribute('aria-label','Emoji plot of a show');e.textContent=item.emoji;h.appendChild(e)}};
  }
 },cfg.game,{note:noteText(),onRegion(r){useRegion(r);return noteText()}}));
 function noteText(){const shows=DATA.length,chars=CHARACTERS.filter(c=>region==='both'||c.item.region===region).length;
  return GTQRegion.notePrefix(region)+shows+' shows and '+chars+' characters. '+(region==='both'?cfg.game.note:cfg.game.note.replace(/^[^.]*\.\s*/,''))}
};
