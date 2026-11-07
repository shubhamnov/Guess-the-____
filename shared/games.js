/* Every game that plays with the shared engine, and the categories they sit in.
 *
 * GTQ_CATEGORIES: the cards on the home page. Each category page (its folder) lists its topics and has a mix of them.
 *   id: folder · label · emoji · blurb: one line on the home card · mix: the folder of its mix game
 *   (Sports uses Guess the Sports, which already mixes every sport; the others have <category>/mix/).
 *   Name Them All, a typing game with its own page code, is a category of its own: href instead of topics.
 *
 * GTQ_GAMES: every topic, in the order the category pages and /live/ list them.
 *   path: the game's folder · label: its name · emoji: its icon in lists · id: its best-score key (gtq:best:<id>) ·
 *   cat: its category · region: 'india' for a game that is all Indian (hidden in Global; games with some Indian
 *   questions filter them themselves, see shared/region.js) · sub: a topic whose questions are already in another
 *   game (the sports topics are all in Guess the Sports), so the Daily Mix and the Live Mix leave it out.
 *
 * The Daily Mix and the Live Mix take questions from every game here that is not sub (shared/mix.js), so a new game
 * shows up in them, on its category page and on /live/ once it is added to this list. tests/registry.spec.js checks it. */
window.GTQ_CATEGORIES=[
 {id:'world',label:'World & Places',emoji:'🌍',blurb:'Flags, capitals, landmarks, food and languages',mix:'world/mix'},
 {id:'movies-tv',label:'Movies & TV',emoji:'🎬',blurb:'Bollywood, Hollywood, series and web series',mix:'movies-tv/mix'},
 {id:'sports',label:'Sports',emoji:'🏅',blurb:'Cricket, football, tennis, F1, the Olympics and more',mix:'guess-the-sports'},
 {id:'science-nature',label:'Science & Nature',emoji:'🧪',blurb:'Elements, animals and colors',mix:'science-nature/mix'},
 {id:'general-knowledge',label:'General Knowledge',emoji:'🧠',blurb:'World politics and brand logos',mix:'general-knowledge/mix'},
 {id:'name-them-all',label:'Name Them All',emoji:'✍️',blurb:'Type every answer you can think of',href:'name-them-all'}
];
window.GTQ_GAMES=[
 {path:'guess-the-flag',label:'Flags',emoji:'🏳️',id:'flags',cat:'world'},
 {path:'guess-the-countries',label:'Countries',emoji:'🗺️',id:'countries',cat:'world'},
 {path:'guess-the-capitals',label:'Capital Cities',emoji:'🏛️',id:'capitals',cat:'world'},
 {path:'guess-the-landmarks',label:'Landmarks',emoji:'🗼',id:'landmarks',cat:'world'},
 {path:'guess-the-currencies',label:'Currencies',emoji:'💱',id:'currencies',cat:'world'},
 {path:'guess-the-languages',label:'Languages',emoji:'🗣️',id:'languages',cat:'world'},
 {path:'guess-the-scripts',label:'Scripts',emoji:'✍️',id:'scripts',cat:'world'},
 {path:'guess-the-cuisine',label:'Cuisine',emoji:'🍜',id:'cuisine',cat:'world'},
 {path:'guess-the-bollywood',label:'Bollywood',emoji:'🎬',id:'bollywood',cat:'movies-tv',region:'india'},
 {path:'guess-the-hollywood',label:'Hollywood',emoji:'🍿',id:'hollywood',cat:'movies-tv'},
 {path:'guess-the-series',label:'Series',emoji:'📺',id:'series',cat:'movies-tv'},
 {path:'guess-the-web-series',label:'Web Series',emoji:'📱',id:'web-series',cat:'movies-tv'},
 {path:'guess-the-sports',label:'Sports',emoji:'🏅',id:'sports',cat:'sports'},
 {path:'guess-the-cricket',label:'Cricket',emoji:'🏏',id:'cricket',cat:'sports',sub:true},
 {path:'guess-the-football',label:'Football',emoji:'⚽',id:'football',cat:'sports',sub:true},
 {path:'guess-the-tennis',label:'Tennis',emoji:'🎾',id:'tennis',cat:'sports',sub:true},
 {path:'guess-the-f1',label:'F1',emoji:'🏎️',id:'f1',cat:'sports',sub:true},
 {path:'guess-the-olympics',label:'Olympics',emoji:'🏅',id:'olympics',cat:'sports',sub:true},
 {path:'guess-the-more-sports',label:'More sports',emoji:'🏀',id:'more-sports',cat:'sports',sub:true},
 {path:'guess-the-elements',label:'Elements',emoji:'⚗️',id:'elements',cat:'science-nature'},
 {path:'guess-the-animals',label:'Animals',emoji:'🦊',id:'animals',cat:'science-nature'},
 {path:'guess-the-color',label:'Colors',emoji:'🎨',id:'colors',cat:'science-nature'},
 {path:'guess-the-world-politics',label:'World Politics',emoji:'🏛️',id:'world-politics',cat:'general-knowledge'},
 {path:'guess-the-brand-logos',label:'Brand Logos',emoji:'🏷️',id:'brand-logos',cat:'general-knowledge'}
];
