/* One Global / India / Both setting for the whole site, saved on this device (localStorage "gtq:region").
 * ?region=global|india|both overrides it for one visit. Live games always use Both, because a room link does not carry it.
 * The Daily Mix follows the setting: everyone with the same setting gets the same mix that day.
 * Games with India-specific content read GTQRegion.get() and filter with GTQRegion.keep(regionOfItem).
 * Items are 'india', 'global' or 'any' (always shown, e.g. geography or science). See shared/README.md. */
(function(){
'use strict';
const KEY='gtq:region';
const LIST=[['global','🌍 Global'],['india','🇮🇳 India'],['both','Both']];
const valid=r=>LIST.some(x=>x[0]===r);
const params=new URLSearchParams(location.search);
/* Live games are the same for both players, so they always use Both. A mix question frame (?mix) uses the region it
 * is given (?mix&region=global), else Both, never this device's setting. Neither shows a switch. */
const mix=params.has('mix'),live=params.has('live')||mix;
let current=params.get('region');
if(!valid(current)&&!mix){try{current=localStorage.getItem(KEY)}catch(e){current=null}}
if(params.has('live')||!valid(current))current='both';
const pickers=[],listeners=[];
let styled=false;
function style(){
 if(styled)return;styled=true;
 const css=document.createElement('style');
 css.textContent='.region-pick{display:grid;grid-template-columns:repeat(3,1fr);gap:4px;padding:4px;border:1px solid var(--line,#e7e5dd);border-radius:16px;background:var(--paper,#fffefa)}'+
  '.region-pick button{border:0;background:none;border-radius:12px;padding:11px 6px;font:inherit;font-size:13px;font-weight:850;color:var(--muted,#777b75);cursor:pointer}'+
  '.region-pick.compact{padding:3px;border-radius:14px}.region-pick.compact button{padding:7px 6px;font-size:12px}'+
  '.region-pick button[aria-pressed="true"]{background:var(--ink,#191b1a);color:#fff}.region-pick button:focus-visible{outline:3px solid #7871e8;outline-offset:2px}';
 document.head.appendChild(css);
}
function set(r){
 if(!valid(r)||r===current)return;
 current=r;try{localStorage.setItem(KEY,r)}catch(e){}
 pickers.forEach(p=>p.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.region===r))));
 listeners.forEach(fn=>fn(r));
}
/* A three-way switch. onChange(region, pickerElement) runs after the setting changes (every picker on the page updates). */
function picker(opts){
 opts=opts||{};style();
 const p=document.createElement('div');p.className='region-pick'+(opts.compact?' compact':'');
 p.setAttribute('role','group');p.setAttribute('aria-label',opts.label||'Which questions: Global, India or both');
 p.innerHTML=LIST.map(r=>'<button type="button" data-region="'+r[0]+'" aria-pressed="'+(r[0]===current)+'">'+r[1]+'</button>').join('');
 p.addEventListener('click',e=>{const b=e.target.closest('button');if(!b||b.dataset.region===current)return;set(b.dataset.region);if(opts.onChange)opts.onChange(current,p)});
 pickers.push(p);return p;
}
window.GTQRegion={
 KEY,LIST,live,
 get:()=>current,
 set,picker,
 onChange(fn){listeners.push(fn)},
 /* True when an item of this region belongs in the current setting. */
 keep:(itemRegion,r)=>{r=r||current;return r==='both'||!itemRegion||itemRegion==='any'||itemRegion===r},
 /* Prefix for a game's note, e.g. "Indian questions only: ". */
 notePrefix:r=>{r=r||current;return r==='global'?'International questions only: ':r==='india'?'Indian questions only: ':''}
};
})();
