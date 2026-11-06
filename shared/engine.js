/* Guess the ____ shared game engine.
 * Every game uses the same scoring, timer, sound, keyboard controls, best-score storage and share card.
 * A game page calls GuessGame.run(config); see shared/README.md for the config fields. */
(function(){
'use strict';

/* ---------- Scoring: identical in every game ---------- */
/* Every game lasts 60 seconds: +10 for a right answer, −5 for a wrong one. Totals can go below zero. */
const SCORING={correct:10,wrong:-5,seconds:60};
function pointsFor(right){return right?SCORING.correct:SCORING.wrong}
const RULES_TEXT='60 seconds · +10 for a right answer · −5 for a wrong one';
function signed(n){return n>0?'+'+n:'−'+Math.abs(n)}

/* ---------- Small helpers ---------- */
const $=id=>document.getElementById(id);
const PARAMS=new URLSearchParams(location.search);
/* Folder this script was loaded from, so live mode can load its extra files from the same place. */
const SCRIPT_BASE=((document.currentScript&&document.currentScript.src)||'').replace(/[^/]*$/,'');
/* Seeded random numbers. In live mode both players use the same seed, so every game builds the same questions. */
function hashSeed(seed){let h=2166136261;for(let i=0;i<seed.length;i++){h^=seed.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
function rngFor(seed){let state=hashSeed(String(seed));return function(){state=(state+0x6D2B79F5)|0;let t=state;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296}}
function loadScript(src){return new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.onload=resolve;s.onerror=()=>reject(new Error('Could not load '+src));document.head.appendChild(s)})}
function safeGet(k){try{return localStorage.getItem(k)}catch(e){return null}}
function safeSet(k,v){try{localStorage.setItem(k,String(v))}catch(e){}}
function shuffle(items,rng){const a=items.slice(),r=rng||Math.random;for(let i=a.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function pick(items,rng){return items[Math.floor((rng||Math.random)()*items.length)]}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function el(tag,cls,text){const e=document.createElement(tag);if(cls)e.className=cls;if(text!=null)e.textContent=text;return e}
/* Photo clues: show the whole photo (no cropping) over a blurred copy that fills the box, and open it full screen on tap. */
function framePhoto(host,img){
 const fill=el('img','clue-photo-fill');fill.alt='';fill.setAttribute('aria-hidden','true');fill.src=img.src;host.insertBefore(fill,img);
 const zoom=el('button','photo-zoom','⤢ Enlarge');zoom.type='button';host.appendChild(zoom);
 const open=()=>{
  const box=el('div','lightbox');box.setAttribute('role','dialog');box.setAttribute('aria-label','Enlarged photo');
  const big=el('img');big.src=img.src;big.alt=img.alt;const close=el('button','lightbox-close','✕ Close');close.type='button';
  box.append(big,close);document.body.appendChild(box);close.focus({preventScroll:true});
  const done=()=>{box.remove();document.removeEventListener('keydown',onKey,true);zoom.focus({preventScroll:true})};
  const onKey=e=>{e.preventDefault();e.stopPropagation();done()};
  box.addEventListener('click',done);document.addEventListener('keydown',onKey,true);
 };
 zoom.addEventListener('click',open);img.addEventListener('click',open);img.style.cursor='zoom-in';
}
/* A large text clue (used when the question shows a name and the answers are pictures). */
function bigClue(host,text,sub){host.appendChild(el('div','clue-big',text));if(sub)host.appendChild(el('div','clue-sub',sub))}

/* Draws items without repeats until the pool is exhausted. */
function deck(pool,keyOf){
 const used=new Set();
 return {
  draw(filter){
   let options=pool.filter(x=>!used.has(keyOf(x))&&(!filter||filter(x)));
   if(!options.length&&filter)options=pool.filter(x=>!used.has(keyOf(x)));
   if(!options.length){used.clear();options=filter?pool.filter(filter):pool.slice();if(!options.length)options=pool.slice()}
   const item=pick(options);used.add(keyOf(item));return item;
  },
  reset(){used.clear()}
 };
}
/* Four unique answer choices. When `hard` is set and a group is given, wrong answers come from the same group first. */
function choices(item,pool,opts){
 const answerOf=opts.answer,answer=answerOf(item),groupOf=opts.group,count=opts.count||4;
 const seen=new Set([answer]),out=[answer];
 const others=shuffle(pool.filter(x=>answerOf(x)!==answer),opts.rng);
 const ordered=opts.hard&&groupOf?others.filter(x=>groupOf(x)===groupOf(item)).concat(others.filter(x=>groupOf(x)!==groupOf(item))):others;
 for(const x of ordered){const a=answerOf(x);if(!seen.has(a)){seen.add(a);out.push(a)}if(out.length>=count)break}
 return shuffle(out,opts.rng);
}

/* ---------- Best scores ---------- */
function readCookie(name){const part=document.cookie.split('; ').find(v=>v.startsWith(name+'='));if(!part)return null;try{return decodeURIComponent(part.slice(name.length+1))}catch(e){return null}}
function bestKey(id){return 'gtq:best:'+id}
/* Older versions saved bests under per-game keys, some counting 1 point per answer. Those are converted once (×scale). */
function loadBest(id,legacy){
 const stored=safeGet(bestKey(id));
 if(stored!==null)return Number(stored)||0;
 let best=0;
 (legacy||[]).forEach(src=>{
  let raw=null;
  if(src.cookie){try{raw=(JSON.parse(readCookie(src.cookie)||'{}')||{})[src.field]}catch(e){}}
  else raw=safeGet(src.key);
  const n=Number(raw)||0;best=Math.max(best,Math.round(n*(src.scale||1)));
 });
 safeSet(bestKey(id),best);
 return best;
}

/* ---------- Sound: one AudioContext for the whole page ---------- */
const SOUND_KEY='gtq_sound';
if(safeGet(SOUND_KEY)===null&&safeGet('guessTheSound')!==null)safeSet(SOUND_KEY,safeGet('guessTheSound'));
const sound={
 on:safeGet(SOUND_KEY)!=='off',ctx:null,music:null,sfx:null,musicTimer:null,step:0,
 /* Browsers only allow audio after the player taps or presses a key, so nothing is created before that. */
 unlocked:false,wantsMusic:false,
 ready(){
  if(!this.on||!this.unlocked)return false;
  try{
   const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return false;
   if(!this.ctx){this.ctx=new AC();const master=this.ctx.createGain();master.gain.value=.75;master.connect(this.ctx.destination);this.music=this.ctx.createGain();this.music.gain.value=.18;this.music.connect(master);this.sfx=this.ctx.createGain();this.sfx.gain.value=.8;this.sfx.connect(master)}
   if(this.ctx.state==='suspended')this.ctx.resume();
   return true;
  }catch(e){return false}
 },
 tone(freq,at,dur,type,vol,dest,slideTo){
  const c=this.ctx;if(!c)return;
  try{const o=c.createOscillator(),g=c.createGain();o.type=type||'triangle';o.frequency.setValueAtTime(freq,at);if(slideTo)o.frequency.exponentialRampToValueAtTime(slideTo,at+dur*.85);g.gain.setValueAtTime(.0001,at);g.gain.exponentialRampToValueAtTime(Math.max(.0002,vol),at+.018);g.gain.exponentialRampToValueAtTime(.0001,at+dur);o.connect(g);g.connect(dest||this.sfx);o.start(at);o.stop(at+dur+.03)}catch(e){}
 },
 correct(bonus){if(!this.ready())return;const t=this.ctx.currentTime+.015;this.tone(523.25,t,.12,'sine',.42);this.tone(659.25,t+.085,.13,'sine',.38);this.tone(783.99,t+.17,.19,'triangle',.35);if(bonus)this.tone(1046.5,t+.26,.16,'sine',.25)},
 wrong(){if(!this.ready())return;const t=this.ctx.currentTime+.015;this.tone(190,t,.17,'square',.2,null,138);this.tone(138,t+.045,.13,'triangle',.14,null,112)},
 startMusic(){
  this.wantsMusic=true;
  if(!this.ready()||this.musicTimer)return;
  const notes=[261.63,329.63,392,493.88,392,329.63,293.66,349.23,440,523.25,440,349.23,261.63,329.63,392,440];
  const tick=()=>{if(!this.ctx||!this.on)return;const i=this.step%notes.length,t=this.ctx.currentTime+.02;this.tone(notes[i],t,.23,'triangle',.38,this.music);if(i%4===0)this.tone(notes[i]*.5,t,.34,'sine',.28,this.music);this.step++};
  this.step=0;tick();this.musicTimer=setInterval(tick,300);
 },
 stopMusic(){this.wantsMusic=false;if(this.musicTimer){clearInterval(this.musicTimer);this.musicTimer=null}}
};
function unlockAudio(){if(sound.unlocked)return;sound.unlocked=true;if(sound.wantsMusic)sound.startMusic()}
['pointerdown','keydown'].forEach(type=>window.addEventListener(type,unlockAudio,{capture:true,once:true}));

/* ---------- Share card ---------- */
function roundRect(c,x,y,w,h,r,fill,stroke){c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath();if(fill){c.fillStyle=fill;c.fill()}if(stroke){c.strokeStyle=stroke;c.lineWidth=2;c.stroke()}}
function scoreImage(card){
 const canvas=document.createElement('canvas');canvas.width=1080;canvas.height=1350;
 const c=canvas.getContext('2d');if(!c)return Promise.reject(new Error('Canvas unavailable'));
 const ink='#191b1a',muted='#777b75',paper='#fffefa',line='#e7e5dd',lime='#d7fb55';
 const text=(v,x,y,size,weight,color,align)=>{c.font=weight+' '+size+'px system-ui,-apple-system,"Segoe UI",Arial,sans-serif';c.fillStyle=color;c.textAlign=align||'left';c.fillText(String(v),x,y)};
 c.fillStyle='#f8f7f2';c.fillRect(0,0,1080,1350);
 c.fillStyle=lime;c.beginPath();c.arc(1000,60,115,0,Math.PI*2);c.fill();c.beginPath();c.arc(1020,1250,95,0,Math.PI*2);c.fill();
 roundRect(c,62,58,956,123,28,paper,line);
 text('GUESS THE',100,133,40,950,ink);roundRect(c,330,90,56,56,14,lime,null);text('?',358,133,40,950,ink,'center');
 text(card.label.toUpperCase(),980,131,24,850,muted,'right');
 text('MY SCORE',72,285,26,900,muted);text(card.score,62,500,200,950,ink);text('POINTS',78,556,24,900,muted);
 roundRect(c,62,610,956,300,32,paper,line);text(card.headline,100,690,40,900,ink);
 roundRect(c,100,722,880,12,6,lime,null);text(card.rules,100,800,22,700,muted);text(card.format,100,850,22,700,muted);
 [['ACCURACY',card.accuracy],['CORRECT',card.correct],['BEST STREAK',card.bestStreak]].forEach((s,i)=>{const x=62+i*(306+19);roundRect(c,x,950,306,128,22,paper,line);text(s[0],x+24,995,18,900,muted);text(s[1],x+24,1050,44,900,ink)});
 roundRect(c,62,1120,956,150,26,ink,null);text('CAN YOU BEAT ME?',100,1185,32,900,'#ffffff');text(card.url,100,1233,20,600,'#d8dbd2');
 roundRect(c,858,1163,120,64,22,lime,null);text('PLAY ↗',918,1205,21,950,ink,'center');
 return new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('Could not create image')),'image/png'));
}

/* ---------- The game ---------- */
function run(cfg){
 // Questions come either from next(ctx), one at a time, or from a prepared list (makeRound). The clock is the same.
 const fromList=typeof cfg.makeRound==='function';
 /* Live mode (?live on any game, or cfg.live): play the same questions as a friend on another device. See shared/live.js. */
 const live=!!cfg.live||PARAMS.has('live');
 if(live){cfg.autoStart=false;cfg.replay=false;cfg.pauseWhenHidden=false}
 let liveHooks=null;
 const seconds=SCORING.seconds;
 const label=cfg.label;
 const homeHref=cfg.homeHref||'../';
 let best=loadBest(cfg.id,cfg.legacyBest);
 const S={rng:null,seed:null,running:false,score:0,correct:0,answered:0,streak:0,bestStreak:0,n:0,q:null,locked:true,round:[],startedAt:0,pausedAt:0,timer:null,advance:null};

 /* Solo / With a friend: every game shows which mode you are in (header chip) and offers the other one at the end. */
 const friendOn=!live&&cfg.liveLink!==false;
 const modeChip=cfg.liveLink===false&&!live?'<div class="pill">'+escapeHtml(cfg.pill||label)+'</div>':
  '<nav class="mode-chip" id="modeChip" aria-label="How you’re playing"><a href="'+escapeHtml(cfg.live?homeHref:location.pathname)+'"'+(live?'':' aria-current="page"')+'>Solo</a>'+
  '<a href="?live=new"'+(live?' aria-current="page"':'')+'><span aria-hidden="true">⚡</span> <span class="mc-long">With a friend</span><span class="mc-short">Friend</span></a></nav>';
 const friendBtn=id=>friendOn?'<a class="friend-btn" id="'+id+'" href="?live=new"><span>⚡ '+escapeHtml(id==='friendIntroBtn'&&cfg.friendText||'Play with a friend')+'</span></a>':'';
 const links=(cfg.links||[]).map(l=>'<span>·</span><a href="'+l.href+'"'+(l.external?' target="_blank" rel="noopener noreferrer"':'')+'>'+escapeHtml(l.text)+'</a>').join('');
 document.body.insertAdjacentHTML('afterbegin',
 '<main class="shell">'+
 '<header class="top"><a class="brand" href="'+homeHref+'" aria-label="Guess the ____ — all games">GUESS THE <span>?</span></a><div class="top-actions">'+modeChip+'<button class="sound-toggle" id="soundToggle" type="button"></button></div></header>'+
 '<section class="intro" id="intro"><div class="hero"><div class="eyebrow" id="introEyebrow">'+escapeHtml(cfg.eyebrow||'')+'</div><h1>'+cfg.titleHtml+'</h1><p>'+escapeHtml(cfg.intro||'')+'</p></div>'+
 (cfg.previewHtml?'<div class="preview" aria-hidden="true">'+cfg.previewHtml+'</div>':'')+
 '<button class="primary" id="startBtn" type="button">Let’s play <span class="arrow">→</span></button>'+
 friendBtn('friendIntroBtn')+
 '<div class="rules"><span>'+seconds+' seconds</span>'+(cfg.formats&&cfg.formats.length>1?'<span>'+cfg.formats.length+' question types</span>':'')+'<span>4 choices</span><span>+10 right</span><span>−5 wrong</span></div>'+
 (cfg.formats&&cfg.formats.length>1?'<div class="micro formats">'+cfg.formats.map(f=>'<span>'+escapeHtml(f)+'</span>').join('')+'</div>':'')+
 '<div class="micro" id="introNote">'+escapeHtml(cfg.note||'')+(cfg.note?'<br>':'')+'Personal best saved on this device.</div>'+
 '<nav class="links" aria-label="More games"><a href="'+homeHref+'">All games</a>'+links+'</nav></section>'+
 '<section class="game" id="game" aria-label="'+escapeHtml(label)+' quiz">'+
 '<div class="stats"><div class="stat timer" id="timerStat"><label>Time left</label><strong id="time">'+seconds+'</strong></div>'+
 '<div class="stat"><label>Score</label><strong id="score">0</strong></div><div class="stat"><label>Streak</label><strong id="streak">0</strong></div></div>'+
 '<div class="track" aria-hidden="true"><span id="timebar"></span></div>'+
 '<div class="question-head"><span class="eyebrow" id="roundLabel"></span><span class="level" id="level"></span></div>'+
 '<div class="clue" id="clue"></div><div class="credit" id="credit"></div>'+
 '<p class="prompt" id="prompt"></p><div class="answers" id="answers" aria-label="Answer choices"></div>'+
 '<div class="feedback" id="feedback" role="status" aria-live="polite"></div>'+
 '<div class="micro keys-hint">Keys 1–4 answer · Enter plays again · M toggles sound</div></section>'+
 '<section class="result" id="result" aria-label="Your final score"><div class="result-modal">'+
 '<a class="result-home" href="'+homeHref+'" aria-label="Home: all games" title="All games"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 11.2 12 4l8.5 7.2M6 9.5V20h4.5v-5.5h3V20H18V9.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg></a>'+
 '<div><div class="eyebrow" id="resultEyebrow"></div><div class="bigscore" id="finalScore">0</div><h2 id="resultTitle"></h2><p id="resultText"></p></div>'+
 '<div class="resultbox"><div><label>Personal best</label><strong id="resultBest">0</strong></div><div><label>Accuracy</label><strong id="accuracy">0%</strong></div><div><label>Correct</label><strong id="correctCount">0</strong></div><div><label>Best streak</label><strong id="bestStreak">0</strong></div></div>'+
 '<div class="result-actions">'+friendBtn('friendBtn')+'<button class="secondary" id="shareBtn" type="button">Share score ↗</button></div><button class="primary" id="againBtn" type="button">Play again <span class="arrow">↻</span></button>'+
 '<nav class="links"><a href="'+homeHref+'">All games</a>'+links+'</nav></div></section>'+
 '<footer class="bottomline"><span>GUESS THE ?</span><a class="creator-credit" href="https://github.com/shubhamnov" target="_blank" rel="noopener noreferrer">MADE BY SHUBHAM ↗</a></footer></main>'+
 '<div class="toast" id="toast" role="status"></div>');

 let toastTimer=null;
 function toast(msg){const t=$('toast');t.textContent=msg;t.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove('show'),2600)}
 function renderSound(){const b=$('soundToggle');b.innerHTML='♫<span class="st-word"> SOUND</span> '+(sound.on?'ON':'OFF');b.setAttribute('aria-pressed',String(sound.on));b.setAttribute('aria-label',sound.on?'Sound on — select to mute':'Sound off — select to turn on')}
 function toggleSound(){sound.on=!sound.on;safeSet(SOUND_KEY,sound.on?'on':'off');renderSound();if(sound.on&&S.running)sound.startMusic();else if(!sound.on)sound.stopMusic()}
 renderSound();$('soundToggle').addEventListener('click',toggleSound);

 const ctx={util:{shuffle,pick,deck,choices,bigClue,framePhoto},get n(){return S.n},get score(){return S.score},get correct(){return S.correct},get answered(){return S.answered},get streak(){return S.streak},get hard(){return S.n>4},
  /* In live mode the clock differs between the two devices, so games that get harder over time see a clock based on
   * the question number instead (2.5 seconds per question), and both players get the same questions. */
  get live(){return !!S.rng},get seed(){return S.seed},get elapsed(){return S.rng?Math.min(seconds,(S.n)*2.5):elapsed()},
  /* Picks the question format: the first three questions use the game's main format, then formats mix (the main one twice as often). */
  format(formats){if(S.n<3||formats.length<2)return formats[0];return pick([formats[0]].concat(formats))}};

 /* Runs question-building code with Math.random replaced by the seeded generator (only in live mode). The swap is
  * synchronous, so nothing else on the page can draw from it. Games use ctx.util.shuffle/pick/choices, which fall back
  * to Math.random, so no game needs its own live code. */
 function seeded(fn){if(!S.rng)return fn();const original=Math.random;Math.random=S.rng;try{return fn()}finally{Math.random=original}}
 let loading=null;
 function ensureLoaded(){if(!cfg.load||cfg._loaded)return Promise.resolve();if(!loading)loading=Promise.resolve().then(()=>cfg.load()).then(()=>{cfg._loaded=true},e=>{loading=null;throw e});return loading}
 function elapsed(){if(!S.startedAt)return 0;return ((S.pausedAt||Date.now())-S.startedAt)/1000}
 function setScreen(name){
  $('intro').style.display=name==='intro'?'flex':'none';
  $('game').classList.toggle('active',name==='game');
  $('result').classList.toggle('active',name==='result');
 }
 function updateStats(){$('score').textContent=S.score;$('streak').textContent=S.streak}
 function tick(){
  if(!S.running||S.pausedAt)return;
  const left=Math.max(0,seconds-elapsed());
  $('time').textContent=Math.ceil(left);$('timebar').style.width=(left/seconds*100)+'%';
  $('timerStat').classList.toggle('urgent',left<=10);
  if(left<=0)finish();
 }

 async function start(seed){
  clearTimeout(S.advance);clearInterval(S.timer);sound.stopMusic();
  if(cfg.load&&!cfg._loaded){
   const btn=$('startBtn'),old=btn.innerHTML;btn.disabled=true;btn.textContent='Loading questions…';
   try{await ensureLoaded()}
   catch(e){btn.textContent='Questions are unavailable right now';$('introNote').textContent='The question bank could not be loaded. Please try again later.';setScreen('intro');return}
   btn.disabled=false;btn.innerHTML=old;
  }
  S.seed=seed==null?null:String(seed);S.rng=S.seed==null?null:rngFor('guess-the-live-v1|'+S.seed);
  Object.assign(S,{running:true,score:0,correct:0,answered:0,streak:0,bestStreak:0,n:0,q:null,locked:false,startedAt:Date.now(),pausedAt:0});
  seeded(()=>{if(cfg.onStart)cfg.onStart(ctx);if(fromList)S.round=cfg.makeRound(ctx)});
  if(liveHooks&&liveHooks.onStart)liveHooks.onStart({total:fromList?S.round.length:0});
  updateStats();$('timebar').style.width='100%';
  $('time').textContent=seconds;$('timerStat').classList.remove('urgent');S.timer=setInterval(tick,200);sound.startMusic();
  setScreen('game');next();
 }
 function next(){
  clearTimeout(S.advance);S.advance=null;
  if(!S.running)return;
  if(fromList&&S.n>=S.round.length){finish();return}
  const q=seeded(()=>fromList?S.round[S.n]:cfg.next(ctx));
  if(!q){finish();return}
  seeded(()=>showQuestion(q));
 }
 function showQuestion(q){
  S.q=q;S.n++;S.locked=false;
  $('roundLabel').textContent=(q.category||cfg.roundLabel||label).toUpperCase()+' '+String(S.n).padStart(2,'0')+(q.kind?' · '+q.kind.toUpperCase():'');
  $('level').textContent=q.level||'';$('level').style.display=q.level?'':'none';
  const clue=$('clue');clue.className='clue'+(q.clueClass?' '+q.clueClass:'');clue.removeAttribute('style');clue.replaceChildren();q.render(clue);
  const credit=$('credit');credit.replaceChildren();if(q.credit)q.credit(credit);
  $('prompt').textContent=q.prompt||cfg.prompt||'';
  $('feedback').textContent='';$('feedback').className='feedback';
  const wrap=$('answers');wrap.replaceChildren();
  wrap.classList.toggle('media',!!q.renderOption);
  q.options.forEach((opt,i)=>{
   const b=el('button','answer');b.type='button';b.dataset.value=opt;
   const k=el('kbd',null,String(i+1));k.setAttribute('aria-hidden','true');b.append(k);
   // Picture answers (flags, swatches, logos…) get a neutral label so the choice itself is the clue.
   if(q.renderOption){b.classList.add('media');b.setAttribute('aria-label','Choice '+(i+1));q.renderOption(opt,b)}
   else b.append(document.createTextNode(cfg.formatOption?cfg.formatOption(opt):opt));
   b.addEventListener('click',()=>answer(b,opt));wrap.appendChild(b);
  });
 }
 function answer(btn,opt){
  if(!S.running||S.locked)return;S.locked=true;S.answered++;
  const q=S.q,right=opt===q.answer;
  Array.from($('answers').children).forEach(b=>{b.disabled=true;if(b.dataset.value===q.answer)b.classList.add('correct')});
  const fb=$('feedback');
  if(right){
   S.streak++;S.correct++;S.bestStreak=Math.max(S.bestStreak,S.streak);S.score+=SCORING.correct;
   fb.textContent=(q.rightText||pick(['Correct!','That’s it!','Nice one!','You got it!']))+' '+signed(SCORING.correct);
   fb.className='feedback good';sound.correct(S.streak>=3);
  }else{
   S.streak=0;S.score+=SCORING.wrong;btn.classList.add('wrong');
   fb.textContent=signed(SCORING.wrong)+' · '+(q.answerText?'Not quite — it was '+q.answerText+'.':q.renderOption?'Not quite — the right one is highlighted.':'Not quite — it was '+(cfg.formatOption?cfg.formatOption(q.answer):q.answer)+'.');
   fb.className='feedback bad';sound.wrong();
  }
  if(q.explanation){fb.appendChild(el('span','explain',q.explanation))}
  updateStats();
  if(cfg.onAnswer)cfg.onAnswer(q,right,ctx);
  if(liveHooks&&liveHooks.onAnswer)liveHooks.onAnswer(q,right,ctx);
  // The clock keeps running while feedback shows, so pauses stay short; questions with a fact get a little longer.
  S.advance=setTimeout(next,right?(q.explanation?1100:550):(q.explanation?1800:1200));
 }
 function finish(){
  if(!S.running)return;
  S.running=false;S.locked=true;clearInterval(S.timer);clearTimeout(S.advance);sound.stopMusic();
  const newBest=S.score>best;if(newBest){best=S.score;safeSet(bestKey(cfg.id),best)}
  const acc=S.answered?Math.round(S.correct/S.answered*100):0;
  $('resultEyebrow').textContent=(fromList&&S.answered>=S.round.length?'ALL DONE':'TIME’S UP')+' · '+(cfg.resultLabel||label).toUpperCase();
  $('finalScore').innerHTML=S.score+'<small>pts</small>';
  $('resultBest').textContent=best;$('accuracy').textContent=acc+'%';$('correctCount').textContent=S.correct+' / '+S.answered;$('bestStreak').textContent=S.bestStreak;
  let title;
  if(!S.answered)title='Out of time!';
  else if(newBest)title='New personal best!';
  else if(acc>=90&&S.correct>=5)title='Brilliant instincts.';
  else if(acc>=70)title='Looking sharp.';
  else if(acc>=45)title='You’re warming up.';
  else title='Every round makes you sharper.';
  $('resultTitle').textContent=title;
  $('resultText').textContent=S.answered?'You got '+S.correct+' of '+S.answered+' right'+(S.bestStreak>=3?' with a best streak of '+S.bestStreak:'')+'. '+(cfg.resultNote?cfg.resultNote():live?'':'Fancy another round?'):'Give it a proper go next round.';
  setScreen('result');
  const res={score:S.score,correct:S.correct,answered:S.answered,best,seconds:Math.min(seconds,Math.round(elapsed()*10)/10),allDone:fromList&&S.answered>=S.round.length};
  if(cfg.onFinish)cfg.onFinish(res);
  if(liveHooks&&liveHooks.onFinish)liveHooks.onFinish(res);
  if(cfg.replay!==false)setTimeout(()=>$('againBtn').focus({preventScroll:true}),50);
 }
 async function share(){
  const btn=$('shareBtn'),old=btn.textContent;btn.disabled=true;btn.textContent='Creating image…';
  const url=cfg.shareUrl?cfg.shareUrl():location.href.split(/[?#]/)[0];
  const acc=S.answered?Math.round(S.correct/S.answered*100):0;
  const text='I scored '+S.score+' points in Guess the ____ · '+label+'. Can you beat me?';
  try{
   const blob=await scoreImage({label,score:S.score,accuracy:acc+'%',correct:S.correct+'/'+S.answered,bestStreak:S.bestStreak,headline:cfg.shareHeadline||('Guess the '+label),rules:RULES_TEXT,format:'Four choices per question',url:url.replace(/^https?:\/\//,'')});
   const file=new File([blob],'guess-the-'+cfg.id+'-score.png',{type:'image/png'});
   if(navigator.share&&navigator.canShare&&navigator.canShare({files:[file]})){
    try{await navigator.share({files:[file],title:'My '+label+' score',text:text+' '+url});return}catch(e){if(e&&e.name==='AbortError')return}
   }
   const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=file.name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1500);
   try{await navigator.clipboard.writeText(text+' '+url);toast('Image saved and challenge text copied.')}catch(e){toast('Score image saved. Share it from your downloads.')}
  }catch(e){toast('Could not create the image. Try again.')}
  finally{btn.disabled=false;btn.textContent=old}
 }

 $('startBtn').addEventListener('click',()=>start());
 $('againBtn').addEventListener('click',()=>start());
 $('shareBtn').addEventListener('click',share);
 /* The mode chip is a label while a round is running, so a stray tap never throws a game away. */
 if($('modeChip'))$('modeChip').addEventListener('click',e=>{
  const a=e.target.closest('a');
  if(a&&!a.hasAttribute('aria-current')&&S.running){e.preventDefault();toast('Finish this '+(live?'game':'round')+' first.')}
 });

 document.addEventListener('keydown',e=>{
  if(e.altKey||e.ctrlKey||e.metaKey)return;
  const tag=(e.target&&e.target.tagName)||'';
  if(/INPUT|TEXTAREA|SELECT/.test(tag))return;
  if(e.key==='m'||e.key==='M'){toggleSound();return}
  if(S.running&&!S.locked&&/^[1-9]$/.test(e.key)){const b=$('answers').children[Number(e.key)-1];if(b){e.preventDefault();b.click()}return}
  if(e.key==='Enter'&&!/BUTTON|A/.test(tag)){
   if(cfg.replay!==false&&$('result').classList.contains('active')){e.preventDefault();start()}
  }
 });
 /* Timed rounds pause while the tab is hidden, so switching apps never costs time. */
 document.addEventListener('visibilitychange',()=>{
  if(!S.running||cfg.pauseWhenHidden===false)return;
  if(document.hidden){S.pausedAt=Date.now();sound.stopMusic()}
  else if(S.pausedAt){S.startedAt+=Date.now()-S.pausedAt;S.pausedAt=0;sound.startMusic();toast('Paused while you were away — the clock is running again.')}
 });

 if(cfg.replay===false)$('againBtn').style.display='none';
 if(cfg.setupIntro)cfg.setupIntro({toast,$});
 const api={toast,start,ctx,cfg,$,live,total:()=>fromList?S.round.length:0};
 if(live){
  /* Live mode: hide the solo start button, fetch the question bank early, then load the room code (PeerJS + live.js). */
  $('startBtn').style.display='none';
  $('startBtn').insertAdjacentHTML('afterend','<div class="micro" id="liveLoading">Loading live mode…</div>');
  ensureLoaded().catch(()=>{});
  (window.Peer?Promise.resolve():loadScript(SCRIPT_BASE+'vendor/peerjs.min.js'))
   .then(()=>window.GuessLive?null:loadScript(SCRIPT_BASE+'live.js'))
   .then(()=>{const l=$('liveLoading');if(l)l.remove();liveHooks=window.GuessLive.attach(api)})
   .catch(()=>{const l=$('liveLoading');if(l)l.textContent='Live mode could not load. Check your connection and reload the page.'});
 }
 if(cfg.autoStart===false)setScreen('intro');else start();
 return api;
}

window.GuessGame={run,rngFor,util:{shuffle,pick,deck,choices,bigClue,framePhoto,escapeHtml},scoring:SCORING,pointsFor,bestKey,loadBest};
})();
