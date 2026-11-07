/* Switching between Solo and With a friend from the header chip (#modeChip) in any game.
 * When nothing would be lost (no round running, no friend in the room) the link just works.
 * Otherwise it asks first: "End this round and play with a friend?" / "Leave the room and play solo?"
 * Solo rounds pause while it asks; live games keep running (the friend's clock cannot stop).
 *
 * GTQModeSwitch.attach(chip, {
 *   live: bool,                    // this page is a live room
 *   busy: () => bool,              // a round is running
 *   friendHere: () => bool,        // live only: a friend is connected
 *   pause: () => void, resume: () => void   // optional: stop and restart a solo clock
 * })
 * GTQModeSwitch.open() is true while the question is on screen (games ignore answer keys then). */
(function(){
'use strict';
let styled=false,dialog=null;
function style(){
 if(styled)return;styled=true;
 const css=document.createElement('style');
 css.textContent='.mode-switch{border:1.5px solid var(--ink,#191b1a);border-radius:24px;padding:0;width:min(100% - 32px,400px);background:var(--paper,#fffefa);color:var(--ink,#191b1a);box-shadow:6px 6px 0 var(--lime,#d7fb55)}'+
  '.mode-switch::backdrop{background:#1a1c16a6}.mode-switch .ms-box{padding:22px 20px 18px}'+
  '.mode-switch .ms-ico{display:grid;place-items:center;width:46px;height:46px;border-radius:14px;background:var(--lime,#d7fb55);border:1.5px solid var(--ink,#191b1a);font-size:22px;margin-bottom:12px}'+
  '.mode-switch h2{font-family:var(--display,system-ui);font-size:24px;line-height:1.08;letter-spacing:-.04em;margin:0 0 8px;font-weight:1000}'+
  '.mode-switch p{margin:0 0 18px;font-size:14px;line-height:1.5;color:var(--muted,#777b75)}'+
  '.mode-switch .ms-actions{display:grid;gap:8px}'+
  '.mode-switch .ms-actions a,.mode-switch .ms-actions button{display:flex;justify-content:center;align-items:center;gap:8px;border-radius:999px;padding:13px 16px;font:inherit;font-size:15px;font-weight:900;text-decoration:none;cursor:pointer}'+
  '.mode-switch .ms-go{background:var(--ink,#191b1a);color:#fff;border:1.5px solid var(--ink,#191b1a)}'+
  '.mode-switch .ms-stay{background:none;color:var(--ink,#191b1a);border:1.5px solid var(--line,#e7e5dd)}.mode-switch .ms-stay:hover{border-color:var(--ink,#191b1a)}'+
  '.mode-switch a:focus-visible,.mode-switch button:focus-visible{outline:3px solid #7871e8;outline-offset:2px}';
 document.head.appendChild(css);
}
function ask(o,href,opts){
 style();
 const toFriend=!o.live,running=opts.busy();
 const text=toFriend
  ?{ico:'⚡',title:'Play with a friend instead?',body:'This round will end and its score won’t be saved. You’ll get a room code to send your friend.',go:'Yes, play with a friend'}
  :running
   ?{ico:'🎯',title:'Leave this game and play solo?',body:'The game ends for you and your friend, and you leave the room.',go:'Yes, play solo'}
   :{ico:'🎯',title:'Leave the room and play solo?',body:'Your friend is still in this room. If you leave, they’ll need a new code to play with you.',go:'Yes, play solo'};
 const paused=running&&!o.live&&opts.pause;
 if(paused)opts.pause();
 const d=dialog=document.createElement('dialog');d.className='mode-switch';d.setAttribute('aria-labelledby','msTitle');d.setAttribute('aria-describedby','msBody');
 d.innerHTML='<div class="ms-box"><div class="ms-ico" aria-hidden="true">'+text.ico+'</div><h2 id="msTitle">'+text.title+'</h2><p id="msBody">'+text.body+'</p>'+
  '<div class="ms-actions"><a class="ms-go" id="msGo"></a><button class="ms-stay" id="msStay" type="button">'+(running?'Keep playing':'Stay here')+'</button></div></div>';
 const go=d.querySelector('#msGo');go.href=href;go.textContent=text.go+' →';
 let leaving=false;
 go.addEventListener('click',()=>{leaving=true});
 d.querySelector('#msStay').addEventListener('click',()=>d.close());
 d.addEventListener('click',e=>{if(e.target===d)d.close()});
 d.addEventListener('close',()=>{d.remove();dialog=null;if(paused&&!leaving)opts.resume()});
 document.body.appendChild(d);d.showModal();d.querySelector('#msStay').focus();
}
function attach(chip,opts){
 if(!chip)return;
 opts=Object.assign({live:false,busy:()=>false,friendHere:()=>false},opts||{});
 chip.addEventListener('click',e=>{
  const a=e.target.closest('a');
  if(!a||a.hasAttribute('aria-current')||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;
  const busy=opts.busy()||(opts.live&&opts.friendHere());
  if(!busy||!window.HTMLDialogElement)return;
  e.preventDefault();
  if(!dialog)ask(opts,a.href,opts);
 });
}
window.GTQModeSwitch={attach,open:()=>!!dialog};
})();
