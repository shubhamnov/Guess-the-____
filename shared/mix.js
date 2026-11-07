/* Questions from every game for the Daily Mix and the Live Mix (needs shared/games.js).
 * Each game in GTQ_GAMES is loaded in a hidden iframe with ?mix. There the engine builds no page; it only hands out
 * questions from the game's own code (see "Mix export" in engine.js). The game's styles are copied into this page
 * so its clues look the same here. A game that fails to load within 20 seconds is left out of the mix.
 * GTQMix.load(region, cat) → Promise (starts once; call it early). region 'global' or 'india' leaves out games for the
 * other region and has each game ask only its questions for that region; Both (the default) asks everything.
 * cat (optional) keeps only the games of that category (a category mix). Topics marked sub are always left out:
 * their questions are already in another game. GTQMix.questions(seed, perGame) → shuffled list, the same
 * for the same seed on every device. GTQMix.games() → the games that loaded. */
(function(){
'use strict';
const ROOT=new URL('../',(document.currentScript&&document.currentScript.src)||location.href);
const TIMEOUT=20000;
function hashSeed(seed){let h=2166136261;for(let i=0;i<seed.length;i++){h^=seed.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
function rngFor(seed){let state=hashSeed(String(seed));return function(){state=(state+0x6D2B79F5)|0;let t=state;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296}}
let loading=null,loaded=[],region='both',category=null;
const inRegion=g=>region==='both'||!g.region||g.region==='any'||g.region===region;
/* The games a mix plays: not sub, in the region, and in the category when one is set. */
const inMix=g=>!g.sub&&inRegion(g)&&(!category||g.cat===category);
const styles=new Set();
function addStyles(doc){
 doc.querySelectorAll('style').forEach(s=>{const css=s.textContent;if(!css.trim()||styles.has(css))return;styles.add(css);
  const copy=document.createElement('style');copy.dataset.mixStyle='';
  // Fonts and images in the game's CSS are relative to the game's page, not this one.
  copy.textContent=css.replace(/url\((['"]?)(?!data:|blob:|[a-z]+:\/\/|#)([^'")]+)\1\)/gi,(m,q,u)=>'url('+q+new URL(u,doc.baseURI).href+q+')');document.head.appendChild(copy)});
}
function loadGame(game){
 return new Promise((resolve,reject)=>{
  const frame=document.createElement('iframe');
  frame.title=game.label+' questions';frame.setAttribute('aria-hidden','true');frame.tabIndex=-1;
  frame.style.cssText='position:absolute;width:1px;height:1px;left:-9999px;top:0;border:0;visibility:hidden';
  const timer=setTimeout(()=>reject(new Error(game.path+' timed out')),TIMEOUT);
  frame.addEventListener('load',()=>{
   let exp;try{exp=frame.contentWindow.GuessGameExport}catch(e){}
   if(!exp){clearTimeout(timer);reject(new Error(game.path+' has no mix export'));return}
   exp.ready.then(()=>{clearTimeout(timer);addStyles(frame.contentDocument);resolve(Object.assign({},game,{exp}))},e=>{clearTimeout(timer);reject(e)});
  });
  frame.src=new URL(game.path+'/?mix'+(region==='both'?'':'&region='+region),ROOT).href;
  document.body.appendChild(frame);
 });
}
function load(r,cat){
 if(!loading){
  if(r==='global'||r==='india')region=r;
  if(cat)category=cat;
  const css=document.createElement('style');
  // Photo clues open a full-screen view inside their own (hidden) frame, so the enlarge button is not offered here.
  css.textContent='.clue .photo-zoom{display:none}.clue img{cursor:default!important}';document.head.appendChild(css);
  loading=Promise.all((window.GTQ_GAMES||[]).filter(inMix).map(g=>loadGame(g).catch(e=>{console.warn('Mix: left out',e.message);return null})))
   .then(list=>{loaded=list.filter(Boolean);if(!loaded.length){loading=null;throw new Error('No games could be loaded')}return loaded});
 }
 return loading;
}
function questions(seed,perGame){
 const out=[];
 loaded.forEach(g=>{
  let qs=[];try{qs=g.exp.questions(seed,perGame||1)}catch(e){console.warn('Mix: no question from',g.path,e)}
  qs.forEach(q=>{q.category=g.emoji+' '+g.label;out.push(q)});
 });
 const rng=rngFor('guess-the-mix-v2|order|'+seed);
 for(let i=out.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[out[i],out[j]]=[out[j],out[i]]}
 return out;
}
window.GTQMix={load,questions,games:()=>loaded.slice(),inRegion,inMix,region:()=>region};
})();
