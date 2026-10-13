(function(){
'use strict';
const KIND = document.body.dataset.game || 'animals';
const CONFIG = {
 countries:{label:'Countries',upper:'COUNTRIES',title:'Know your<br><em>countries?</em>',eyebrow:'ROTATE YOUR WORLD VIEW',intro:'Recognise the outline—even when north is not up. Every round turns the country to a new, unexpected angle.',note:'Outlines from Natural Earth. Each country is rotated to a new angle every round.',prompt:'Which country is this shape?',storage:'guessTheCountriesBest',resultTitle:'Worldly instincts.',footer:'NO NORTH. NO EASY MODE.',badge:'ROTATED OUTLINES',description:'Guess the country from a rotated silhouette.'},
 animals:{label:'Animals',upper:'ANIMALS',title:'Know your<br><em>animals?</em>',eyebrow:'A LITTLE WILD KNOWLEDGE',intro:'From familiar faces to less obvious creatures, how many animals can you name before time is up?',note:'Quick rounds. Four choices. Best score saved on this device.',prompt:'Which animal is this?',storage:'guessTheAnimalsBest',resultTitle:'Wildly good work.',footer:'TRUST YOUR INSTINCTS.',badge:'ANIMAL KINGDOM',description:'Identify the animal from its emoji illustration.'},
 capitals:{label:'Capital Cities',upper:'CAPITAL CITIES',title:'Know your<br><em>capitals?</em>',eyebrow:'A QUICK WORLD TOUR',intro:'You get a country. You name its capital. Find out how much of the world map lives in your head.',note:'Four city choices. Best score saved on this device.',prompt:'What is the capital of this country?',storage:'guessTheCapitalsBest',resultTitle:'A sharp world traveller.',footer:'CITY BY CITY.',badge:'WORLD KNOWLEDGE',description:'Name the capital city of each country.'}
};
const cfg = CONFIG[KIND] || CONFIG.animals;
const $ = id => document.getElementById(id);
const intro = $('intro'), game = $('game'), result = $('result'), startBtn = $('startBtn'), againBtn = $('againBtn'), shareBtn = $('shareBtn'), soundToggle = $('soundToggle');
$('categoryPill').textContent = cfg.upper;
$('eyebrow').textContent = cfg.eyebrow;
$('pageTitle').innerHTML = cfg.title;
$('introText').textContent = cfg.intro;
$('introNote').textContent = cfg.note;
$('prompt').textContent = cfg.prompt;
$('resultEyebrow').textContent = 'TIME’S UP · ' + cfg.upper;
$('resultTitle').textContent = cfg.resultTitle;
$('footerText').textContent = cfg.footer;
$('categoryDescription').textContent = cfg.description;
let best = Number(safeGet(cfg.storage) || 0);
$('best').textContent = best;
$('resultBest').textContent = best;
let time = 60, score = 0, correct = 0, answered = 0, streak = 0, bestStreak = 0, round = 0;
let timerId = null, advanceId = null, locked = false, current = null, used = new Set(), countryPool = null;
let soundOn = safeGet('guessTheSound') !== 'off';
let audioCtx = null, musicTimer = null, musicStep = 0;
soundToggle.setAttribute('aria-pressed', String(soundOn));
soundToggle.textContent = soundOn ? '♫ SOUND ON' : '♫ SOUND OFF';
function safeGet(key){try{return localStorage.getItem(key)}catch(e){return null}}
function safeSet(key,value){try{localStorage.setItem(key,String(value))}catch(e){}}
function shuffle(arr){const a=arr.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function pick(arr){return arr[Math.floor(Math.random()*arr.length)]}
function unique(arr){return Array.from(new Set(arr))}
function setupAudio(){if(!soundOn)return null;try{const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return null;if(!audioCtx)audioCtx=new AC();if(audioCtx.state==='suspended')audioCtx.resume();return audioCtx}catch(e){return null}}
function tone(freq,duration,wave,volume,delay){const c=setupAudio();if(!c)return;try{const o=c.createOscillator(),g=c.createGain();o.type=wave||'triangle';o.frequency.value=freq;g.gain.setValueAtTime(0.0001,c.currentTime+(delay||0));g.gain.exponentialRampToValueAtTime(volume||0.035,c.currentTime+(delay||0)+0.015);g.gain.exponentialRampToValueAtTime(0.0001,c.currentTime+(delay||0)+duration);o.connect(g);g.connect(c.destination);o.start(c.currentTime+(delay||0));o.stop(c.currentTime+(delay||0)+duration+0.03)}catch(e){}}
function startMusic(){if(!soundOn||musicTimer)return;setupAudio();const notes=[392,494,587,494,440,523,659,523];musicTimer=setInterval(function(){if(!soundOn)return;const n=notes[musicStep%notes.length];tone(n,0.25,'triangle',0.012);if(musicStep%4===0)tone(n/2,0.34,'sine',0.009);musicStep++},440)}
function stopMusic(){if(musicTimer){clearInterval(musicTimer);musicTimer=null}}
function correctSound(){tone(660,0.10,'sine',0.055);tone(880,0.15,'triangle',0.035,0.075)}
function wrongSound(){tone(230,0.16,'sawtooth',0.025);tone(174,0.20,'triangle',0.025,0.08)}
soundToggle.addEventListener('click',function(){soundOn=!soundOn;safeSet('guessTheSound',soundOn?'on':'off');soundToggle.setAttribute('aria-pressed',String(soundOn));soundToggle.textContent=soundOn?'♫ SOUND ON':'♫ SOUND OFF';if(soundOn){setupAudio();if(game.classList.contains('active'))startMusic()}else stopMusic()});
function drawAnimalPreview(){const em=['🦊','🦉','🐬','🦒'];$('introPreview').innerHTML=em.map(function(x){return '<span>'+x+'</span>'}).join('');$('introPreview').className='preview preview-animals'}
function setPreview(){if(KIND==='countries'){$('introPreview').className='preview preview-country';$('introPreview').innerHTML='<svg viewBox="0 0 420 220" role="img" aria-label="Country outlines at different angles"><g class="mini-shape" transform="translate(10 8) rotate(-22 80 90)"><path d="M26 55 L58 28 L91 42 L105 23 L137 38 L150 68 L128 88 L140 116 L109 139 L79 125 L52 142 L28 112 L41 87 Z"/></g><g class="mini-shape" transform="translate(144 22) rotate(31 100 90)"><path d="M44 31 L75 23 L93 47 L128 39 L153 62 L146 88 L122 106 L132 132 L108 151 L83 129 L58 135 L34 103 L45 78 L29 54 Z"/></g><g class="mini-shape" transform="translate(270 45) rotate(74 55 65)"><path d="M24 22 L72 10 L98 40 L87 65 L100 87 L72 117 L43 106 L28 80 L10 56 Z"/></g></svg>'}
else if(KIND==='animals'){drawAnimalPreview()}
else{$('introPreview').className='preview preview-capitals';$('introPreview').innerHTML='<span class="city-chip">TOKYO</span><span class="city-chip">LIMA</span><span class="city-chip">OSLO</span>'}}
setPreview();
const ANIMALS = [
['Lion','🦁'],['Tiger','🐯'],['Cheetah','🐆'],['Wolf','🐺'],['Fox','🦊'],['Bear','🐻'],['Polar bear','🐻‍❄️'],['Panda','🐼'],['Koala','🐨'],['Kangaroo','🦘'],['Elephant','🐘'],['Giraffe','🦒'],['Zebra','🦓'],['Horse','🐴'],['Donkey','🫏'],['Cow','🐄'],['Buffalo','🐃'],['Goat','🐐'],['Sheep','🐑'],['Pig','🐖'],['Deer','🦌'],['Moose','🫎'],['Rabbit','🐇'],['Squirrel','🐿️'],['Hedgehog','🦔'],['Bat','🦇'],['Otter','🦦'],['Beaver','🦫'],['Seal','🦭'],['Dolphin','🐬'],['Whale','🐳'],['Orca','🐋'],['Shark','🦈'],['Octopus','🐙'],['Squid','🦑'],['Crab','🦀'],['Lobster','🦞'],['Shrimp','🦐'],['Jellyfish','🪼'],['Seahorse','🪸'],['Turtle','🐢'],['Crocodile','🐊'],['Snake','🐍'],['Lizard','🦎'],['Frog','🐸'],['Eagle','🦅'],['Owl','🦉'],['Parrot','🦜'],['Flamingo','🦩'],['Penguin','🐧'],['Peacock','🦚'],['Ostrich','🪶'],['Chicken','🐓'],['Duck','🦆'],['Swan','🦢'],['Turkey','🦃'],['Pigeon','🕊️'],['Crow','🐦‍⬛'],['Pelican','🪿'],['Bee','🐝'],['Butterfly','🦋'],['Ant','🐜'],['Spider','🕷️'],['Scorpion','🦂'],['Snail','🐌'],['Worm','🪱'],['Pufferfish','🐡'],['Tropical fish','🐠'],['Blowfish','🐟'],['Cricket','🦗'],['Ladybug','🐞'],['Mosquito','🦟'],['Beetle','🪲'],['Mammoth','🦣'],['Dromedary','🐪'],['Llama','🦙'],
].map(function(a){return {name:a[0],emoji:a[1],answer:a[0]}});
const CAPITALS = [
['Afghanistan','Kabul'],['Albania','Tirana'],['Algeria','Algiers'],['Argentina','Buenos Aires'],['Armenia','Yerevan'],['Australia','Canberra'],['Austria','Vienna'],['Azerbaijan','Baku'],['Bangladesh','Dhaka'],['Belgium','Brussels'],['Bhutan','Thimphu'],['Bolivia','Sucre'],['Brazil','Brasília'],['Bulgaria','Sofia'],['Cambodia','Phnom Penh'],['Cameroon','Yaoundé'],['Canada','Ottawa'],['Chile','Santiago'],['China','Beijing'],['Colombia','Bogotá'],['Croatia','Zagreb'],['Cuba','Havana'],['Czechia','Prague'],['Denmark','Copenhagen'],['Ecuador','Quito'],['Egypt','Cairo'],['Estonia','Tallinn'],['Ethiopia','Addis Ababa'],['Finland','Helsinki'],['France','Paris'],['Georgia','Tbilisi'],['Germany','Berlin'],['Ghana','Accra'],['Greece','Athens'],['Hungary','Budapest'],['Iceland','Reykjavík'],['India','New Delhi'],['Iran','Tehran'],['Iraq','Baghdad'],['Ireland','Dublin'],['Italy','Rome'],['Jamaica','Kingston'],['Japan','Tokyo'],['Jordan','Amman'],['Kazakhstan','Astana'],['Kenya','Nairobi'],['Laos','Vientiane'],['Latvia','Riga'],['Lebanon','Beirut'],['Libya','Tripoli'],['Lithuania','Vilnius'],['Malaysia','Kuala Lumpur'],['Maldives','Malé'],['Mexico','Mexico City'],['Mongolia','Ulaanbaatar'],['Morocco','Rabat'],['Nepal','Kathmandu'],['Netherlands','Amsterdam'],['New Zealand','Wellington'],['Nigeria','Abuja'],['North Korea','Pyongyang'],['Norway','Oslo'],['Oman','Muscat'],['Pakistan','Islamabad'],['Peru','Lima'],['Philippines','Manila'],['Poland','Warsaw'],['Portugal','Lisbon'],['Qatar','Doha'],['Romania','Bucharest'],['Russia','Moscow'],['Rwanda','Kigali'],['Saudi Arabia','Riyadh'],['Senegal','Dakar'],['Serbia','Belgrade'],['Singapore','Singapore'],['Slovakia','Bratislava'],['Slovenia','Ljubljana'],['South Africa','Pretoria'],['South Korea','Seoul'],['Spain','Madrid'],['Sri Lanka','Sri Jayawardenepura Kotte'],['Sweden','Stockholm'],['Switzerland','Bern'],['Thailand','Bangkok'],['Tunisia','Tunis'],['Türkiye','Ankara'],['Ukraine','Kyiv'],['United Arab Emirates','Abu Dhabi'],['United Kingdom','London'],['United States','Washington, D.C.'],['Uruguay','Montevideo'],['Uzbekistan','Tashkent'],['Venezuela','Caracas'],['Vietnam','Hanoi'],['Zimbabwe','Harare'],['Botswana','Gaborone'],['Burkina Faso','Ouagadougou'],['Costa Rica','San José'],['Dominican Republic','Santo Domingo'],['El Salvador','San Salvador'],['Guatemala','Guatemala City'],['Honduras','Tegucigalpa'],['Kyrgyzstan','Bishkek'],['Madagascar','Antananarivo'],['Mauritania','Nouakchott'],['Mauritius','Port Louis'],['Montenegro','Podgorica'],['Mozambique','Maputo'],['Namibia','Windhoek'],['Nicaragua','Managua'],['Niger','Niamey'],['Panama','Panama City'],['Paraguay','Asunción'],['Republic of the Congo','Brazzaville'],['Somalia','Mogadishu'],['South Sudan','Juba'],['Sudan','Khartoum'],['Suriname','Paramaribo'],['Tajikistan','Dushanbe'],['Tanzania','Dodoma'],['Togo','Lomé'],['Trinidad and Tobago','Port of Spain'],['Uganda','Kampala'],['Yemen','Sana’a']
].map(function(a){return {country:a[0],city:a[1],answer:a[1]}});

function extractRings(feature){
 const g=feature.geometry;if(!g)return [];
 const polys=g.type==='Polygon'?[g.coordinates]:g.type==='MultiPolygon'?g.coordinates:[];
 return polys.map(function(poly){return (poly&&poly[0])?poly[0]:[]}).filter(function(r){return r.length>2});
}
function unwrapLon(lon,center){return center+((((lon-center)+540)%360)-180)}
function ringArea(r){let a=0;for(let i=0,j=r.length-1;i<r.length;j=i++){a+=r[j][0]*r[i][1]-r[i][0]*r[j][1]}return Math.abs(a/2)}
function prepareFeature(feature){
 const props=feature.properties||{}, name=props.ADMIN||props.NAME_EN||props.NAME;
 if(!name||name==='Antarctica')return null;
 if(props.TYPE&& !/country/i.test(props.TYPE))return null;
 const original=extractRings(feature);
 if(!original.length)return null;
 const positions=[];original.forEach(function(r){r.forEach(function(p){positions.push(p)})});
 let sx=0,sy=0;positions.forEach(function(p){sx+=Math.cos(p[0]*Math.PI/180);sy+=Math.sin(p[0]*Math.PI/180)});
 const centerLon=Math.atan2(sy,sx)*180/Math.PI;
 let rings=original.map(function(r){return r.map(function(p){return [unwrapLon(p[0],centerLon),p[1]]})});
 let all=rings.flat();let minLon=Math.min.apply(null,all.map(p=>p[0])),maxLon=Math.max.apply(null,all.map(p=>p[0]));
 if((maxLon-minLon)>80){rings=[rings.sort(function(a,b){return ringArea(b)-ringArea(a)})[0]];all=rings.flat();minLon=Math.min.apply(null,all.map(p=>p[0]));maxLon=Math.max.apply(null,all.map(p=>p[0]))}
 const minLat=Math.min.apply(null,all.map(p=>p[1])),maxLat=Math.max.apply(null,all.map(p=>p[1]));
 const lat0=(minLat+maxLat)/2, cos=Math.max(.2,Math.cos(lat0*Math.PI/180));
 const px=all.map(p=>p[0]*cos), minX=Math.min.apply(null,px),maxX=Math.max.apply(null,px), midX=(minX+maxX)/2,midY=(minLat+maxLat)/2;
 const scale=Math.min(220/Math.max(0.01,maxX-minX),130/Math.max(0.01,maxLat-minLat));
 const norm=rings.map(function(r){return r.map(function(p){return [210+(p[0]*cos-midX)*scale,140-(p[1]-midY)*scale]})});
 return {name:name,rings:norm};
}
async function loadCountryPool(){
 if(countryPool)return countryPool;
 const url='https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson';
 const res=await fetch(url,{cache:'force-cache'});if(!res.ok)throw new Error('Could not load country outlines');
 const geo=await res.json();
 const records=geo.features.map(prepareFeature).filter(Boolean);
 const seen=new Set();countryPool=records.filter(function(c){if(seen.has(c.name))return false;seen.add(c.name);return true});
 if(countryPool.length<80)throw new Error('Country outline set was incomplete');
 return countryPool;
}
function getPool(){if(KIND==='countries')return countryPool||[];if(KIND==='animals')return ANIMALS;return CAPITALS}
function answerOf(q){return q.answer}
function optionsFor(q,pool){
 const ans=answerOf(q);const others=shuffle(pool.filter(function(x){return answerOf(x)!==ans})).slice(0,3).map(answerOf);
 return shuffle(unique([ans].concat(others))).slice(0,4)
}
function createPath(q,angle){
 const shape=q.rings.map(function(ring){if(!ring.length)return '';let d='M '+ring[0][0].toFixed(1)+' '+ring[0][1].toFixed(1);for(let i=1;i<ring.length;i++)d+=' L '+ring[i][0].toFixed(1)+' '+ring[i][1].toFixed(1);return d+' Z'}).join(' ');
 return '<svg class="country-svg" viewBox="0 0 420 280" role="img" aria-label="Country outline rotated '+angle+' degrees"><g transform="rotate('+angle+' 210 140)"><path d="'+shape+'" fill="#b6d7bd" stroke="#2d7252" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/></g></svg>';
}
function chooseQuestion(){
 let pool=getPool();if(!pool.length)return null;
 if(used.size>=pool.length)used.clear();
 let candidates=pool.filter(function(q){return !used.has(answerOf(q))});if(!candidates.length){used.clear();candidates=pool.slice()}
 const q=pick(candidates);used.add(answerOf(q));return q;
}
function renderClue(q){
 const clue=$('clue');clue.innerHTML='';
 if(KIND==='countries'){
  const angle=pick([27,38,49,63,74,108,121,137,152,208,224,241,257,278,299,317,333]);
  clue.innerHTML=createPath(q,angle);
 }else if(KIND==='animals'){
  const el=document.createElement('div');el.className='animal-emoji';el.setAttribute('role','img');el.setAttribute('aria-label','Animal illustration');el.textContent=q.emoji;clue.appendChild(el);
 }else{
  const mark=document.createElement('div');mark.className='capital-mark';mark.setAttribute('aria-hidden','true');mark.textContent='🏙️';clue.appendChild(mark);
  const name=document.createElement('div');name.className='country-prompt-name';name.textContent=q.country;clue.appendChild(name);
 }
}
function nextQuestion(){
 if(time<=0)return;
 locked=false;current=chooseQuestion();
 if(!current){endGame();return}
 round++;$('roundLabel').textContent=cfg.upper+' '+String(round).padStart(2,'0');
 $('level').textContent=KIND==='countries'?'ROTATED OUTLINE':KIND==='animals'?'ANIMAL KINGDOM':'WORLD KNOWLEDGE';
 renderClue(current);
 const options=optionsFor(current,getPool()),wrap=$('answers');wrap.innerHTML='';
 options.forEach(function(opt){const b=document.createElement('button');b.type='button';b.className='answer';b.textContent=opt;b.addEventListener('click',function(){answer(b,opt)});wrap.appendChild(b)});
 $('feedback').textContent='';$('feedback').className='feedback';
}
function answer(btn,opt){
 if(locked||time<=0)return;locked=true;answered++;
 const buttons=Array.from($('answers').querySelectorAll('button')),isRight=opt===answerOf(current);
 buttons.forEach(function(b){b.disabled=true;if(b.textContent===answerOf(current))b.classList.add('correct')});
 if(isRight){score++;correct++;streak++;bestStreak=Math.max(bestStreak,streak);$('feedback').textContent=pick(['Correct!','That’s it!','Nice one!','You got it!']);$('feedback').classList.add('good');btn.classList.add('correct');if(soundOn)correctSound()}
 else{streak=0;btn.classList.add('wrong');$('feedback').textContent='It was '+answerOf(current)+'. Keep going!';$('feedback').classList.add('bad');if(soundOn)wrongSound()}
 $('score').textContent=score;$('streak').textContent=streak;
 advanceId=setTimeout(function(){if(time>0)nextQuestion()},520)
}
function tick(){
 time--;if(time<0)time=0;$('time').textContent=time;$('timebar').style.width=(time/60*100)+'%';
 $('timerStat').classList.toggle('urgent',time<=10);
 if(time<=0)endGame();
}
function startGame(){
 if(KIND==='countries'&&!countryPool){startBtn.disabled=true;startBtn.classList.add('loading');startBtn.innerHTML='Loading country outlines…';$('introNote').textContent='Loading the map shapes for the rotated country quiz.';loadCountryPool().then(function(){startBtn.disabled=false;startBtn.classList.remove('loading');startBtn.innerHTML='Let’s play <span class="arrow">→</span>';startActually()}).catch(function(){startBtn.disabled=false;startBtn.classList.remove('loading');startBtn.innerHTML='Try loading again <span class="arrow">↻</span>';$('introNote').textContent='Country outlines could not load. Check your connection and tap to try again.'});return}
 startActually();
}
function startActually(){
 if(advanceId)clearTimeout(advanceId);if(timerId)clearInterval(timerId);stopMusic();
 time=60;score=0;correct=0;answered=0;streak=0;bestStreak=0;round=0;used.clear();locked=false;
 $('time').textContent='60';$('score').textContent='0';$('streak').textContent='0';$('timebar').style.width='100%';$('timerStat').classList.remove('urgent');$('best').textContent=best;
 intro.style.display='none';result.classList.remove('active');result.style.display='none';game.classList.add('active');game.style.display='flex';
 nextQuestion();if(soundOn){setupAudio();startMusic()}timerId=setInterval(tick,1000);
}
function endGame(){
 if(timerId){clearInterval(timerId);timerId=null}if(advanceId){clearTimeout(advanceId);advanceId=null}stopMusic();locked=true;
 game.classList.remove('active');game.style.display='none';result.classList.add('active');result.style.display='flex';
 const acc=answered?Math.round(correct/answered*100):0;
 if(score>best){best=score;safeSet(cfg.storage,best)}
 $('finalScore').textContent=score;$('resultBest').textContent=best;$('accuracy').textContent=acc+'%';$('correctCount').textContent=correct;$('answeredCount').textContent=answered;$('bestStreak').textContent=bestStreak;
 $('resultTitle').textContent=score>=20?'Brilliant instincts.':score>=10?cfg.resultTitle:score>=4?'You’re warming up.':'Every round makes you sharper.';
 $('resultText').textContent='You got '+correct+' out of '+answered+' answers right. Fancy another round?';
}
startBtn.addEventListener('click',startGame);againBtn.addEventListener('click',startActually);
function rounded(ctx,x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath()}
async function scoreBlob(){
 const canvas=document.createElement('canvas');canvas.width=1080;canvas.height=1350;const c=canvas.getContext('2d');
 c.fillStyle='#f8f7f2';c.fillRect(0,0,1080,1350);
 c.fillStyle='#d7fb55';rounded(c,76,78,928,1194,35);c.fill();
 c.fillStyle='#fffefa';rounded(c,100,102,880,1146,28);c.fill();
 c.fillStyle='#191b1a';c.font='900 45px Arial, sans-serif';c.fillText('GUESS THE  ____',150,190);
 c.fillStyle='#787d73';c.font='800 25px Arial, sans-serif';c.fillText('YOUR CATEGORY',150,290);
 c.fillStyle='#191b1a';c.font='900 68px Arial, sans-serif';c.fillText(cfg.label.toUpperCase(),150,370);
 c.fillStyle='#d7fb55';rounded(c,150,430,780,310,24);c.fill();
 c.fillStyle='#191b1a';c.font='800 28px Arial, sans-serif';c.fillText('YOUR SCORE',198,500);
 c.font='900 205px Arial, sans-serif';c.fillText(String(score),190,690);
 c.fillStyle='#191b1a';c.font='800 30px Arial, sans-serif';c.fillText('ACCURACY',150,830);c.fillText('CORRECT',580,830);
 c.font='900 70px Arial, sans-serif';c.fillText((answered?Math.round(correct/answered*100):0)+'%',150,915);c.fillText(String(correct)+' / '+String(answered),580,915);
 c.fillStyle='#787d73';c.font='700 27px Arial, sans-serif';c.fillText('Can you beat my score?',150,1045);
 c.fillStyle='#191b1a';c.font='900 25px Arial, sans-serif';c.fillText('SHORT ROUNDS. SHARP INSTINCTS.',150,1155);
 c.fillStyle='#81867b';c.font='600 21px Arial, sans-serif';c.fillText('guess the ____',150,1202);
 return await new Promise(function(resolve,reject){canvas.toBlob(function(blob){if(blob)resolve(blob);else reject(new Error('Could not create score image'))},'image/png')})
}
async function shareScore(){
 shareBtn.disabled=true;const old=shareBtn.textContent;shareBtn.textContent='Creating image…';
 try{
  const blob=await scoreBlob();const file=new File([blob],'guess-the-'+KIND+'-score.png',{type:'image/png'});
  if(navigator.share&&navigator.canShare&&navigator.canShare({files:[file]})){await navigator.share({files:[file],title:'My '+cfg.label+' score',text:'I scored '+score+' in Guess the ____! Can you beat me?'})}
  else{const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='guess-the-'+KIND+'-score.png';document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(url)},1500);showToast('Score image saved. Share it from your photos or downloads.')}
 }catch(e){if(e&&e.name!=='AbortError')showToast('Could not create image. Try again.')}
 finally{shareBtn.disabled=false;shareBtn.textContent=old}
}
shareBtn.addEventListener('click',shareScore);
let toastTimer=null;function showToast(msg){const el=$('toast');el.textContent=msg;el.classList.add('show');if(toastTimer)clearTimeout(toastTimer);toastTimer=setTimeout(function(){el.classList.remove('show')},2600)}
$('time').textContent=String(time);
})();