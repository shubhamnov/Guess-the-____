/* A category's mix: questions from every topic in one category (World & Places, Movies & TV, Science & Nature,
 * General Knowledge). The page is <category>/mix/ with <body data-cat="<category id>"> and loads region.js,
 * games.js, engine.js, mode-switch.js and mix.js first. Questions come from shared/mix.js, which loads the category's
 * games in hidden frames. Solo rounds are new every time; a friend game draws from the room's seed, so both players
 * get the same questions. (Sports has no page here: Guess the Sports already mixes every sport.) */
(function(){
'use strict';
const CAT=(window.GTQ_CATEGORIES||[]).find(c=>c.id===document.body.dataset.cat);
const REGION=GTQRegion.get();
GTQMix.load(REGION,CAT.id).catch(()=>{});
const GAMES=window.GTQ_GAMES.filter(GTQMix.inMix);
/* Enough questions for a fast 60 seconds (about 36), spread evenly over the topics. */
const PER_GAME=Math.max(2,Math.ceil(36/Math.max(1,GAMES.length)));
const names=GAMES.map(g=>g.label);
const list=names.length>1?names.slice(0,-1).join(', ')+' and '+names[names.length-1]:names.join('');
GuessGame.run({
 id:'mix-'+CAT.id,label:CAT.label+' mix',pill:CAT.label+' · Mix',emoji:CAT.emoji,
 homeHref:'../',homeLabel:CAT.label,reloadOnRegion:true,
 eyebrow:CAT.emoji+' '+CAT.label+' · Mix',
 titleHtml:'Every topic.<br><em>One mix.</em>',
 intro:(REGION==='both'?'':GTQRegion.notePrefix(REGION))+'Questions from '+list+', shuffled together. 60 seconds to get through as many as you can.',
 note:GAMES.map(g=>g.emoji+' '+g.label).join(' · '),
 prompt:'Which one is it?',
 links:[{text:'Daily Mix',href:'../../daily-challenge/'},{text:'All categories',href:'../../'}],
 load:()=>GTQMix.load(REGION,CAT.id),
 // The games load for one region, so a change of setting reloads the page with the new mix.
 onRegion(){location.reload()},
 makeRound(){return GTQMix.questions('category-mix|'+CAT.id+'|'+Math.random(),PER_GAME)}
});
})();
