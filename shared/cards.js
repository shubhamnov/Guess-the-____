/* The home page and the category pages (needs shared/region.js and shared/games.js).
 * - Cards with data-play open the "How do you want to play?" sheet: Solo, or With a friend (?live=new makes a room).
 * - Cards with data-id show the best score saved on this device (gtq:best:<id>, written by shared/engine.js).
 * - Cards with data-region are hidden when the Global / India / Both setting leaves them out (a game that is all Indian);
 *   the topic counts follow.
 * - #recent (home) lists the games played last ("Jump back in", gtq:recent, written by shared/engine.js). */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const read=k=>{try{return localStorage.getItem(k)}catch(e){return null}};
const best=id=>Number(read('gtq:best:'+id))||0;
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

/* ---------- Solo / With a friend sheet ---------- */
const sheet=document.createElement('dialog');
sheet.className='mode-sheet';sheet.id='modeSheet';sheet.setAttribute('aria-labelledby','sheetTitle');
sheet.innerHTML='<div class="sheet-box"><button class="sheet-close" type="button" id="sheetClose" aria-label="Close">×</button>'+
 '<div class="eyebrow">How do you want to play?</div><h2 id="sheetTitle"></h2>'+
 '<a class="sheet-opt solo" id="sheetSolo" href="#"><span class="ico" aria-hidden="true">🎯</span><span><b>Solo</b><small>60 seconds. Beat your best score.</small></span><span class="arrow" aria-hidden="true">→</span></a>'+
 '<a class="sheet-opt friend" id="sheetFriend" href="#"><span class="ico" aria-hidden="true">⚡</span><span><b>With a friend</b><small>Send a room code. Race live on the same questions.</small></span><span class="arrow" aria-hidden="true">→</span></a></div>';
document.body.appendChild(sheet);
function openSheet(href,title){
 $('sheetTitle').textContent=title;$('sheetSolo').href=href;$('sheetFriend').href=href+'?live=new';
 sheet.showModal();$('sheetSolo').focus();
}
document.addEventListener('click',e=>{
 const card=e.target.closest('[data-play]');
 if(!card||!sheet.showModal||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey||e.button)return;
 e.preventDefault();
 const h=card.querySelector('h2');
 openSheet(card.getAttribute('href'),card.dataset.title||(h&&h.textContent)||card.textContent.trim());
});
$('sheetClose').addEventListener('click',()=>sheet.close());
sheet.addEventListener('click',e=>{if(e.target===sheet)sheet.close()});

/* ---------- Best scores ---------- */
function showBests(){
 document.querySelectorAll('[data-id]').forEach(card=>{
  const n=best(card.dataset.id);
  card.querySelectorAll('.tag-best,.mix-best').forEach(x=>x.remove());
  if(!n)return;
  const meta=card.querySelector('.meta');
  if(meta)meta.insertAdjacentHTML('afterbegin','<span class="tag tag-best">Best '+n+'</span>');
  else{const s=card.querySelector('small');if(s)s.insertAdjacentHTML('beforeend','<span class="mix-best"> · Best '+n+'</span>')}
 });
}

/* ---------- Region ---------- */
const games=window.GTQ_GAMES||[];
function apply(r){
 document.querySelectorAll('.game-card[data-region]').forEach(c=>{c.hidden=!GTQRegion.keep(c.dataset.region,r)});
 const shown=document.querySelectorAll('.choices .game-card:not([hidden])').length;
 if($('topicCount'))$('topicCount').textContent=shown;
 if($('mixNote'))$('mixNote').firstChild.textContent='Questions from all '+shown+' topics';
 /* A category's topics, not counting Guess the Sports, which is the Sports mix. */
 const cats=window.GTQ_CATEGORIES||[];
 document.querySelectorAll('[data-topics]').forEach(el=>{const c=cats.find(x=>x.id===el.dataset.topics);
  el.textContent=games.filter(g=>g.cat===el.dataset.topics&&(!c||g.path!==c.mix)&&GTQRegion.keep(g.region,r)).length});
 renderRecent(r);
}

/* ---------- Jump back in ---------- */
function renderRecent(r){
 const box=$('recent');if(!box)return;
 let list=[];try{list=JSON.parse(read('gtq:recent')||'[]')}catch(e){}
 if(!Array.isArray(list))list=[];
 const byPath=new Map(games.map(g=>[g.path,g]));
 list=list.filter(x=>x&&typeof x.href==='string'&&x.label).filter(x=>{
  const g=byPath.get(x.href.replace(/index\.html$/,'').replace(/\/+$/,'').split('/').pop());
  return !g||GTQRegion.keep(g.region,r);
 }).slice(0,4);
 box.hidden=!list.length;
 box.querySelector('.recent-row').innerHTML=list.map(x=>{
  const n=x.id?best(x.id):0;
  return '<a class="recent-chip" data-play data-title="'+esc(x.label)+'" href="'+esc(x.href)+'"><span class="rc-ico" aria-hidden="true">'+esc(x.emoji||'🎯')+'</span><span><b>'+esc(x.label)+'</b><small>'+(n?'Best '+n:'Play again')+'</small></span></a>';
 }).join('');
}

if($('topActions'))$('topActions').appendChild(GTQRegion.toggle());
GTQRegion.onChange(apply);
apply(GTQRegion.get());showBests();
/* Coming back with the back button shows the page from cache: refresh scores and settings. */
window.addEventListener('pageshow',e=>{if(e.persisted)location.reload();else if(sheet.open)sheet.close()});

/* Brand logo previews (General Knowledge): drawn from brand-logos-preview.js when the page loads it. */
const logos=window.BRAND_LOGOS_PREVIEW||[];
document.querySelectorAll('.brand-visual [data-preview-slug]').forEach(img=>{
 const item=logos.find(x=>x.slug===img.dataset.previewSlug);
 if(item)img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(item.svg);
});
window.GTQCards={openSheet,apply};
})();
