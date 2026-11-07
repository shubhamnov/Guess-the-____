/* The sports games: Guess the Sports (every sport) and one game per topic (Cricket, Football, Tennis, F1, Olympics,
 * More sports). A page sets window.GTQ_SPORTS_TOPIC to a key of TOPICS below, then loads data/sports.js and this file.
 * Every topic uses the same question formats; a format is left out when the topic has nothing for it
 * (Tennis has no venues, Cricket has no "which sport?" questions, and so on). */
(function(){
'use strict';
const D=GTQ_DATA,U=GuessGame.util;
const ICON={Cricket:'🏏',Football:'⚽',Tennis:'🎾',Athletics:'🏃',Swimming:'🏊',Gymnastics:'🤸',Shooting:'🎯',Boxing:'🥊',Badminton:'🏸',Chess:'♟️',Hockey:'🏑',Basketball:'🏀','Formula 1':'🏎️',Golf:'⛳','Ice hockey':'🏒',Kabaddi:'🤼',Wrestling:'🤼',Rugby:'🏉',Cycling:'🚴','Table tennis':'🏓',Weightlifting:'🏋️',Archery:'🏹'};
const OLYMPIC=['Athletics','Swimming','Gymnastics','Shooting','Boxing','Wrestling','Weightlifting','Archery','Cycling'];
const MORE=['Basketball','Chess','Golf','Ice hockey','Kabaddi','Rugby','Badminton','Hockey','Table tennis'];
const FORMAT_LABEL={nick:'Nickname → player',record:'Record → player',sport:'Player → sport',country:'Player → country',venue:'Venue → city',circuit:'Circuit → country',term:'Sports words',cricketTerm:'Cricket terms',champ:'Champions'};
/* sports: which sports' players, records and words (null = all) · venues: 'all', 'cricket', 'f1' or none ·
 * champs: [competition, share] · order: question formats, main one first. */
const TOPICS={
 sports:{id:'sports',label:'Sports',pill:'Game on',eyebrow:'Game on!',titleHtml:'Know your<br><em>sports?</em>',sports:null,venues:'all',
  intro:'Football, tennis, athletics, basketball, F1, chess, boxing, the Olympics, cricket and more. Name the star, the sport, the stadium and the champions.',
  champs:[['FIFA World Cup',3],['Summer Olympics',3],['Men’s Cricket World Cup',1],['Men’s T20 World Cup',1],['IPL champions',1]],
  order:['nick','record','sport','country','venue','term','champ'],preview:'⚽🎾🏀🏎️🏅'},
 cricket:{id:'cricket',label:'Cricket',pill:'Howzat',eyebrow:'Sports · Cricket',titleHtml:'Know your<br><em>cricket?</em>',sports:['Cricket'],venues:'cricket',
  intro:'Nicknames, records, grounds, cricket terms, World Cups and the IPL. How well do you know the game?',
  champs:[['Men’s Cricket World Cup',2],['Men’s T20 World Cup',1],['IPL champions',2]],
  order:['nick','record','champ','country','venue','cricketTerm'],preview:'🏏🏆🏟️'},
 football:{id:'football',label:'Football',pill:'Kick-off',eyebrow:'Sports · Football',titleHtml:'Know your<br><em>football?</em>',sports:['Football'],
  intro:'The stars, their nicknames and records, and every FIFA World Cup winner.',
  champs:[['FIFA World Cup',1]],order:['nick','record','champ','country'],preview:'⚽🏆🥅'},
 tennis:{id:'tennis',label:'Tennis',pill:'Game, set',eyebrow:'Sports · Tennis',titleHtml:'Know your<br><em>tennis?</em>',sports:['Tennis'],
  intro:'Grand Slam legends, their nicknames, their records and the countries they play for.',
  champs:[],order:['record','nick','country'],preview:'🎾🏆'},
 f1:{id:'f1',label:'F1',pill:'Lights out',eyebrow:'Sports · Formula 1',titleHtml:'Know your<br><em>Formula 1?</em>',sports:['Formula 1'],venues:'f1',
  intro:'Every drivers’ champion since 1988, the famous circuits and the records.',
  champs:[['Formula 1 World Champion',1]],order:['champ','venue','record','nick','country'],preview:'🏎️🏁🏆'},
 olympics:{id:'olympics',label:'Olympics',pill:'Faster, higher',eyebrow:'Sports · Olympics',titleHtml:'Know your<br><em>Olympics?</em>',sports:OLYMPIC,
  intro:'Athletics, swimming, gymnastics, boxing, wrestling, shooting and more, plus every Summer Olympics host city.',
  champs:[['Summer Olympics',1]],order:['record','sport','champ','nick','country','term'],preview:'🏅🏃🏊🤸'},
 'more-sports':{id:'more-sports',label:'More sports',pill:'Game on',eyebrow:'Sports · More sports',titleHtml:'Know your<br><em>other sports?</em>',sports:MORE,
  intro:'Basketball, chess, golf, hockey, badminton, kabaddi, rugby and more. Name the star, the sport and the record.',
  champs:[],order:['sport','record','nick','country','term'],preview:'🏀♟️⛳🏸'}
};
const T=TOPICS[window.GTQ_SPORTS_TOPIC]||TOPICS.sports;
const inTopic=s=>!T.sports||T.sports.includes(s);

const ALL_PLAYERS=D.cricketPlayers.map(([name,country,nick])=>({name,sport:'Cricket',country,nick}))
 .concat(D.sportsPlayers.map(([name,sport,country,nick])=>({name,sport,country,nick}))).filter(p=>inTopic(p.sport));
const BY_NAME=new Map(D.cricketPlayers.map(([name,country,nick])=>({name,sport:'Cricket',country,nick}))
 .concat(D.sportsPlayers.map(([name,sport,country,nick])=>({name,sport,country,nick}))).map(p=>[p.name,p]));
const ALL_RECORDS=D.cricketRecords.concat(D.sportsRecords).map(([clue,player])=>({clue,player:BY_NAME.get(player)})).filter(r=>inTopic(r.player.sport));
const ALL_VENUES=T.venues==='f1'?D.f1Circuits.map(([name,city,country])=>({name,city,country,sport:'Circuit'})):
 T.venues==='cricket'?D.cricketGrounds.map(([name,city,country])=>({name,city,country,sport:'Cricket ground'})):
 T.venues==='all'?D.cricketGrounds.map(([name,city,country])=>({name,city,country,sport:'Cricket ground'}))
  .concat(D.sportsVenues.map(([name,city,country])=>({name,city,country,sport:'Venue'}))):[];
const TERMS=D.cricketTerms.map(([meaning,term])=>({meaning,term}));
const ALL_WORDS=D.sportsWords.map(([word,sport])=>({word,sport})).filter(w=>inTopic(w.sport));
/* Champions: one list per competition; wrong answers come from that competition's teams, cities or drivers. */
const IPL_TEAMS=year=>D.iplTeams.filter(t=>!(year<2013&&t==='Sunrisers Hyderabad')&&!(year<2022&&(t==='Gujarat Titans'||t==='Lucknow Super Giants'))).concat(year<=2012?['Deccan Chargers']:[]);
const OLYMPIC_CITIES=[...new Set(D.olympicHosts.map(x=>x[1]))];
const F1_DRIVERS=[...new Set(D.f1Champions.map(x=>x[1]))];
const CHAMP_SUBS=new Set(T.champs.map(c=>c[0]));
const ALL_CHAMPS=[]
 .concat(D.cricketWorldCups.map(([year,type,winner])=>({year,answer:winner,icon:'🏏',sub:type==='ODI'?'Men’s Cricket World Cup':'Men’s T20 World Cup',ask:'Who won the '+year+(type==='ODI'?' Cricket World Cup?':' T20 World Cup?'),others:D.cricketTeams})))
 .concat(D.iplWinners.map(([year,team])=>({year,answer:team,icon:'🏏',sub:'IPL champions',ask:'Who won the IPL in '+year+'?',others:IPL_TEAMS(year)})))
 .concat(D.footballWorldCups.map(([year,team])=>({year,answer:team,icon:'⚽',sub:'FIFA World Cup',ask:'Who won the '+year+' FIFA World Cup?',others:D.footballTeams.filter(t=>!(team==='West Germany'&&t==='Germany'))})))
 .concat(D.olympicHosts.map(([year,city])=>({year,answer:city,icon:'🏅',sub:'Summer Olympics',ask:'Which city hosted the '+year+' Summer Olympics?',others:OLYMPIC_CITIES,host:true})))
 .concat(D.f1Champions.map(([year,driver])=>({year,answer:driver,icon:'🏎️',sub:'Formula 1 World Champion',ask:'Who won the '+year+' F1 drivers’ title?',others:F1_DRIVERS})))
 .filter(c=>CHAMP_SUBS.has(c.sub));
/* Countries that would also be right for some players: Great Britain/England and West Indies/Jamaica. */
const CLASH={'Great Britain':['England'],'England':['Great Britain'],'West Indies':['Jamaica'],'Jamaica':['West Indies']};
const deckOf=(list,key)=>U.deck(list,key);
/* Global / India / Both (shared/region.js). India: Indian stars, Indian venues and records, cricket trophies and the
   IPL, cricket and kabaddi words. Global: everything except Indian stars, venues and records, the IPL and kabaddi.
   Both: everything. A topic with only a handful of Indian stars (Football, Tennis, F1) asks everything in India mode. */
const isIndian=p=>p.country==='India';
const FEW_INDIAN=ALL_PLAYERS.filter(isIndian).length<8;
let region,shown,PLAYERS,NICKS,RECORDS,VENUES,WORDS,CHAMPS,COUNTRIES,SPORTS,FORMATS,decks={};
function useRegion(r){
 region=r;shown=r==='india'&&FEW_INDIAN?'both':r;
 const india=shown==='india',global=shown==='global',all=T.id==='sports';
 PLAYERS=ALL_PLAYERS.filter(p=>india?isIndian(p):global?!isIndian(p):true);
 NICKS=PLAYERS.filter(p=>p.nick);
 RECORDS=ALL_RECORDS.filter(x=>india?isIndian(x.player):global?!isIndian(x.player):true);
 VENUES=ALL_VENUES.filter(v=>india?v.country==='India':global?v.country!=='India':true);
 if(VENUES.length<4)VENUES=ALL_VENUES.filter(v=>!global||v.country!=='India');
 WORDS=ALL_WORDS.filter(w=>india?/Cricket|Kabaddi/.test(w.sport)||!all:global?w.sport!=='Kabaddi':true);
 CHAMPS=ALL_CHAMPS.filter(c=>india&&all?c.icon==='🏏':global?c.sub!=='IPL champions':true);
 COUNTRIES=[...new Set(PLAYERS.map(p=>p.country))];
 SPORTS=(T.sports||D.sportsList).filter(x=>!(r==='global'&&x==='Kabaddi'));
 /* A mix only uses the parts that have something in them. */
 const part=(list,key,w)=>list.length?[deckOf(list,key),w]:null;
 decks.venue=mix([part(VENUES.filter(v=>v.sport!=='Cricket ground'),x=>x.name,3),part(VENUES.filter(v=>v.sport==='Cricket ground'),x=>x.name,1)].filter(Boolean));
 const words=SPORTS.length>=4&&WORDS.length?deckOf(WORDS,x=>x.word):null,terms=T.venues==='cricket'||all?deckOf(TERMS,x=>x.term):null;
 decks.term=mix([[{kind:'word',d:words},4],[{kind:'term',d:terms},1]].filter(([o])=>o.d)
  .map(([o,w])=>[{reset:()=>o.d.reset(),draw:()=>({kind:o.kind,item:o.d.draw()})},w]));
 decks.champ=mix(T.champs.map(([sub,w])=>part(CHAMPS.filter(c=>c.sub===sub),x=>x.sub+x.year,w)).filter(Boolean));
 decks.player=sportPicker(PLAYERS,bySport);decks.nick=sportPicker(NICKS,bySport);
 decks.record=sportPicker(RECORDS,x=>x.player.sport);
 /* Formats this topic has questions for, in this region. */
 const has={nick:NICKS.length>0&&PLAYERS.length>=4,record:RECORDS.length>0&&PLAYERS.length>=4,sport:SPORTS.length>=4&&PLAYERS.length>0,
  country:all||COUNTRIES.length>=4,venue:VENUES.length>=4,term:!!(words||terms),cricketTerm:!!terms,champ:CHAMPS.length>0};
 FORMATS=T.order.filter(f=>has[f]);
}
function formatLabels(){return FORMATS.map(f=>f==='venue'&&T.venues==='f1'?FORMAT_LABEL.circuit:FORMAT_LABEL[f])}
function noteText(){
 const sports=new Set(PLAYERS.map(p=>p.sport)).size;
 return (shown!==region?'Only a few Indian stars here yet, so India mode asks everything. ':GTQRegion.notePrefix(region))+
  PLAYERS.length+' players'+(sports>1?' across '+sports+' sports. After five warm-up questions, the wrong answers come from the same sport.':'.')}
/* Every sport gets a fair turn. Pick a sport first, then an unused item from that sport's pile.
   Bigger sports come up a little more often, but cricket (by far the biggest list) is weighted no
   higher than the next-biggest sport, so the game stays an all-sports quiz. Empty piles sit out
   until every pile is used up. */
function sportPicker(list,sportOf){
 const sports=[...new Set(list.map(sportOf))],size={};
 sports.forEach(s=>size[s]=list.filter(x=>sportOf(x)===s).length);
 const cap=sports.map(s=>size[s]).sort((a,b)=>b-a)[1]||1,weight={};
 sports.forEach(s=>weight[s]=Math.sqrt(Math.min(size[s],cap)));
 let piles={};
 const reset=()=>{piles={};sports.forEach(s=>piles[s]=U.shuffle(list.filter(x=>sportOf(x)===s)))};
 reset();
 return {reset,draw(){
  let open=sports.filter(s=>piles[s].length);
  if(!open.length){reset();open=sports}
  const total=open.reduce((a,s)=>a+weight[s],0);let r=Math.random()*total,i=0;
  while(i<open.length-1&&r>weight[open[i]]){r-=weight[open[i]];i++}
  return piles[open[i]].pop();
 }};
}
/* Mix several decks with fixed shares, e.g. 80% sports words and 20% cricket terms. */
function mix(parts){
 const total=parts.reduce((a,p)=>a+p[1],0);
 return {reset(){parts.forEach(p=>p[0].reset())},draw(){let r=Math.random()*total,i=0;while(i<parts.length-1&&r>parts[i][1]){r-=parts[i][1];i++}return parts[i][0].draw()}};
}
const bySport=p=>p.sport;
useRegion(GTQRegion.get());
function quote(h,text,sub){
 const q=document.createElement('div');q.className='clue-quote';q.textContent=text;
 q.style.fontSize=text.length>60?'clamp(20px,5.4vw,28px)':text.length>32?'clamp(24px,6.6vw,36px)':'clamp(30px,8.5vw,50px)';
 const s=document.createElement('div');s.className='clue-sub';s.textContent=sub;h.append(q,s);
}
function pickOthers(answer,list){return U.shuffle([answer].concat(U.shuffle([...new Set(list)].filter(x=>x!==answer)).slice(0,3)))}
const LINKS=T.id==='sports'
 ?[{text:'Cricket',href:'../guess-the-cricket/'},{text:'Football',href:'../guess-the-football/'},{text:'Bollywood',href:'../guess-the-bollywood/'}]
 :[{text:'All sports mix',href:'../guess-the-sports/'}].concat(Object.values(TOPICS).filter(t=>t.id!=='sports'&&t.id!==T.id).slice(0,2).map(t=>({text:t.label,href:'../guess-the-'+t.id+'/'})));
const game=GuessGame.run({
 id:T.id,label:T.label,pill:T.pill,eyebrow:T.eyebrow,titleHtml:T.titleHtml,intro:T.intro,
 note:noteText(),onRegion(r){useRegion(r);return noteText()},
 previewHtml:'<div class="preview-row"><span>'+T.preview+'</span></div>',
 prompt:'Who is this?',links:LINKS,
 onStart(){Object.values(decks).forEach(d=>d.reset())},
 formats:formatLabels(),
 next(ctx){
  const level=ctx.hard?(T.sports&&T.sports.length===1?'Tricky':'Tricky · same sport'):'Warm-up';
  let f=ctx.format(FORMATS);
  if(f==='country'&&shown==='india')f=FORMATS.includes('sport')?'sport':FORMATS[0];
  const players=p=>U.choices(p,PLAYERS,{answer:x=>x.name,group:x=>x.sport,hard:ctx.hard});
  if(f==='record'){
   const r=decks.record.draw(),p=r.player;
   return {kind:'Record',answer:p.name,options:players(p),prompt:'Who is this?',level,explanation:r.clue+': '+p.name+' ('+p.sport+', '+p.country+').',
    render(h){quote(h,r.clue,ICON[p.sport]+' Record')}};
  }
  if(f==='sport'){
   const p=decks.player.draw();
   return {kind:'Sport',answer:p.sport,options:pickOthers(p.sport,SPORTS),prompt:'Which sport is this star famous for?',level,
    explanation:p.name+': '+p.sport+' ('+p.country+').',render(h){quote(h,p.name,'Player')}};
  }
  if(f==='country'){
   const p=decks.player.draw(),bad=new Set([p.country].concat(CLASH[p.country]||[]));
   const same=U.shuffle([...new Set(PLAYERS.filter(x=>x.sport===p.sport).map(x=>x.country))].filter(c=>!bad.has(c)));
   const rest=U.shuffle(COUNTRIES.filter(c=>!bad.has(c)&&!same.includes(c)));
   const options=U.shuffle([p.country].concat((ctx.hard?same.concat(rest):U.shuffle(same.concat(rest))).slice(0,3)));
   return {kind:'Country',answer:p.country,options,prompt:'Which country does this star play for?',level,
    explanation:p.name+' plays for '+p.country+'.',render(h){quote(h,p.name,ICON[p.sport]+' '+p.sport)}};
  }
  if(f==='venue'){
   const g=decks.venue.draw();
   if(g.sport==='Circuit')
    return {kind:'Circuit',answer:g.country,options:U.choices(g,VENUES,{answer:x=>x.country}),prompt:'Which country is this circuit in?',level,
     explanation:g.name+' is in '+(g.city===g.country?g.country:g.city+', '+g.country)+'.',render(h){quote(h,g.name,'🏁 F1 circuit')}};
   return {kind:'Venue',answer:g.city,options:U.choices(g,VENUES,{answer:x=>x.city,group:x=>x.country,hard:ctx.hard}),prompt:'Which city is this in?',level,
    explanation:g.name+' is in '+g.city+(g.country==='West Indies'||g.country==='UAE'||g.country==='USA'?'':', '+g.country)+'.',render(h){quote(h,g.name,'🏟️ '+g.sport)}};
  }
  if(f==='term'||f==='cricketTerm'){
   const pickT=decks.term.draw();
   if(pickT.kind==='term'){
    const t=pickT.item;
    return {kind:'Cricket term',answer:t.term,options:U.choices(t,TERMS,{answer:x=>x.term}),prompt:'What is this called in cricket?',level,
     explanation:t.term+': '+t.meaning.charAt(0).toLowerCase()+t.meaning.slice(1)+'.',render(h){quote(h,t.meaning,'🏏 Cricket term')}};
   }
   const w=pickT.item;
   return {kind:'Sports word',answer:w.sport,options:pickOthers(w.sport,SPORTS),prompt:'Which sport uses this word?',level,
    explanation:'“'+w.word+'” is from '+w.sport+'.',render(h){quote(h,'“'+w.word+'”','📖 Sports word')}};
  }
  if(f==='champ'){
   const c=decks.champ.draw();
   return {kind:'Champions',answer:c.answer,options:pickOthers(c.answer,c.others),prompt:c.ask,level,
    explanation:c.host?c.answer+' hosted the '+c.year+' Summer Olympics'+(c.year===2020?' (held in 2021)':'')+'.':
     c.icon==='🏎️'?c.answer+' won the '+c.year+' Formula 1 drivers’ championship.':c.answer+' won in '+c.year+' ('+c.sub.replace('IPL champions','IPL')+').',
    render(h){U.bigClue(h,c.icon+' '+c.year,c.sub)}};
  }
  const p=decks.nick.draw();
  return {kind:'Nickname',answer:p.name,options:players(p),prompt:'Whose nickname is this?',level,explanation:'“'+p.nick+'” is '+p.name+' ('+p.sport+', '+p.country+').',
   render(h){quote(h,'“'+p.nick+'”',ICON[p.sport]+' Nickname')}};
 }
});
/* The list of question types on the intro follows the region. */
GTQRegion.onChange(()=>{const box=document.querySelector('.micro.formats');if(box)box.innerHTML=formatLabels().map(f=>'<span>'+f+'</span>').join('')});
window.GTQSportsTopics=TOPICS;
void game;
})();
