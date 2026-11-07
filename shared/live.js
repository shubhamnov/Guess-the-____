/* Guess the ____ live mode: play any game against a friend on another device, with live scores.
 * The engine loads this file (after PeerJS) when a page is opened with ?live, and calls GuessLive.attach(api).
 * Two devices connect directly (WebRTC through PeerJS); the free PeerJS service only introduces them. The host picks a
 * random seed for each round and both engines build the same questions from it. No server of our own is involved.
 * Messages: hello{name} → room{name,game,path} → ready{name} → start{name,seed,r} → answer{r,n,right,score,streak}
 * → done{r,score,correct,answered,seconds} → again{name} (rematch) → start… ; full when a room already has two players;
 * ping every few seconds, because a closed tab or a phone that drops off Wi-Fi often never closes the link (see heartbeat).
 * Optional extras for pages that don't use the engine (Name Them All): api.makeSeed() → the host's seed for a round
 * (it can carry the round's topic), api.onRole('host'|'guest'|null) when a room is made or joined, and
 * api.progress(n,total) → the text beside each player's bar. */
(function(){
'use strict';
const ID_PREFIX='gtq-live-v1-';
const CODE_LETTERS='ABCDEFGHJKMNPQRSTUVWXYZ';
const NAME_KEY='gtq:live:name';
const MAX_TRIES=4;
const PING_MS=2000,QUIET_MS=9000; // each side pings while connected; this long without any message counts as a lost link
function safeGet(k){try{return localStorage.getItem(k)}catch(e){return null}}
function safeSet(k,v){try{localStorage.setItem(k,v)}catch(e){}}
function newCode(){let c='';for(let i=0;i<4;i++)c+=CODE_LETTERS[Math.floor(Math.random()*CODE_LETTERS.length)];return c}
function newSeed(){return Math.random().toString(36).slice(2,10)+Date.now().toString(36)}
function cleanCode(v){return String(v||'').toUpperCase().replace(/[^A-Z]/g,'').slice(0,4)}
function cleanName(v,fallback){return String(v||'').trim().slice(0,16)||fallback}
function el(tag,cls,text){const e=document.createElement(tag);if(cls)e.className=cls;if(text!=null)e.textContent=text;return e}

function attach(api){
 const {cfg,$,toast}=api;
 const params=new URLSearchParams(location.search);
 const signal=params.get('signal');
 /* ?signal=host:port points at a local PeerJS server (used by the automated tests). Normal play uses the free PeerJS cloud. */
 function peerOptions(){
  if(!signal)return {debug:0};
  const [host,port]=signal.split(':');
  return {host,port:Number(port)||9000,path:'/',secure:false,debug:0,config:{iceServers:[]}};
 }
 const R={role:null,peer:null,conn:null,code:'',tries:0,phase:'lobby',round:0,total:0,lead:0,heard:0,iReady:false,last:null,
  me:{score:0,n:0,streak:0},mine:null,wantAgain:false,counted:false,tally:{me:0,rival:0},
  rival:{name:'Friend',score:0,n:0,streak:0,done:null,gone:false,lost:false,ready:false,wantAgain:false}};
 const ui={};

 const rivalName=()=>R.rival.name||'Friend';
 const myName=()=>cleanName(ui.name.value,'Player');
 function status(text,kind){ui.status.textContent=text;ui.status.className='race-status'+(kind?' '+kind:'')}
 function send(msg){try{if(R.conn&&R.conn.open)R.conn.send(msg)}catch(e){}}
 function roomURL(path,code){const u=new URL(path||location.pathname,location.href);u.search='';u.hash='';u.searchParams.set('live',code);if(signal)u.searchParams.set('signal',signal);return u.toString()}

 /* ---------- Lobby ---------- */
 $('introEyebrow').textContent='⚡ With a friend';
 $('introNote').textContent='Same questions for both of you, 60 seconds, live scores. Higher score wins; on a tie, whoever finished first. Use two devices and keep this page on screen: phones pause pages in the background.';
 $('startBtn').insertAdjacentHTML('afterend',
  '<div class="lobby" id="lobby">'+
  '<label>Your name<input id="nameInput" maxlength="16" autocomplete="nickname" placeholder="Player"></label>'+
  '<div id="lobbyHome" class="lobby-part">'+
   '<button class="primary" id="createBtn" type="button">Create a room <span class="arrow">→</span></button>'+
   '<div class="or">or join a friend’s room</div>'+
   '<div class="join-row"><input id="codeInput" maxlength="4" placeholder="CODE" autocapitalize="characters" autocomplete="off" aria-label="Room code"><button class="secondary" id="joinBtn" type="button">Join</button></div>'+
  '</div>'+
  '<div id="lobbyRoom" class="lobby-part" hidden>'+
   '<div class="room-code">Room code <strong id="roomCode"></strong></div>'+
   '<button class="secondary" id="inviteBtn" type="button">Send invite link ↗</button>'+
   '<button class="primary" id="goBtn" type="button" disabled>Start the game <span class="arrow">→</span></button>'+
   '<button class="primary" id="readyBtn" type="button" hidden>I’m ready <span class="arrow">✓</span></button>'+
   '<button class="secondary" id="leaveBtn" type="button">← Leave this room</button>'+
  '</div>'+
  '<div class="race-status" id="raceStatus" role="status" aria-live="polite"></div><div class="micro" id="raceDiag"></div>'+
  '<a class="micro solo-link" href="'+location.pathname+'">Play solo instead</a></div>');
 Object.assign(ui,{name:$('nameInput'),home:$('lobbyHome'),room:$('lobbyRoom'),codeOut:$('roomCode'),invite:$('inviteBtn'),go:$('goBtn'),ready:$('readyBtn'),status:$('raceStatus'),diag:$('raceDiag')});
 ui.name.value=safeGet(NAME_KEY)||safeGet('gtq:race:name')||'';
 const saveName=()=>safeSet(NAME_KEY,myName());
 ui.name.addEventListener('change',saveName);
 $('createBtn').addEventListener('click',()=>{saveName();createRoom()});
 $('joinBtn').addEventListener('click',()=>{saveName();joinRoom($('codeInput').value)});
 $('codeInput').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();$('joinBtn').click()}});
 ui.invite.addEventListener('click',async()=>{
  const url=roomURL(null,R.code),text=myName()+' challenged you to a live game of Guess the ____ · '+cfg.label+'. Room '+R.code+': '+url;
  try{if(navigator.share){await navigator.share({title:'Play me live · Guess the ____',text,url});return}}catch(e){if(e&&e.name==='AbortError')return}
  try{await navigator.clipboard.writeText(text);toast('Invite link copied. Send it to your friend.')}catch(e){window.prompt('Copy this link and send it to your friend:',url)}
 });
 ui.ready.addEventListener('click',()=>{saveName();R.iReady=true;send({t:'ready',name:myName()});ui.ready.hidden=true;ui.name.disabled=true;status('You’re ready. Waiting for '+rivalName()+' to start…','good')});
 $('leaveBtn').addEventListener('click',()=>{dropConn();backToHome();status('')});
 ui.go.addEventListener('click',()=>{if(!R.conn||!R.conn.open){status('Your friend isn’t connected.','bad');return}saveName();ui.name.disabled=true;startRound()});

 /* ---------- Connecting ---------- */
 /* Phones pause pages in the background, which drops them off the PeerJS service. So the host reconnects when it
  * comes back on screen, and the guest keeps retrying for a while instead of giving up on the first miss. */
 let tryTimer=null;
 const D={service:'—',link:'—'};
 function diag(part,value){if(part)D[part]=value;ui.diag.textContent='Connection service: '+D.service+' · Direct link: '+D.link}
 diag();
 /* On a phone the lobby sits below the intro, so bring it on screen: the code and the status line are what matter now. */
 function showRoom(){ui.home.hidden=true;ui.room.hidden=false;ui.codeOut.textContent=R.code;const l=$('lobby');if(l.getBoundingClientRect().bottom>innerHeight)l.scrollIntoView({behavior:'smooth',block:'start'})}
 function backToHome(){clearTimeout(tryTimer);ui.home.hidden=false;ui.room.hidden=true;ui.name.disabled=false;R.role=null;R.iReady=false;Object.assign(R.rival,{gone:false,lost:false,ready:false});if(api.onRole)api.onRole(null);if(R.peer){try{R.peer.destroy()}catch(e){}R.peer=null}diag('service','—');diag('link','—')}
 function peerError(err){
  const type=err&&err.type;
  if(R.role==='host'&&type==='unavailable-id'&&R.phase==='lobby'){createRoom();return}
  if(type==='peer-unavailable'){
   if(R.role==='guest'&&R.phase==='lobby'&&R.tries<MAX_TRIES){
    status('Looking for room '+R.code+'… (try '+R.tries+' of '+MAX_TRIES+') The device that created it must keep the page open on screen.');
    clearTimeout(tryTimer);tryTimer=setTimeout(tryConnect,2000);return}
   if(R.role==='guest'&&R.phase==='lobby'){status('No room found with code '+R.code+'. Check the code, and make sure the page is still open on your friend’s screen.','bad');backToHome()}
   return}
  if(type==='network'||type==='server-error'||type==='socket-error'||type==='socket-closed'||type==='disconnected'){
   diag('service','offline');
   if(R.phase!=='lobby')return; // the game keeps going over the direct link
   status('Can’t reach the connection service. Check your internet; it will retry when this page is back on screen.','bad');return}
  status('Connection problem ('+(type||'unknown')+'). Try again.','bad');
 }
 function watchPeer(peer){
  diag('service','connecting…');
  peer.on('error',peerError);
  peer.on('disconnected',()=>{diag('service','offline');if(!document.hidden)setTimeout(()=>reconnect(peer),1000)});
 }
 function reconnect(peer){if(peer&&peer===R.peer&&peer.disconnected&&!peer.destroyed){diag('service','reconnecting…');try{peer.reconnect()}catch(e){}}}
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)reconnect(R.peer)});
 function createRoom(){
  if(R.peer){try{R.peer.destroy()}catch(e){}}
  R.role='host';R.code=newCode();showRoom();if(api.onRole)api.onRole('host');ui.invite.hidden=false;ui.go.hidden=false;ui.go.disabled=true;ui.ready.hidden=true;
  status('Setting up the room…');
  const peer=new Peer(ID_PREFIX+R.code,peerOptions());R.peer=peer;watchPeer(peer);
  peer.on('open',()=>{diag('service','connected');if(!R.conn||!R.conn.open)status('Send the invite link (or the code) to your friend. Keep this page open on screen until they join.')});
  peer.on('connection',conn=>{
   // A second player is turned away, unless the first one's link is gone and no game has started: then they can rejoin.
   if(R.conn&&R.conn.open&&!(R.phase==='lobby'&&R.rival.gone)){conn.on('open',()=>{conn.send({t:'full'});setTimeout(()=>conn.close(),300)});return}
   dropConn();R.rival.ready=false;ui.go.disabled=true;
   attachConn(conn);
  });
 }
 function joinRoom(code){
  R.code=cleanCode(code);
  if(R.code.length!==4){status('Enter the 4-letter code from your friend.','bad');return}
  if(R.peer){try{R.peer.destroy()}catch(e){}}
  R.role='guest';R.tries=0;showRoom();if(api.onRole)api.onRole('guest');ui.invite.hidden=true;ui.go.hidden=true;ui.ready.hidden=true;
  status('Connecting to room '+R.code+'…');
  const peer=new Peer(peerOptions());R.peer=peer;watchPeer(peer);
  peer.on('open',()=>{diag('service','connected');if(!R.tries)tryConnect()});
 }
 function tryConnect(){
  const peer=R.peer;
  if(!peer||peer.destroyed||R.phase!=='lobby'||(R.conn&&R.conn.open))return;
  if(peer.disconnected){reconnect(peer);clearTimeout(tryTimer);tryTimer=setTimeout(tryConnect,3000);return}
  R.tries++;diag('link','trying ('+R.tries+')');
  if(R.conn&&!R.conn.open){try{R.conn.close()}catch(e){}}
  const conn=peer.connect(ID_PREFIX+R.code,{reliable:true});attachConn(conn);
  clearTimeout(tryTimer);
  tryTimer=setTimeout(()=>{
   if(conn.open||R.phase!=='lobby')return;
   if(R.tries<MAX_TRIES){status('Still connecting to room '+R.code+'… (try '+R.tries+' of '+MAX_TRIES+')');tryConnect()}
   else status('Couldn’t connect. The direct link between the two devices was blocked. Try both on the same Wi-Fi, or two separate devices.','bad');
  },8000);
 }
 /* Closes the current link without treating it as the friend leaving (it is no longer R.conn when its close arrives). */
 function dropConn(){const c=R.conn;R.conn=null;if(c){try{c.close()}catch(e){}}}
 function attachConn(conn){
  R.conn=conn;
  let opened=false;
  conn.on('open',()=>{opened=true;R.conn=conn;R.heard=Date.now();Object.assign(R.rival,{gone:false,lost:false});clearTimeout(tryTimer);diag('link','connected');if(R.role==='guest')send({t:'hello',name:myName()})});
  conn.on('data',m=>{if(conn!==R.conn)return;R.heard=Date.now();if(R.rival.lost)rivalBack();onMessage(m)});
  conn.on('iceStateChanged',state=>{if(!opened||state==='failed'||state==='disconnected')diag('link',state)});
  const gone=()=>{if(opened&&conn===R.conn){diag('link','closed');onRivalGone()}};
  conn.on('close',gone);
  conn.on('error',gone);
 }
 /* lost: nothing heard for a while (the link may come back); otherwise the link closed for good. */
 function onRivalGone(lost){
  if(R.rival.gone)return;R.rival.gone=true;R.rival.lost=!!lost;
  if(R.phase==='lobby'){
   ui.go.disabled=true;ui.ready.hidden=true;
   if(R.role==='host')status(rivalName()+(lost?'’s connection dropped.':' left.')+' They (or someone else) can join with code '+R.code+'.','bad');
   else status((lost?'Lost the connection to ':'')+rivalName()+(lost?'’s room.':' closed the room.')+' Leave this room and join again.','bad');
   return}
  ui.rivalRow.classList.add('gone');ui.rivalEls.q.textContent=lost?'offline':'left';
  if(R.phase==='playing')pop(rivalName()+(lost?' lost connection':' disconnected'),'warn');
  renderVerdict();
 }
 /* Messages arrive again after a quiet spell (say a phone came back on screen): carry on as before. */
 function rivalBack(){
  Object.assign(R.rival,{gone:false,lost:false});
  if(R.last&&R.last.r===R.round)send(R.last); // in case our latest score went missing while the link was down
  if(R.phase==='lobby'){
   if(R.role==='host'){ui.go.disabled=!R.rival.ready;status(rivalName()+' is back.'+(R.rival.ready?' Tap “Start the game”.':''),'good')}
   else{ui.ready.hidden=R.iReady;status('Reconnected to '+rivalName()+'’s room.','good')}
   return}
  ui.rivalRow.classList.remove('gone');renderStrip();
  if(R.phase==='playing')pop(rivalName()+' is back');
  renderVerdict();
 }
 /* Heartbeat: a closed tab or a dropped network often leaves the link looking open, so silence is what counts. */
 setInterval(()=>{
  if(!R.conn||!R.conn.open||!R.heard)return;
  send({t:'ping'});
  if(!R.rival.gone&&Date.now()-R.heard>QUIET_MS)onRivalGone(true);
 },PING_MS);

 /* ---------- Messages between the devices ---------- */
 function onMessage(m){
  if(!m||typeof m!=='object')return;
  if(m.t==='hello'){R.rival.name=cleanName(m.name,'Friend');send({t:'room',name:myName(),game:cfg.id,path:location.pathname});status(rivalName()+' joined. Waiting for them to tap “I’m ready”…','good')}
  else if(m.t==='room'){
   // The code belongs to another game: open that game's page and join from there.
   if(m.game&&m.game!==cfg.id&&typeof m.path==='string'&&m.path.charAt(0)==='/'){status('Opening '+cleanName(m.name,'your friend')+'’s game…','good');try{R.peer.destroy()}catch(e){}location.replace(roomURL(m.path,R.code));return}
   R.rival.name=cleanName(m.name,'Friend');ui.ready.hidden=false;status('Connected to '+rivalName()+'’s room. Tap “I’m ready” when you are.','good')}
  else if(m.t==='full'){dropConn();status('That room already has two players. Ask your friend for a new code.','bad')}
  else if(m.t==='ready'){R.rival.name=cleanName(m.name,R.rival.name);R.rival.ready=true;ui.go.disabled=false;status(rivalName()+' is ready. Tap “Start the game”.','good')}
  else if(m.t==='start'){R.rival.name=cleanName(m.name,R.rival.name);R.round=Number(m.r)||R.round+1;countdown(String(m.seed))}
  else if(m.t==='answer'){if(Number(m.r)===R.round)rivalAnswered(m)}
  else if(m.t==='done'){
   if(Number(m.r)!==R.round)return;
   R.rival.done={score:Number(m.score)||0,correct:Number(m.correct)||0,answered:Number(m.answered)||0,seconds:Number(m.seconds)||60};
   // n: the count beside the bar (Name Them All sends how many were found; engine games send nothing and use answered).
   R.rival.score=R.rival.done.score;R.rival.n=m.n!=null?Number(m.n)||0:R.rival.done.answered;renderStrip();renderVerdict();
   if(R.phase==='playing')pop(rivalName()+' has finished!','warn')}
  else if(m.t==='again'){
   R.rival.wantAgain=true;
   if(R.role==='host'&&R.wantAgain)startRound();
   else{renderRematch();if(R.phase==='done')toast(rivalName()+' wants a rematch!')}
  }
 }

 /* ---------- Rounds: the host picks the seed, both devices count down together ---------- */
 function startRound(){
  if(R.role!=='host'||!R.conn||!R.conn.open)return;
  R.round++;const seed=api.makeSeed?String(api.makeSeed()):newSeed();
  send({t:'start',name:myName(),seed,r:R.round});
  countdown(seed);
 }
 function countdown(seed){
  if(R.phase!=='lobby'&&R.phase!=='done')return;R.phase='countdown';
  Object.assign(R,{me:{score:0,n:0,streak:0},mine:null,lead:0,wantAgain:false,counted:false});
  Object.assign(R.rival,{score:0,n:0,streak:0,done:null,wantAgain:false});
  const box=ui.countdown,span=box.firstChild;box.hidden=false;
  const steps=['3','2','1','GO'];let i=0;
  const show=()=>{span.textContent=steps[i];span.style.animation='none';void span.offsetWidth;span.style.animation='';
   if(navigator.vibrate&&i===3)navigator.vibrate(60);
   if(++i<steps.length)setTimeout(show,800);else setTimeout(()=>begin(seed),500)};
  show();
 }
 function begin(seed){
  ui.countdown.hidden=true;R.phase='playing';
  ui.meEls.who.textContent='You';ui.rivalEls.who.textContent=rivalName();
  ui.rivalRow.classList.toggle('gone',R.rival.gone);
  api.start(seed);renderStrip();
 }

 /* ---------- During the game: live scores and a little pressure ---------- */
 const strip=el('div','race-strip');strip.id='raceStrip';
 function mkRow(cls){const row=el('div','race-row '+cls),who=el('span','who'),bar=el('span','bar'),fill=el('i'),pts=el('span','pts'),q=el('span','q');bar.appendChild(fill);row.append(who,bar,pts,q);strip.appendChild(row);return {row,who,bar:fill,pts,q}}
 ui.meEls=mkRow('me');ui.rivalEls=mkRow('rival');ui.meRow=ui.meEls.row;ui.rivalRow=ui.rivalEls.row;
 ui.pop=el('div','race-pop');ui.pop.setAttribute('role','status');ui.pop.setAttribute('aria-live','polite');strip.appendChild(ui.pop);
 document.querySelector('#game .track').after(strip);
 ui.countdown=el('div','countdown');ui.countdown.id='countdown';ui.countdown.hidden=true;ui.countdown.appendChild(el('span'));document.body.appendChild(ui.countdown);

 const qText=n=>api.progress?api.progress(n,R.total):R.total?'Q'+n+'/'+R.total:'Q'+n;
 function renderStrip(){
  // Games without a fixed list have no total; their bars fill relative to whoever is furthest ahead.
  const span=R.total||Math.max(10,R.me.n,R.rival.n);
  const row=(els,p,isRival)=>{els.bar.style.width=Math.min(100,p.n/span*100)+'%';els.pts.textContent=p.score+' pts';if(!(isRival&&R.rival.gone))els.q.textContent=qText(p.n)};
  row(ui.meEls,R.me,false);row(ui.rivalEls,R.rival,true);
  const diff=R.me.score-R.rival.score;
  ui.meRow.classList.toggle('lead',diff>0);ui.rivalRow.classList.toggle('lead',diff<0);
 }
 function flash(rowEl,good){rowEl.classList.remove('flash-good','flash-bad');void rowEl.offsetWidth;rowEl.classList.add(good?'flash-good':'flash-bad');clearTimeout(rowEl._t);rowEl._t=setTimeout(()=>rowEl.classList.remove('flash-good','flash-bad'),700)}
 let popTimer=null;
 function pop(text,kind){ui.pop.textContent=text;ui.pop.className='race-pop show'+(kind?' '+kind:'');clearTimeout(popTimer);popTimer=setTimeout(()=>ui.pop.classList.remove('show'),1800)}
 function checkLead(){
  const diff=R.me.score-R.rival.score,lead=diff>0?1:diff<0?-1:0,was=R.lead;R.lead=lead;
  if(lead===-1&&was!==-1){pop(rivalName()+' overtook you!','warn');if(navigator.vibrate)navigator.vibrate([90,50,90])}
  else if(lead===1&&was!==1&&R.me.n>1)pop('You’re ahead 💪');
 }
 function rivalAnswered(m){
  R.rival.score=Number(m.score)||0;R.rival.n=Number(m.n)||0;R.rival.streak=Number(m.streak)||0;
  renderStrip();flash(ui.rivalRow,!!m.right);
  if(R.phase!=='playing')return;
  const before=R.lead;checkLead();
  if(R.lead===before&&m.right&&R.rival.streak>=3&&R.rival.streak%2===1)pop(rivalName()+' is on a '+R.rival.streak+'-streak 🔥','warn');
 }

 /* ---------- Result: head to head, running tally and rematch ---------- */
 $('shareBtn').style.display='none';
 const res=el('div','race-result');res.id='raceResult';
 res.innerHTML='<p id="raceVerdict"></p><div class="race-vs"><div id="vsMe"></div><div id="vsRival"></div></div><div class="race-tally" id="raceTally" hidden></div>'+
  '<button class="primary" id="rematchBtn" type="button">Rematch <span class="arrow">↻</span></button><a class="secondary" href="'+location.pathname+'">Leave the room</a>';
 document.querySelector('#result .resultbox').before(res);
 Object.assign(ui,{verdict:$('raceVerdict'),vsMe:$('vsMe'),vsRival:$('vsRival'),tally:$('raceTally'),rematch:$('rematchBtn')});
 ui.rematch.addEventListener('click',()=>{
  if(R.rival.gone||R.wantAgain)return;
  R.wantAgain=true;send({t:'again',name:myName()});
  if(R.role==='host'&&R.rival.wantAgain)startRound();else renderRematch();
 });
 function renderRematch(){
  const b=ui.rematch;
  b.disabled=R.rival.gone||R.wantAgain;
  if(R.rival.gone)b.innerHTML='Rematch unavailable';
  else if(R.wantAgain)b.textContent='Waiting for '+rivalName()+'…';
  else if(R.rival.wantAgain)b.innerHTML=rivalName().replace(/[&<>"']/g,'')+' wants a rematch <span class="arrow">↻</span>';
  else b.innerHTML='Rematch <span class="arrow">↻</span>';
 }
 function winner(){
  const a=R.mine,b=R.rival.done;if(!a||!b)return null;
  if(a.score!==b.score)return a.score>b.score?'me':'rival';
  if(a.seconds!==b.seconds)return a.seconds<b.seconds?'me':'rival';
  return 'draw';
 }
 function card(box,name,result,isWin){
  box.className=isWin?'win':'';box.replaceChildren();
  const s=el('strong'),sm=el('small');
  if(result){s.textContent=result.score;sm.textContent=result.correct+'/'+result.answered+' right · '+result.seconds.toFixed(1)+'s'}
  else{s.textContent=R.rival.score;sm.textContent=R.rival.gone?(R.rival.lost?'connection lost':'left the game'):'still playing · '+qText(R.rival.n)}
  box.append(el('label',null,name),s,sm);
 }
 function renderVerdict(){
  if(!R.mine)return;
  const w=winner();
  if(w&&!R.counted){R.counted=true;if(w==='me')R.tally.me++;else if(w==='rival')R.tally.rival++}
  card(ui.vsMe,myName()+' (you)',R.mine,w==='me');
  card(ui.vsRival,rivalName(),R.rival.done,w==='rival');
  let text,title;
  const a=R.mine,b=R.rival.done;
  if(w==='me'){title='You win! 🏆';text=a.score===b.score?'Same score, but you finished first.':'You beat '+rivalName()+' by '+(a.score-b.score)+' points.'}
  else if(w==='rival'){title=rivalName()+' wins';text=a.score===b.score?'Same score, but '+rivalName()+' finished first.':rivalName()+' won by '+(b.score-a.score)+' points.'}
  else if(w==='draw'){title='It’s a draw!';text='Same score, same time.'}
  else if(R.rival.gone){title='Game over';text=rivalName()+(R.rival.lost?' lost the connection before finishing. If they come back, their score will appear here.':' disconnected before finishing.')}
  else{title='Waiting for '+rivalName()+'…';text='Their score updates live.'}
  ui.verdict.textContent=text;$('resultTitle').textContent=title;
  const games=R.round;
  ui.tally.hidden=games<2&&!R.counted;
  ui.tally.textContent=myName()+' '+R.tally.me+' – '+R.tally.rival+' '+rivalName();
  renderRematch();
 }

 // A code in the link (?live=CODE, or ?room=CODE from the first race links) joins straight away.
 const fromLink=cleanCode(params.get('live')||params.get('room'));
 if(fromLink.length===4){$('codeInput').value=fromLink;joinRoom(fromLink)}
 // ?live=new (from the home page in "With a friend" mode) creates a room straight away, so the code is ready to send.
 else if(String(params.get('live')).toLowerCase()==='new')createRoom();

 return {
  /* A friend is connected (the mode switch asks before leaving). */
  friendHere:()=>!!(R.conn&&R.conn.open),
  onStart(info){R.total=info.total||0},
  onAnswer(q,right,ctx){
   R.me={score:ctx.score,n:ctx.answered,streak:ctx.streak};
   send(R.last={t:'answer',r:R.round,n:ctx.answered,right,score:ctx.score,streak:ctx.streak});
   renderStrip();flash(ui.meRow,right);checkLead();
  },
  onFinish(result){
   R.phase='done';R.mine={score:result.score,correct:result.correct,answered:result.answered,seconds:result.seconds};
   send(R.last={t:'done',r:R.round,score:result.score,correct:result.correct,answered:result.answered,seconds:result.seconds,n:result.n});
   renderVerdict();
  }
 };
}
window.GuessLive={attach};
})();
