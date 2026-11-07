/* Name Them All topics.
 * Each topic: id, cat (picker section), emoji, title (“Name the …”), items.
 * Each item is "Answer" or ["Answer", "hint shown in the empty slot", "other accepted spelling", ...].
 * Optional: note (one line under the title), surnames:true (accept a surname on its own when only one answer has it),
 * strip:[...] (words a player may type in front of an answer, e.g. "Harry Potter and the").
 * Matching ignores case, accents, punctuation, spaces, "and", a leading "the", and small typos (on Enter).
 * Countries by continent are built on the page from shared/world.js, with the extra spellings in nameCountryAliases. */
/* region: 'india' or 'global' for the site-wide Global / India / Both switch (shared/region.js); no region = always shown. */
window.GTQ_DATA=window.GTQ_DATA||{};
GTQ_DATA.nameCountryAliases={
"United States":["USA","US","America","United States of America"],
"United Kingdom":["UK","Britain","Great Britain"],
"United Arab Emirates":["UAE"],
"Côte d’Ivoire":["Ivory Coast"],
"Democratic Republic of the Congo":["DR Congo","DRC","Congo-Kinshasa"],
"Republic of the Congo":["Congo","Congo-Brazzaville"],
"Czechia":["Czech Republic"],
"Türkiye":["Turkey"],
"Eswatini":["Swaziland"],
"Myanmar":["Burma"],
"Timor-Leste":["East Timor"],
"Cabo Verde":["Cape Verde"],
"North Korea":["DPRK"],
"Vatican City":["Vatican","Holy See"],
"North Macedonia":["Macedonia"],
"Bosnia and Herzegovina":["Bosnia"],
"Netherlands":["Holland"],
"Papua New Guinea":["PNG"],
"Central African Republic":["CAR"],
"Micronesia":["Federated States of Micronesia"]
};
GTQ_DATA.nameTopics=[
/* ---------- India ---------- */
{id:'indian-states',cat:'India',region:'india',emoji:'🇮🇳',title:'Indian states',items:[
"Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat","Haryana",["Himachal Pradesh","","HP"],
"Jharkhand","Karnataka","Kerala",["Madhya Pradesh","","MP"],"Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland",
["Odisha","","Orissa"],"Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura",["Uttar Pradesh","","UP"],
["Uttarakhand","","Uttaranchal"],"West Bengal"]},
{id:'union-territories',cat:'India',region:'india',emoji:'🏝️',title:'Union territories of India',items:[
["Andaman and Nicobar Islands","","Andaman","Andaman and Nicobar"],"Chandigarh",
["Dadra and Nagar Haveli and Daman and Diu","","Daman and Diu","Dadra and Nagar Haveli","Daman","Dadra"],
["Delhi","","New Delhi","NCT of Delhi"],["Jammu and Kashmir","","J&K","Kashmir"],"Ladakh","Lakshadweep",["Puducherry","","Pondicherry"]]},
{id:'prime-ministers',cat:'India',region:'india',emoji:'🏛️',title:'Prime Ministers of India',note:'Every one since 1947, acting PMs included.',surnames:true,items:[
["Jawaharlal Nehru","1947","Nehru","Pandit Nehru"],["Gulzarilal Nanda","1964 · acting"],["Lal Bahadur Shastri","1964","Shastri"],
["Indira Gandhi","1966","Indira"],["Morarji Desai","1977"],["Charan Singh","1979","Chaudhary Charan Singh"],["Rajiv Gandhi","1984","Rajiv"],
["V. P. Singh","1989","Vishwanath Pratap Singh"],["Chandra Shekhar","1990","Chandrashekhar"],["P. V. Narasimha Rao","1991","Narasimha Rao"],
["Atal Bihari Vajpayee","1996","Vajpayee","Atal"],["H. D. Deve Gowda","1996","Deve Gowda"],["I. K. Gujral","1997","Inder Kumar Gujral"],
["Manmohan Singh","2004","Manmohan"],["Narendra Modi","2014","Modi"]]},

/* ---------- Geography ---------- */
{id:'continents',cat:'Geography',emoji:'🌍',title:'continents',items:[
"Africa","Antarctica","Asia",["Australia","","Oceania","Australia Oceania"],"Europe","North America","South America"]},
{id:'oceans',cat:'Geography',emoji:'🌊',title:'oceans',strip:['ocean'],items:[
"Pacific","Atlantic","Indian",["Southern","","Antarctic"],"Arctic"]},
{id:'countries-south-america',cat:'Geography',emoji:'🗺️',title:'countries in South America',countries:'South America'},
{id:'countries-oceania',cat:'Geography',emoji:'🏝️',title:'countries in Oceania',countries:'Oceania'},
{id:'countries-north-america',cat:'Geography',emoji:'🗺️',title:'countries in North America',note:'Central America and the Caribbean count too.',countries:'North America'},
{id:'countries-europe',cat:'Geography',emoji:'🗺️',title:'countries in Europe',countries:'Europe'},
{id:'countries-asia',cat:'Geography',emoji:'🗺️',title:'countries in Asia',note:'Cyprus and Türkiye count as Asia here.',countries:'Asia'},
{id:'countries-africa',cat:'Geography',emoji:'🗺️',title:'countries in Africa',countries:'Africa'},
{id:'seven-wonders',cat:'Geography',emoji:'🏯',title:'New Seven Wonders of the World',items:[
["Great Wall of China","China","Great Wall"],["Petra","Jordan"],["Christ the Redeemer","Brazil","Christ Redeemer"],["Machu Picchu","Peru"],
["Chichén Itzá","Mexico"],["Colosseum","Italy","Coliseum","Roman Colosseum"],["Taj Mahal","India"]]},

/* ---------- Bollywood ---------- */
{id:'srk-films',cat:'Bollywood',emoji:'🎬',title:'Shah Rukh Khan films',note:'His films as the lead, 1992 to now.',items:[
["Deewana","1992"],["Raju Ban Gaya Gentleman","1992"],["Chamatkar","1992"],["Baazigar","1993","Bazigar"],["Darr","1993"],
["Kabhi Haan Kabhi Naa","1994"],["Anjaam","1994"],["Karan Arjun","1995"],["Dilwale Dulhania Le Jayenge","1995","DDLJ"],["Ram Jaane","1995"],
["Koyla","1997"],["Yes Boss","1997"],["Pardes","1997"],["Dil To Pagal Hai","1997"],["Duplicate","1998"],["Dil Se..","1998"],
["Kuch Kuch Hota Hai","1998","KKHH"],["Baadshah","1999","Badshah"],["Phir Bhi Dil Hai Hindustani","2000"],["Josh","2000"],["Mohabbatein","2000"],
["One 2 Ka 4","2001"],["Asoka","2001","Ashoka"],["Kabhi Khushi Kabhie Gham","2001","K3G","Kabhi Khushi Kabhi Gham"],["Devdas","2002"],
["Chalte Chalte","2003"],["Kal Ho Naa Ho","2003","Kal Ho Na Ho","KHNH"],["Main Hoon Na","2004"],["Veer-Zaara","2004"],["Swades","2004"],
["Paheli","2005"],["Kabhi Alvida Naa Kehna","2006","KANK"],["Don","2006"],["Chak De! India","2007","Chak De"],["Om Shanti Om","2007","OSO"],
["Rab Ne Bana Di Jodi","2008","RNBDJ"],["Billu","2009","Billu Barber"],["My Name Is Khan","2010","MNIK"],["Ra.One","2011"],["Don 2","2011"],
["Jab Tak Hai Jaan","2012","JTHJ"],["Chennai Express","2013"],["Happy New Year","2014"],["Dilwale","2015"],["Fan","2016"],
["Dear Zindagi","2016"],["Raees","2017","Rais"],["Jab Harry Met Sejal","2017"],["Zero","2018"],["Pathaan","2023","Pathan"],["Jawan","2023"],["Dunki","2023"]]},
{id:'aamir-films',cat:'Bollywood',emoji:'🎬',title:'Aamir Khan films',note:'His films as the lead, 1988 to now.',items:[
["Qayamat Se Qayamat Tak","1988","QSQT"],["Dil","1990"],["Dil Hai Ke Manta Nahin","1991"],["Jo Jeeta Wohi Sikandar","1992","JJWS"],
["Hum Hain Rahi Pyar Ke","1993"],["Andaz Apna Apna","1994"],["Baazi","1995"],["Rangeela","1995"],["Akele Hum Akele Tum","1995"],
["Raja Hindustani","1996"],["Ishq","1997"],["Ghulam","1998"],["Sarfarosh","1999"],["Mann","1999"],["Mela","2000"],
["Lagaan","2001"],["Dil Chahta Hai","2001","DCH"],["Mangal Pandey: The Rising","2005","Mangal Pandey"],["Rang De Basanti","2006","RDB"],
["Fanaa","2006","Fana"],["Taare Zameen Par","2007","TZP"],["Ghajini","2008"],["3 Idiots","2009"],["Talaash","2012"],["Dhoom 3","2013"],
["PK","2014"],["Dangal","2016"],["Secret Superstar","2017"],["Thugs of Hindostan","2018","Thugs of Hindustan"],
["Laal Singh Chaddha","2022","Lal Singh Chadha"],["Sitaare Zameen Par","2025","Sitare Zameen Par"]]},
{id:'salman-films',cat:'Bollywood',emoji:'🎬',title:'Salman Khan films',note:'His films as the lead, 1989 to now.',items:[
["Maine Pyar Kiya","1989","MPK"],["Saajan","1991","Sajan"],["Hum Aapke Hain Koun..!","1994","HAHK","Hum Aapke Hain Kaun"],["Andaz Apna Apna","1994"],
["Karan Arjun","1995"],["Jeet","1996"],["Judwaa","1997","Judwa"],["Pyaar Kiya To Darna Kya","1998"],["Hum Dil De Chuke Sanam","1999","HDDCS"],
["Biwi No.1","1999","Biwi Number 1"],["Hum Saath-Saath Hain","1999","Hum Saath Saath Hain"],["Chori Chori Chupke Chupke","2001"],["Tere Naam","2003"],
["Mujhse Shaadi Karogi","2004"],["No Entry","2005"],["Partner","2007"],["Wanted","2009"],["Dabangg","2010","Dabang"],["Ready","2011"],
["Bodyguard","2011"],["Ek Tha Tiger","2012"],["Dabangg 2","2012","Dabang 2"],["Jai Ho","2014"],["Kick","2014"],
["Bajrangi Bhaijaan","2015"],["Prem Ratan Dhan Payo","2015","PRDP"],["Sultan","2016"],["Tubelight","2017"],["Tiger Zinda Hai","2017"],
["Race 3","2018"],["Bharat","2019"],["Dabangg 3","2019","Dabang 3"],["Radhe","2021"],["Tiger 3","2023"],
["Kisi Ka Bhai Kisi Ki Jaan","2023"],["Sikandar","2025"]]},
{id:'bhansali-films',cat:'Bollywood',emoji:'🎞️',title:'films directed by Sanjay Leela Bhansali',items:[
["Khamoshi: The Musical","1996","Khamoshi"],["Hum Dil De Chuke Sanam","1999","HDDCS"],["Devdas","2002"],["Black","2005"],["Saawariya","2007","Sawariya"],
["Guzaarish","2010","Guzarish"],["Goliyon Ki Raasleela Ram-Leela","2013","Ram-Leela","Ramleela"],["Bajirao Mastani","2015"],["Padmaavat","2018","Padmavat","Padmavati"],
["Gangubai Kathiawadi","2022","Gangubai"]]},
{id:'karan-johar-films',cat:'Bollywood',emoji:'🎞️',title:'films directed by Karan Johar',items:[
["Kuch Kuch Hota Hai","1998","KKHH"],["Kabhi Khushi Kabhie Gham","2001","K3G","Kabhi Khushi Kabhi Gham"],["Kabhi Alvida Naa Kehna","2006","KANK"],
["My Name Is Khan","2010","MNIK"],["Student of the Year","2012","SOTY"],["Ae Dil Hai Mushkil","2016","ADHM"],
["Rocky Aur Rani Kii Prem Kahaani","2023","Rocky Aur Rani","Rocky Aur Rani Ki Prem Kahani"]]},
{id:'hirani-films',cat:'Bollywood',emoji:'🎞️',title:'films directed by Rajkumar Hirani',items:[
["Munna Bhai M.B.B.S.","2003","Munna Bhai MBBS"],["Lage Raho Munna Bhai","2006"],["3 Idiots","2009"],["PK","2014"],["Sanju","2018"],["Dunki","2023"]]},

/* ---------- Hollywood ---------- */
{id:'harry-potter',cat:'Hollywood',region:'global',emoji:'⚡',title:'Harry Potter films',strip:['harry potter and the','harry potter'],items:[
["Philosopher’s Stone","2001","Sorcerer’s Stone"],["Chamber of Secrets","2002"],["Prisoner of Azkaban","2004"],["Goblet of Fire","2005"],
["Order of the Phoenix","2007"],["Half-Blood Prince","2009"],["Deathly Hallows – Part 1","2010","Deathly Hallows 1"],["Deathly Hallows – Part 2","2011","Deathly Hallows 2"]]},
{id:'bond-actors',cat:'Hollywood',region:'global',emoji:'🍸',title:'actors who played James Bond',note:'In the official Eon films.',surnames:true,items:[
["Sean Connery","1962"],["George Lazenby","1969"],["Roger Moore","1973"],["Timothy Dalton","1987"],["Pierce Brosnan","1995"],["Daniel Craig","2006"]]},
{id:'pixar',cat:'Hollywood',region:'global',emoji:'🧸',title:'Pixar films',items:[
["Toy Story","1995"],["A Bug’s Life","1998","Bugs Life"],["Toy Story 2","1999"],["Monsters, Inc.","2001","Monsters Inc"],["Finding Nemo","2003"],
["The Incredibles","2004"],["Cars","2006"],["Ratatouille","2007"],["WALL-E","2008","Wall E"],["Up","2009"],["Toy Story 3","2010"],["Cars 2","2011"],
["Brave","2012"],["Monsters University","2013"],["Inside Out","2015"],["The Good Dinosaur","2015"],["Finding Dory","2016"],["Cars 3","2017"],
["Coco","2017"],["Incredibles 2","2018"],["Toy Story 4","2019"],["Onward","2020"],["Soul","2020"],["Luca","2021"],["Turning Red","2022"],
["Lightyear","2022"],["Elemental","2023"],["Inside Out 2","2024"],["Elio","2025"]]},
{id:'mcu',cat:'Hollywood',region:'global',emoji:'🦸',title:'Marvel Cinematic Universe films',note:'Iron Man (2008) to 2025.',items:[
["Iron Man","2008"],["The Incredible Hulk","2008"],["Iron Man 2","2010"],["Thor","2011"],["Captain America: The First Avenger","2011"],
["The Avengers","2012","Avengers"],["Iron Man 3","2013"],["Thor: The Dark World","2013"],["Captain America: The Winter Soldier","2014"],
["Guardians of the Galaxy","2014"],["Avengers: Age of Ultron","2015"],["Ant-Man","2015"],["Captain America: Civil War","2016"],["Doctor Strange","2016","Dr Strange"],
["Guardians of the Galaxy Vol. 2","2017"],["Spider-Man: Homecoming","2017"],["Thor: Ragnarok","2017"],["Black Panther","2018"],
["Avengers: Infinity War","2018"],["Ant-Man and the Wasp","2018"],["Captain Marvel","2019"],["Avengers: Endgame","2019"],
["Spider-Man: Far From Home","2019"],["Black Widow","2021"],["Shang-Chi and the Legend of the Ten Rings","2021","Shang-Chi"],["Eternals","2021"],
["Spider-Man: No Way Home","2021"],["Doctor Strange in the Multiverse of Madness","2022","Multiverse of Madness","Doctor Strange 2"],
["Thor: Love and Thunder","2022"],["Black Panther: Wakanda Forever","2022"],["Ant-Man and the Wasp: Quantumania","2023"],
["Guardians of the Galaxy Vol. 3","2023"],["The Marvels","2023"],["Deadpool & Wolverine","2024"],["Captain America: Brave New World","2025"],
["Thunderbolts*","2025"],["The Fantastic Four: First Steps","2025","Fantastic Four"]]},

/* ---------- TV & Web Series ---------- */
{id:'friends',cat:'TV & Web Series',region:'global',emoji:'☕',title:'six Friends',note:'The main characters of the TV show Friends.',items:[
["Rachel","","Rachel Green"],["Monica","","Monica Geller"],["Phoebe","","Phoebe Buffay"],["Joey","","Joey Tribbiani"],["Chandler","","Chandler Bing"],["Ross","","Ross Geller"]]},
{id:'simpsons',cat:'TV & Web Series',region:'global',emoji:'🍩',title:'Simpsons family',note:'The five members of the family.',items:["Homer","Marge","Bart","Lisa","Maggie"]},
{id:'stranger-things-kids',cat:'TV & Web Series',region:'global',emoji:'🚲',title:'kids of the Stranger Things party',note:'The six main kids.',items:[
["Eleven","","El"],["Mike","","Mike Wheeler"],["Dustin","","Dustin Henderson"],["Lucas","","Lucas Sinclair"],["Will","","Will Byers"],["Max","","Max Mayfield"]]},
{id:'got-houses',cat:'TV & Web Series',region:'global',emoji:'🐺',title:'great houses of Game of Thrones',strip:['house'],items:[
"Stark","Lannister","Targaryen","Baratheon","Greyjoy","Tyrell","Martell","Arryn","Tully"]},
{id:'money-heist',cat:'TV & Web Series',region:'global',emoji:'🎭',title:'Money Heist city code names',note:'Every gang member named after a city.',items:[
"Tokyo","Berlin","Nairobi","Rio","Denver","Moscow","Helsinki","Oslo","Lisbon","Stockholm","Palermo",["Bogotá","","Bogota"],"Marseille","Manila"]},
{id:'tmkoc',cat:'TV & Web Series',region:'india',emoji:'🏢',title:'Gokuldham residents',note:'Characters of Taarak Mehta Ka Ooltah Chashmah.',items:[
["Jethalal","Gada"],["Daya","Gada","Dayaben"],["Tapu","Gada"],["Champaklal","Gada","Bapuji"],["Taarak Mehta","Mehta","Taarak","Tarak Mehta","Tarak"],["Anjali","Mehta"],
["Atmaram Bhide","Bhide","Bhide"],["Madhavi","Bhide"],["Sonu","Bhide"],["Krishnan Iyer","Iyer","Iyer"],["Babita","Iyer","Babita ji"],["Popatlal","Pandey"],
["Dr. Hathi","Hathi","Hathi","Hansraj Hathi"],["Komal","Hathi"],["Goli","Hathi"],["Roshan Singh Sodhi","Sodhi","Sodhi"],["Mrs. Sodhi","Sodhi","Roshan Kaur Sodhi"],["Gogi","Sodhi"],
["Abdul","Shop"],["Bagha","Shop"],["Nattu Kaka","Shop","Natu Kaka"]]},
{id:'mirzapur',cat:'TV & Web Series',region:'india',emoji:'🧶',title:'Mirzapur characters',items:[
["Kaleen Bhaiya","Tripathi","Akhandanand Tripathi","Kaleen"],["Munna Bhaiya","Tripathi","Munna"],["Beena","Tripathi","Beena Tripathi"],["Bauji","Tripathi","Satyanand Tripathi"],
["Guddu","Pandit","Guddu Pandit","Guddu Bhaiya"],["Bablu","Pandit","Bablu Pandit"],["Ramakant Pandit","Pandit","Ramakant"],["Vasudha","Pandit"],["Dimpy","Pandit"],
["Golu","Gupta","Golu Gupta"],["Sweety","Gupta","Sweety Gupta"],["Robin","","Radheshyam"],["Sharad Shukla","Shukla","Sharad"],["Rati Shankar Shukla","Shukla","Rati Shankar"],
["Maqbool",""],["Compounder",""],["Lala",""],["Shabnam",""],["Madhuri Yadav","Yadav","Madhuri"],["JP Yadav","Yadav","J P Yadav"],["Dadda Tyagi","Tyagi","Dadda"]]},
{id:'panchayat',cat:'TV & Web Series',region:'india',emoji:'🎃',title:'Panchayat characters',note:'The people of Phulera.',items:[
["Abhishek","Sachiv ji","Abhishek Tripathi","Sachiv ji","Secretary"],["Pradhan ji","Dubey","Brij Bhushan Dubey","Brij Bhushan"],["Manju Devi","Dubey","Manju"],["Rinki","Dubey"],
["Vikas","",],["Prahlad","Pandey","Prahlad Pandey","Prahlad Cha"],["Binod",""],["Bhushan","Banrakas","Banrakas"],["Kranti Devi","","Kranti"],["MLA Chandrakishore Singh","MLA","Chandrakishore Singh","MLA ji","Vidhayak ji"]]},

/* ---------- Sports ---------- */
{id:'ipl-teams',cat:'Sports',region:'india',emoji:'🏏',title:'IPL teams',note:'The ten teams in the IPL today.',items:[
["Chennai Super Kings","","CSK"],["Mumbai Indians","","MI"],["Royal Challengers Bengaluru","","RCB","Royal Challengers Bangalore"],
["Kolkata Knight Riders","","KKR"],["Sunrisers Hyderabad","","SRH"],["Rajasthan Royals","","RR"],["Delhi Capitals","","DC","Delhi Daredevils"],
["Punjab Kings","","PBKS","Kings XI Punjab"],["Gujarat Titans","","GT"],["Lucknow Super Giants","","LSG"]]},
{id:'test-nations',cat:'Sports',emoji:'🏏',title:'Test cricket nations',note:'All twelve teams with Test status.',items:[
["England","1877"],["Australia","1877"],["South Africa","1889"],["West Indies","1928"],["New Zealand","1930"],["India","1932"],
["Pakistan","1952"],["Sri Lanka","1982"],["Zimbabwe","1992"],["Bangladesh","2000"],["Ireland","2018"],["Afghanistan","2018"]]},
{id:'cricket-wc-winners',cat:'Sports',emoji:'🏆',title:'Cricket World Cup winners',note:'Teams that have won the men’s ODI World Cup.',items:[
"Australia","India","West Indies","Pakistan","Sri Lanka","England"]},
{id:'fifa-wc-winners',cat:'Sports',region:'global',emoji:'⚽',title:'FIFA World Cup winners',note:'Countries that have won the men’s World Cup.',items:[
"Brazil",["Germany","","West Germany"],"Italy","Argentina","France","Uruguay","England","Spain"]},
{id:'grand-slams',cat:'Sports',region:'global',emoji:'🎾',title:'tennis Grand Slams',items:[
["Australian Open","January","Aus Open"],["French Open","May–June","Roland Garros"],["Wimbledon","July"],["US Open","August–September"]]},
{id:'olympic-hosts',cat:'Sports',region:'global',emoji:'🏅',title:'Summer Olympics host cities',note:'Every city that has hosted, 1896 to 2024.',items:[
["Athens","1896 · 2004"],["Paris","1900 · 1924 · 2024"],["St. Louis","1904","Saint Louis"],["London","1908 · 1948 · 2012"],["Stockholm","1912"],
["Antwerp","1920"],["Amsterdam","1928"],["Los Angeles","1932 · 1984","LA"],["Berlin","1936"],["Helsinki","1952"],["Melbourne","1956"],
["Rome","1960"],["Tokyo","1964 · 2020"],["Mexico City","1968"],["Munich","1972"],["Montreal","1976"],["Moscow","1980"],["Seoul","1988"],
["Barcelona","1992"],["Atlanta","1996"],["Sydney","2000"],["Beijing","2008"],["Rio de Janeiro","2016","Rio"]]},

/* ---------- Science & more ---------- */
{id:'planets',cat:'Science & more',emoji:'🪐',title:'planets',note:'In order from the Sun.',items:[
"Mercury","Venus","Earth","Mars","Jupiter","Saturn","Uranus","Neptune"]},
{id:'rainbow',cat:'Science & more',emoji:'🌈',title:'colours of the rainbow',items:[
"Red","Orange","Yellow","Green","Blue","Indigo","Violet"]},
{id:'noble-gases',cat:'Science & more',emoji:'🎈',title:'noble gases',note:'Group 18 of the periodic table.',items:[
["Helium","2"],["Neon","10"],["Argon","18"],["Krypton","36"],["Xenon","54"],["Radon","86"],["Oganesson","118"]]},
{id:'first-20-elements',cat:'Science & more',emoji:'⚗️',title:'first 20 elements',elements:20},
{id:'zodiac',cat:'Science & more',emoji:'♈',title:'zodiac signs',items:[
["Aries","♈"],["Taurus","♉"],["Gemini","♊"],["Cancer","♋"],["Leo","♌"],["Virgo","♍"],["Libra","♎"],["Scorpio","♏","Scorpius"],
["Sagittarius","♐"],["Capricorn","♑","Capricornus"],["Aquarius","♒"],["Pisces","♓"]]}
];
