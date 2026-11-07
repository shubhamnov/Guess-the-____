/* One Global / India / Both setting for the whole site, saved on this device (localStorage "gtq:region").
 * ?region=global|india|both overrides it for one visit. Live games always use Both, because a room link does not carry it.
 * The Daily Mix follows the setting: everyone with the same setting gets the same mix that day.
 * Games with India-specific content read GTQRegion.get() and filter with GTQRegion.keep(regionOfItem).
 * Items are 'india', 'global' or 'any' (always shown, e.g. geography or science). See shared/README.md.
 *
 * Where you change it:
 *  - the first visit asks once (GTQRegion.welcome, shown automatically on any page that is not live or a mix frame);
 *  - a small button at the top right of every page (GTQRegion.toggle) opens a three-way menu;
 *  - the Settings section on the home page (GTQRegion.picker).
 * Every change, wherever it is made, runs the handlers registered with GTQRegion.onChange (and passed as onChange). */
(function(){
'use strict';
const KEY='gtq:region';
const LIST=[['global','🌍 Global'],['india','🇮🇳 India'],['both','Both']];
const ICON={global:'🌍',india:'🇮🇳',both:'🌐'};
const NAME={global:'Global',india:'India',both:'Both'};
const ABOUT={india:'Bollywood, cricket, Indian shows and leaders',global:'International films, shows, sport and politics',both:'A mix of everything'};
const valid=r=>LIST.some(x=>x[0]===r);
const params=new URLSearchParams(location.search);
/* Live games are the same for both players, so they always use Both. A mix question frame (?mix) uses the region it
 * is given (?mix&region=global), else Both, never this device's setting. Neither shows a switch. */
const mix=params.has('mix'),live=params.has('live')||mix;
let stored=null;try{stored=localStorage.getItem(KEY)}catch(e){}
let current=params.get('region');
if(!valid(current)&&!mix)current=stored;
if(params.has('live')||!valid(current))current='both';
const pickers=[],toggles=[],listeners=[],afterWelcome=[];
/* The first visit asks before anything else happens (games wait for it before their clock starts). */
const asking=!live&&window.top===window&&!valid(params.get('region'))&&!valid(stored)&&!!window.HTMLDialogElement;
let styled=false;
function style(){
 if(styled)return;styled=true;
 const css=document.createElement('style');
 css.textContent='.region-pick{display:grid;grid-template-columns:repeat(3,1fr);gap:4px;padding:4px;border:1px solid var(--line,#e7e5dd);border-radius:16px;background:var(--paper,#fffefa)}'+
  '.region-pick button{border:0;background:none;border-radius:12px;padding:11px 6px;font:inherit;font-size:13px;font-weight:850;color:var(--muted,#777b75);cursor:pointer}'+
  '.region-pick button[aria-pressed="true"]{background:var(--ink,#191b1a);color:#fff}.region-pick button:focus-visible,.region-toggle button:focus-visible,.region-welcome button:focus-visible{outline:3px solid #7871e8;outline-offset:2px}'+
  '.region-toggle{position:relative;flex:none}'+
  '.region-toggle>button{display:grid;place-items:center;width:34px;height:34px;border:1px solid var(--line,#e7e5dd);background:var(--paper,#fffefa);border-radius:50%;font-size:17px;line-height:1;cursor:pointer;padding:0}'+
  '.region-menu{position:fixed;z-index:60;min-width:214px;background:var(--paper,#fffefa);border:1px solid var(--ink,#191b1a);border-radius:16px;padding:6px;box-shadow:0 14px 34px #1a1c1622}'+
  '.region-menu[hidden]{display:none}.region-menu .rm-title{font-size:10px;font-weight:900;letter-spacing:.14em;text-transform:uppercase;color:var(--muted,#777b75);padding:7px 9px 5px}'+
  '.region-menu button{display:flex;gap:9px;align-items:center;width:100%;border:0;background:none;border-radius:11px;padding:10px 9px;font:inherit;font-size:14px;font-weight:800;color:var(--ink,#191b1a);cursor:pointer;text-align:left}'+
  '.region-menu button:hover{background:#f1f0ea}.region-menu button[aria-checked="true"]{background:var(--lime,#d7fb55)}.region-menu button[aria-checked="true"]:after{content:"✓";margin-left:auto}'+
  '@media(max-width:374px){.region-toggle>button{width:28px;height:28px;font-size:15px}}'+
  '.region-welcome{border:1.5px solid var(--ink,#191b1a);border-radius:24px;padding:0;width:min(100% - 32px,420px);background:var(--paper,#fffefa);color:var(--ink,#191b1a);box-shadow:6px 6px 0 var(--ink,#191b1a)}'+
  '.region-welcome::backdrop{background:#1a1c16a6}.region-welcome .rw-box{padding:24px 20px 20px}'+
  '.region-welcome .rw-eyebrow{font-size:10px;font-weight:900;letter-spacing:.16em;text-transform:uppercase;color:var(--muted,#777b75)}'+
  '.region-welcome h2{font-family:var(--display,system-ui);font-size:27px;line-height:1.05;letter-spacing:-.04em;margin:8px 0 6px;font-weight:1000}'+
  '.region-welcome p{margin:0 0 16px;font-size:13px;line-height:1.5;color:var(--muted,#777b75)}'+
  '.region-welcome .rw-opts{display:grid;gap:8px}'+
  '.region-welcome .rw-opts button{display:grid;grid-template-columns:38px 1fr;gap:2px 10px;align-items:center;text-align:left;border:1px solid var(--line,#e7e5dd);background:#fff;border-radius:16px;padding:12px;font:inherit;color:inherit;cursor:pointer}'+
  '.region-welcome .rw-opts button:hover{border-color:var(--ink,#191b1a)}'+
  '.region-welcome .rw-opts span{grid-row:span 2;font-size:26px;text-align:center}.region-welcome .rw-opts b{font-size:16px}.region-welcome .rw-opts small{font-size:12px;color:var(--muted,#777b75)}'+
  '.region-welcome .rw-foot{margin:14px 0 0;font-size:11px;text-align:center}';
 document.head.appendChild(css);
}
function sync(){
 pickers.forEach(p=>p.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.region===current))));
 toggles.forEach(t=>{const b=t.firstChild;b.textContent=ICON[current];b.setAttribute('aria-label','Questions from: '+NAME[current]+'. Change');b.title='Questions from: '+NAME[current];
  t.querySelectorAll('[data-region]').forEach(x=>x.setAttribute('aria-checked',String(x.dataset.region===current)))});
}
function save(r){stored=r;try{localStorage.setItem(KEY,r)}catch(e){}}
function set(r){
 if(!valid(r))return;
 save(r);
 if(r===current)return;
 current=r;sync();
 listeners.forEach(fn=>fn(r));
}
/* A three-way switch for a settings section. */
function picker(opts){
 opts=opts||{};style();
 if(opts.onChange)listeners.push(opts.onChange);
 const p=document.createElement('div');p.className='region-pick';
 p.setAttribute('role','group');p.setAttribute('aria-label',opts.label||'Which questions: Global, India or both');
 p.innerHTML=LIST.map(r=>'<button type="button" data-region="'+r[0]+'" aria-pressed="'+(r[0]===current)+'">'+r[1]+'</button>').join('');
 p.addEventListener('click',e=>{const b=e.target.closest('button');if(b)set(b.dataset.region)});
 pickers.push(p);return p;
}
/* A small round button for the top right of a page: shows 🇮🇳 / 🌍 / 🌐 and opens a menu with the three choices. */
function toggle(opts){
 opts=opts||{};style();
 if(opts.onChange)listeners.push(opts.onChange);
 const t=document.createElement('div');t.className='region-toggle';
 const b=document.createElement('button');b.type='button';b.className='region-btn';b.setAttribute('aria-haspopup','menu');b.setAttribute('aria-expanded','false');
 const m=document.createElement('div');m.className='region-menu';m.setAttribute('role','menu');m.hidden=true;
 m.innerHTML='<div class="rm-title">Questions from</div>'+LIST.map(r=>'<button type="button" role="menuitemradio" data-region="'+r[0]+'">'+ICON[r[0]]+' '+NAME[r[0]]+'</button>').join('');
 t.append(b,m);
 const close=()=>{m.hidden=true;b.setAttribute('aria-expanded','false')};
 /* The menu hangs below the button, kept inside the screen (the button can sit mid-header on a phone). */
 const place=()=>{const r=b.getBoundingClientRect(),w=m.offsetWidth;m.style.top=(r.bottom+6)+'px';m.style.left=Math.max(8,Math.min(r.right-w,innerWidth-w-8))+'px'};
 b.addEventListener('click',e=>{e.stopPropagation();const open=m.hidden;m.hidden=!open;b.setAttribute('aria-expanded',String(open));if(open){place();m.querySelector('[aria-checked="true"]')?.focus()}});
 addEventListener('resize',()=>{if(!m.hidden)place()});addEventListener('scroll',()=>{if(!m.hidden)place()},{passive:true});
 m.addEventListener('click',e=>{const x=e.target.closest('[data-region]');if(!x)return;e.stopPropagation();close();set(x.dataset.region);b.focus()});
 document.addEventListener('click',e=>{if(!t.contains(e.target))close()});
 t.addEventListener('keydown',e=>{if(e.key==='Escape'&&!m.hidden){e.stopPropagation();close();b.focus()}});
 toggles.push(t);sync();return t;
}
/* First visit: ask once. Closing it without choosing keeps Both, and it is not asked again. */
function welcome(){
 if(!asking||document.querySelector('dialog.region-welcome'))return;
 style();
 const d=document.createElement('dialog');d.className='region-welcome';d.setAttribute('aria-labelledby','rwTitle');
 d.innerHTML='<div class="rw-box"><div class="rw-eyebrow">Welcome to Guess the ?</div><h2 id="rwTitle">Which questions do you want?</h2>'+
  '<p>Some games have Indian and international questions. Pick what suits you.</p><div class="rw-opts">'+
  ['india','global','both'].map(r=>'<button type="button" data-region="'+r+'"><span aria-hidden="true">'+ICON[r]+'</span><b>'+NAME[r]+'</b><small>'+ABOUT[r]+'</small></button>').join('')+
  '</div><p class="rw-foot">Change it any time with the '+ICON.both+' button at the top right.</p></div>';
 d.addEventListener('click',e=>{const b=e.target.closest('[data-region]');if(!b)return;d.close();set(b.dataset.region)});
 d.addEventListener('close',()=>{if(!valid(stored))save(current);d.remove();afterWelcome.splice(0).forEach(fn=>fn())});
 document.body.appendChild(d);d.showModal();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',welcome);else setTimeout(welcome);
window.GTQRegion={
 KEY,LIST,ICON,NAME,live,
 get:()=>current,
 /* True once this device has a saved choice. */
 chosen:()=>valid(stored),
 /* True while the first-visit question is (about to be) on screen; then(fn) runs fn once it is answered. */
 asking:()=>asking&&!valid(stored),
 afterWelcome(fn){if(this.asking())afterWelcome.push(fn);else fn()},
 set,picker,toggle,welcome,
 onChange(fn){listeners.push(fn)},
 /* True when an item of this region belongs in the current setting. */
 keep:(itemRegion,r)=>{r=r||current;return r==='both'||!itemRegion||itemRegion==='any'||itemRegion===r},
 /* Prefix for a game's note, e.g. "Indian questions only: ". */
 notePrefix:r=>{r=r||current;return r==='global'?'International questions only: ':r==='india'?'Indian questions only: ':''}
};
})();
