/* A category's mix: questions from every topic in one category (World & Places, Movies & TV, Science & Nature,
 * General Knowledge). The page is <category>/mix/ with <body data-cat="<category id>"> and loads region.js,
 * games.js, engine.js, mode-switch.js and mix.js first. Questions come from shared/mix.js, which loads the category's
 * games in hidden frames. Solo rounds are new every time; a friend game draws from the room's seed, so both players
 * get the same questions. (Sports has no page here: Guess the Sports already mixes every sport.)
 * Without data-cat (the page mix/ at the top level) it is the mix of everything: every game in every category. */
(function(){
'use strict';
const ALL={id:'all',label:'Everything',emoji:'🎲',all:true};
const CAT=document.body.dataset.cat?(window.GTQ_CATEGORIES||[]).find(c=>c.id===document.body.dataset.cat):ALL;
const UP=CAT.all?'../':'../../';
const REGION=GTQRegion.get();
const loadMix=()=>GTQMix.load(REGION,CAT.all?undefined:CAT.id);
loadMix().catch(()=>{});
const GAMES=window.GTQ_GAMES.filter(GTQMix.inMix);
/* Enough questions for a fast 60 seconds (about 36), spread evenly over the topics. */
const PER_GAME=Math.max(2,Math.ceil(36/Math.max(1,GAMES.length)));
const names=GAMES.map(g=>g.label);
const list=names.length>1?names.slice(0,-1).join(', ')+' and '+names[names.length-1]:names.join('');
GuessGame.run(common(CAT.all?{
 id:'mix-all',label:'Mix of everything',pill:'Mix of everything',emoji:CAT.emoji,
 homeHref:'../',homeLabel:'All categories',reloadOnRegion:true,
 eyebrow:'🎲 Every category · Mix',
 titleHtml:'Every game.<br><em>One mix.</em>',
 intro:(REGION==='both'?'':GTQRegion.notePrefix(REGION))+'Questions from all '+GAMES.length+' games in every category, shuffled together. New questions every round, 60 seconds to get through as many as you can.',
 links:[{text:'Daily Mix',href:UP+'daily-challenge/'}]
}:{
 id:'mix-'+CAT.id,label:CAT.label+' mix',pill:CAT.label+' · Mix',emoji:CAT.emoji,
 homeHref:'../',homeLabel:CAT.label,reloadOnRegion:true,
 eyebrow:CAT.emoji+' '+CAT.label+' · Mix',
 titleHtml:'Every topic.<br><em>One mix.</em>',
 intro:(REGION==='both'?'':GTQRegion.notePrefix(REGION))+'Questions from '+list+', shuffled together. 60 seconds to get through as many as you can.',
 links:[{text:'Daily Mix',href:UP+'daily-challenge/'},{text:'All categories',href:UP}]
}));
function common(cfg){return Object.assign(cfg,{
 note:GAMES.map(g=>g.emoji+' '+g.label).join(' · '),
 prompt:'Which one is it?',
 load:loadMix,
 // The games load for one region, so a change of setting reloads the page with the new mix.
 onRegion(){location.reload()},
 makeRound(){return GTQMix.questions('category-mix|'+CAT.id+'|'+Math.random(),PER_GAME)}
})}
})();
