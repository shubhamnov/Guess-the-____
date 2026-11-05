/* Daily Mix v1 question builder, shared by the Daily Mix page and the live race.
 * The question sequence for a date must never change, so this builder and its data files are frozen.
 * Needs daily-challenge-data-v1.js and brand-logos-daily-v1.js loaded first. */
(function(){
'use strict';
const CATEGORIES=[
 {key:'colors',label:'Colors',kind:'color',prompt:()=> 'Which color is shown?'},
 {key:'flags',label:'Flags',kind:'flag',prompt:()=> 'Which country does this flag belong to?'},
 {key:'countries',label:'Countries',kind:'country',prompt:()=> 'Which country is this outline?'},
 {key:'animals',label:'Animals',kind:'animal',prompt:()=> 'Which animal is this?'},
 {key:'capitals',label:'Capital Cities',kind:'capital',prompt:q=>'What is the capital of '+q.target.country+'?'},
 {key:'scripts',label:'Scripts',kind:'script',prompt:()=> 'Which writing system is shown?'},
 {key:'logos',label:'Brand Logos',kind:'logo',prompt:()=> 'Which brand owns this logo?'}
];
const DATA=window.DAILY_CHALLENGE_DATA_V1||{};
const LOGOS=window.DAILY_MIX_BRAND_LOGOS_V1||[];
function todayUTC(){return new Date().toISOString().slice(0,10)}
function validDate(value){if(!/^\d{4}-\d{2}-\d{2}$/.test(value||''))return false;const d=new Date(value+'T00:00:00Z');return !Number.isNaN(d.getTime())&&d.toISOString().slice(0,10)===value}
function formatDate(value){return new Intl.DateTimeFormat('en-US',{month:'long',day:'numeric',year:'numeric',timeZone:'UTC'}).format(new Date(value+'T00:00:00Z'))}
function hashSeed(seed){let h=2166136261;for(let i=0;i<seed.length;i++){h^=seed.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
function rngFor(seed){let state=hashSeed(String(seed));return function(){state=(state+0x6D2B79F5)|0;let t=state;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296}}
function shuffle(items,rng){const a=items.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function distinctByAnswer(items,getAnswer){const out=[],seen=new Set();for(const item of items){const value=getAnswer(item);if(value&&!seen.has(value)){seen.add(value);out.push(item)}}return out}
function makeQuestion(category,item,pool,rng){
 let answer,visual={},prompt=category.prompt({target:item}),getAnswer;
 if(category.key==='colors'){answer=item.name;visual={hex:item.hex};getAnswer=x=>x.name}
 else if(category.key==='flags'){answer=item[0];visual={code:item[1]};getAnswer=x=>x[0]}
 else if(category.key==='countries'){answer=item.name;visual={path:item.path};getAnswer=x=>x.name}
 else if(category.key==='animals'){answer=item.name;visual={emoji:item.emoji};getAnswer=x=>x.name}
 else if(category.key==='capitals'){answer=item.capital;prompt=category.prompt({target:item});visual={country:item.country};getAnswer=x=>x.capital}
 else if(category.key==='scripts'){answer=item.name;visual={sample:item.sample};getAnswer=x=>x.name}
 else {answer=item.name;visual={svg:item.svg,hex:item.hex};getAnswer=x=>x.name}
 const alternatives=distinctByAnswer(shuffle(pool.filter(x=>getAnswer(x)!==answer),rng),getAnswer).slice(0,3).map(getAnswer);
 return {category:category.label,kind:category.kind,prompt,answer,visual,target:item,options:shuffle([answer].concat(alternatives),rng)};
}
function buildDailyQuestions(date){
 const rng=rngFor('guess-the-daily-mix-v1|'+date);
 const pools={colors:DATA.colors||[],flags:DATA.flags||[],countries:DATA.countries||[],animals:DATA.animals||[],capitals:DATA.capitals||[],scripts:DATA.scripts||[],logos:LOGOS};
 const all=[];
 CATEGORIES.forEach(category=>{
  const pool=pools[category.key]||[];
  if(pool.length<4)throw new Error('Not enough questions for '+category.label);
  shuffle(pool,rng).slice(0,2).forEach(target=>all.push(makeQuestion(category,target,pool,rng)));
 });
 return shuffle(all,rng);
}
function svgData(svg){return 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg)}
function renderVisual(q,host){
 const add=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!=null)e.textContent=text;host.appendChild(e);return e};
 if(q.kind==='color'){host.classList.add('swatch');host.style.background=q.visual.hex;host.setAttribute('aria-label','Color swatch')}
 else if(q.kind==='flag'){const img=add('img','clue-flag');img.src='../assets/flags/'+q.visual.code+'.webp';img.alt='Mystery flag'}
 else if(q.kind==='country'){host.innerHTML='<svg class="clue-svg" viewBox="0 0 260 245" role="img" aria-label="Country silhouette"><path></path></svg>';host.querySelector('path').setAttribute('d',q.visual.path)}
 else if(q.kind==='animal'){add('div','clue-emoji',q.visual.emoji).setAttribute('aria-hidden','true')}
 else if(q.kind==='capital'){add('div','clue-emoji','🌍').setAttribute('aria-hidden','true');add('div','clue-label',q.visual.country)}
 else if(q.kind==='script'){const s=add('div','clue-text',q.visual.sample);s.dir='auto'}
 else if(q.kind==='logo'){const img=add('img','clue-logo');img.src=svgData(q.visual.svg);img.alt='Mystery brand logo'}
}
function toEngineQuestions(date){
 return buildDailyQuestions(date).map(q=>({answer:q.answer,options:q.options,prompt:q.prompt,category:q.category,render(host){renderVisual(q,host)}}));
}
window.DailyMixV1={build:buildDailyQuestions,questions:toEngineQuestions,renderVisual,todayUTC,validDate,formatDate};
})();
