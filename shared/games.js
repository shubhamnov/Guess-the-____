/* Every game that plays with the shared engine, in the order the live page lists them.
 * The Daily Mix and the Live Mix take questions from every game here, and /live/ lists them, so a new game
 * shows up in all three once it is added to this list. tests/registry.spec.js checks that every game card on the
 * home page is here (Name Them All, a typing game, is the one exception: data-solo on its card).
 * path: the game's folder · label: its name · emoji: its icon in lists. */
window.GTQ_GAMES=[
 {path:'guess-the-flag',label:'Flags',emoji:'🏳️'},
 {path:'guess-the-color',label:'Colors',emoji:'🎨'},
 {path:'guess-the-countries',label:'Countries',emoji:'🗺️'},
 {path:'guess-the-capitals',label:'Capital Cities',emoji:'🏛️'},
 {path:'guess-the-landmarks',label:'Landmarks',emoji:'🗼'},
 {path:'guess-the-cuisine',label:'Cuisine',emoji:'🍜'},
 {path:'guess-the-animals',label:'Animals',emoji:'🦊'},
 {path:'guess-the-scripts',label:'Scripts',emoji:'✍️'},
 {path:'guess-the-brand-logos',label:'Brand Logos',emoji:'🏷️'},
 {path:'guess-the-currencies',label:'Currencies',emoji:'💱'},
 {path:'guess-the-elements',label:'Elements',emoji:'⚗️'},
 {path:'guess-the-languages',label:'Languages',emoji:'🗣️'},
 {path:'guess-the-bollywood',label:'Bollywood',emoji:'🎬'},
 {path:'guess-the-hollywood',label:'Hollywood',emoji:'🍿'},
 {path:'guess-the-sports',label:'Sports',emoji:'🏅'},
 {path:'guess-the-series',label:'Series',emoji:'📺'},
 {path:'guess-the-web-series',label:'Web Series',emoji:'📱'}
];
