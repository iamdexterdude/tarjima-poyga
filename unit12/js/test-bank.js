/* ======================================================================
   QUESTION BANK — New Round-Up 1, Unit 1 (a / an) and Unit 2 (plurals).
   Levels:  c = taught in the units (1 point)
            x = challenge, goes a little beyond the book (2 points)
   Types:   mc    choose one answer           (opts[0] is the right one; shuffled on screen)
            fill  type the missing word(s)    q has ___ for the gap
            ord   tap the words in order
            tr    translate Uzbek to English
            fix   rewrite the sentence correctly
            sort  put each word under a or an
   Patterns: (a|b) = one of these      [a|b] = optional
   ====================================================================== */

const CATS = {
  aan:  { name: 'a / an',                       tip: 'Use a before a consonant SOUND (a cat, a university) and an before a vowel SOUND (an egg, an hour). Listen to the first sound, not the first letter.' },
  plus: { name: 'Regular plurals (-s)',         tip: 'Most nouns just add -s: one bird, two birds. Nouns ending in -o that are radio or piano also add only -s.' },
  y:    { name: 'Nouns ending in -y',           tip: 'Consonant + y → -ies (baby → babies). Vowel + y → just add -s (key → keys, boy → boys).' },
  es:   { name: 'Plurals with -es',             tip: 'Nouns ending in -s, -ss, -sh, -ch, -x or -o add -es: bus → buses, dish → dishes, box → boxes, tomato → tomatoes.' },
  ves:  { name: 'Nouns ending in -f / -fe',     tip: 'Take away -f or -fe and add -ves: wolf → wolves, knife → knives, leaf → leaves.' },
  irr:  { name: 'Irregular plurals',            tip: 'Learn these by heart: man → men, woman → women, child → children, person → people, foot → feet, tooth → teeth, mouse → mice, goose → geese, ox → oxen. Sheep, deer and fish do not change.' },
  mix:  { name: 'Sentences and mixed practice', tip: 'Check each noun: does it need a / an (one thing) or a plural ending (many things)? Never use a / an with a plural.' }
};

/* ---------- noun tables ---------- */
// [singular, plural, picture, category, taught(1)/challenge(0), extra tip]
const NOUNS = [
  ['ant','ants','🐜','plus',1],['frog','frogs','🐸','plus',1],['dog','dogs','🐶','plus',1],['snake','snakes','🐍','plus',1],
  ['tiger','tigers','🐯','plus',1],['lion','lions','🦁','plus',1],['zebra','zebras','🦓','plus',1],['elephant','elephants','🐘','plus',1],
  ['cow','cows','🐄','plus',1],['bird','birds','🐦','plus',1],['giraffe','giraffes','🦒','plus',1,'Giraffe ends in -fe, but it is an exception: giraffes (not giraffves).'],
  ['radio','radios','📻','plus',1,'Radio and piano are exceptions: nouns ending in -o usually take -es, but these only take -s.'],
  ['piano','pianos','🎹','plus',1,'Radio and piano are exceptions: nouns ending in -o usually take -es, but these only take -s.'],
  ['apple','apples','🍎','plus',1],['egg','eggs','🥚','plus',1],['cake','cakes','🍰','plus',1],['lemon','lemons','🍋','plus',1],
  ['photo','photos','📷','plus',0,'Photo, piano and radio are short forms or exceptions: only -s.'],
  ['butterfly','butterflies','🦋','y',1],['strawberry','strawberries','🍓','y',1],['cherry','cherries','🍒','y',1],
  ['baby','babies','👶','y',1],['lady','ladies','','y',1],['family','families','👪','y',0],['city','cities','🏙️','y',0],['puppy','puppies','🐕','y',0],
  ['donkey','donkeys','','y',1],['key','keys','🔑','y',1],['boy','boys','👦','y',1],['monkey','monkeys','🐒','y',1],['toy','toys','🧸','y',1],['day','days','','y',0],
  ['bus','buses','🚌','es',1],['glass','glasses','','es',1],['dish','dishes','🍽️','es',1],['torch','torches','🔦','es',1],['box','boxes','📦','es',1],
  ['potato','potatoes','🥔','es',1],['tomato','tomatoes','🍅','es',1],['watch','watches','⌚','es',1],['sandwich','sandwiches','🥪','es',1],
  ['fox','foxes','🦊','es',0],['church','churches','⛪','es',0],['dress','dresses','👗','es',0],['hero','heroes','🦸','es',0],
  ['volcano','volcanoes','🌋','es',0],['quiz','quizzes','','es',0,'Quiz doubles the z: quizzes.'],
  ['wolf','wolves','🐺','ves',1],['leaf','leaves','🍃','ves',1],['knife','knives','🔪','ves',1],['scarf','scarves','🧣','ves',1],
  ['shelf','shelves','','ves',0],['loaf','loaves','🍞','ves',0],['life','lives','','ves',0],
  ['man','men','👨','irr',1],['woman','women','👩','irr',1],['child','children','🧒','irr',1],['person','people','🧑','irr',1],
  ['foot','feet','🦶','irr',1],['tooth','teeth','🦷','irr',1],['mouse','mice','🐭','irr',1],['goose','geese','','irr',1],
  ['ox','oxen','🐂','irr',1],['sheep','sheep','🐑','irr',1],['deer','deer','🦌','irr',1],['fish','fish','🐟','irr',1]
];
const NUMW = ['zero','one','two','three','four','five','six','seven','eight','nine'];

// [word, article, picture, taught, tip]
const AAN = [
  ['cat','a','🐱',1],['dog','a','🐶',1],['elephant','an','🐘',1],['biscuit','a','🍪',1],['pineapple','a','🍍',1],['onion','an','🧅',1],
  ['tomato','a','🍅',1],['egg','an','🥚',1],['lemon','a','🍋',1],['octopus','an','🐙',1],['apple','an','🍎',1],['orange','an','🍊',1],
  ['cake','a','🍰',1],['watermelon','a','🍉',1],['olive','an','🫒',1],['sandwich','a','🥪',1],['monkey','a','🐒',1],['lion','a','🦁',1],
  ['ant','an','🐜',1],['umbrella','an','☂️',1],['owl','an','🦉',1],['zebra','a','🦓',1],['igloo','an','',1],['ostrich','an','',1],
  ['hour','an','⏰',0,'The h in hour is silent, so the word starts with a vowel sound: an hour.'],
  ['honest man','an','',0,'The h in honest is silent: an honest man.'],
  ['university','a','🎓',0,'University starts with the sound "you" /j/, which is a consonant sound: a university.'],
  ['uniform','a','',0,'Uniform starts with the sound "you" /j/, a consonant sound: a uniform.'],
  ['unicorn','a','🦄',0,'Unicorn starts with the sound "you" /j/, a consonant sound: a unicorn.'],
  ['X-ray','an','',0,'The letter X is said "eks", which starts with a vowel sound: an X-ray.'],
  ['MBA','an','',0,'The letter M is said "em", which starts with a vowel sound: an MBA.'],
  ['hotel','a','🏨',0,'The h in hotel is pronounced: a hotel.'],
  ['horse','a','🐴',0,'The h in horse is pronounced: a horse.'],
  ['house','a','🏠',0,'The h in house is pronounced: a house.'],
  ['one-way ticket','a','🎫',0,'One starts with the sound "w", a consonant sound: a one-way ticket.'],
  ['old tiger','an','🐯',0,'The article goes with the NEXT word: old starts with a vowel sound, so an old tiger.'],
  ['big elephant','a','🐘',0,'The article goes with the NEXT word: big starts with a consonant, so a big elephant.'],
  ['orange cat','an','🐱',0,'The article goes with the NEXT word: orange starts with a vowel sound, so an orange cat.'],
  ['green apple','a','🍏',0,'The article goes with the NEXT word: green starts with a consonant, so a green apple.'],
  ['easy test','an','',0,'The article goes with the NEXT word: easy starts with a vowel sound, so an easy test.'],
  ['happy ant','a','🐜',0,'The article goes with the NEXT word: happy starts with a consonant, so a happy ant.']
];

const mc   = (cat, l, q, opts, tip, extra) => Object.assign({ cat, l, t: 'mc', q, opts, tip }, extra);
const fill = (cat, l, q, a, tip, extra) => Object.assign({ cat, l, t: 'fill', q, a, tip }, extra);
const ord  = (cat, l, a, tip) => ({ cat, l, t: 'ord', q: 'Tap the words in the right order.', a, tip });
const tr   = (cat, l, q, a, tip) => ({ cat, l, t: 'tr', q, a, tip });
const fix  = (cat, l, q, a, tip) => ({ cat, l, t: 'fix', q, a, tip });
const sort = (cat, l, items, tip) => ({ cat, l, t: 'sort', q: 'Put each word under a or an.', items, tip });

const RAW = [];

/* ---------- generated: a / an ---------- */
AAN.forEach(([w, art, pic, taught, tip], k) => {
  const other = art === 'a' ? 'an' : 'a';
  const l = taught ? 'c' : 'x';
  const t = tip || (art === 'an' ? `${w} starts with a vowel sound, so we say an ${w}.` : `${w} starts with a consonant sound, so we say a ${w}.`);
  RAW.push(fill('aan', l, 'Write a or an:  ___ ' + w, art, t, { pic }));
  RAW.push(mc('aan', l, 'Which one is correct?', [`${art} ${w}`, `${other} ${w}`, `${art} ${w}s`, `${other} ${w}s`], t, { pic }));
});

/* ---------- generated: plurals ---------- */
function distract(s, p) {
  const out = [];
  const add = x => { if (x !== p && !out.includes(x) && x !== s && out.length < 3) out.push(x); };
  add(s + 's'); add(s + 'es');
  if (/y$/.test(s)) { add(s.slice(0, -1) + 'ies'); add(s + 'ies'); }
  if (/fe?$/.test(s)) { add(s.replace(/fe?$/, 'ves')); add(s.replace(/fe?$/, 'ies')); }
  if (/o$/.test(s)) add(s + 'ies');
  add(s + 'en'); add(s + 'ies'); add(s + 'ves'); add(s.slice(0, -1) + 'ies'); add(s.slice(0, -1) + 'es');
  return out.slice(0, 3);
}
NOUNS.forEach(([s, p, pic, cat, taught, tip], k) => {
  const l = taught ? 'c' : 'x';
  const t = `${s} → ${p}. ` + (tip || CATS[cat].tip);
  const n = 2 + (k % 7);
  if (pic) {
    RAW.push(fill(cat, l, `Count and write:  There ${n === 1 ? 'is' : 'are'} ${NUMW[n]} ___.`, p, t, { pic: Array(n).fill(pic).join(' ') }));
  } else {
    RAW.push(fill(cat, l, `one ${s} → ${NUMW[n]} ___`, p, t));
  }
  RAW.push(mc(cat, l, `What is the plural of "${s}"?`, [p, ...distract(s, p)], t, pic ? { pic } : {}));
});

/* ---------- a / an: rules and traps ---------- */
RAW.push(
  mc('aan', 'c', 'We use "an" before a ___.', ['vowel sound (a, e, i, o, u)', 'consonant sound', 'plural noun', 'name'], 'an + vowel sound: an apple, an egg, an octopus.'),
  mc('aan', 'c', 'We use "a" before a ___.', ['consonant sound', 'vowel sound (a, e, i, o, u)', 'plural noun', 'number'], 'a + consonant sound: a cat, a dog, a lemon.'),
  mc('aan', 'c', 'Which letters are vowels?', ['a, e, i, o, u', 'b, c, d, f, g', 'a, b, c, d, e', 'x, y, z, w, v'], 'The vowel letters are a, e, i, o, u.'),
  mc('aan', 'c', 'Which one is NOT correct?', ['an lemon', 'a lemon', 'an egg', 'a cake'], 'Lemon starts with a consonant sound (l): a lemon.'),
  mc('aan', 'c', 'Which one is NOT correct?', ['a umbrella', 'an umbrella', 'a snake', 'an ant'], 'Umbrella starts with a vowel sound: an umbrella.'),
  mc('aan', 'c', 'Which sentence is correct?', ['I can see an elephant.', 'I can see a elephant.', 'I can see an elephants.', 'I can see elephant an.'], 'elephant starts with a vowel sound: an elephant.'),
  mc('aan', 'c', 'Which sentence is correct?', ['I can see a lion.', 'I can see an lion.', 'I can see a lions.', 'I can see lion a.'], 'lion starts with a consonant sound: a lion.'),
  mc('aan', 'c', 'Which sentence is correct?', ['It is an orange.', 'It is a orange.', 'It is an oranges.', 'It is orange an.'], 'orange starts with a vowel sound: an orange.'),
  mc('aan', 'c', 'We use a / an with ___ nouns.', ['singular (one)', 'plural (two or more)', 'only animal', 'only food'], 'a / an means "one", so we never use it with plurals: a dog, two dogs (not "a dogs").'),
  mc('aan', 'c', 'Which one is wrong?', ['a eggs', 'an egg', 'two eggs', 'one egg'], 'Do not use a / an with plurals: one egg, two eggs.'),
  mc('aan', 'x', 'Which word starts with a vowel LETTER but a consonant SOUND?', ['university', 'umbrella', 'octopus', 'elephant'], 'University starts with the sound "you" /j/, so: a university.'),
  mc('aan', 'x', 'Which word starts with a consonant LETTER but a vowel SOUND?', ['hour', 'house', 'horse', 'hotel'], 'The h in hour is silent, so: an hour.'),
  mc('aan', 'x', 'Which is correct?', ['an hour', 'a hour', 'an house', 'an hotel'], 'hour: silent h → an hour. house and hotel: h is pronounced → a house, a hotel.'),
  mc('aan', 'x', 'Which is correct?', ['a university', 'an university', 'an uniform', 'an unicorn'], 'University, uniform and unicorn start with the sound "you": a university, a uniform, a unicorn.'),
  mc('aan', 'x', 'In "an old tiger", why do we use "an"?', ['Because "old" starts with a vowel sound', 'Because "tiger" starts with a vowel sound', 'Because tiger is big', 'Because it is plural'], 'The article goes with the very next word. Old starts with a vowel sound: an old tiger.'),
  mc('aan', 'x', 'Which is correct?', ['a big elephant', 'an big elephant', 'a elephant big', 'an elephant big'], 'The article goes with the next word: big starts with a consonant, so a big elephant.'),
  mc('aan', 'x', 'Which is correct?', ['an eight-year-old girl', 'a eight-year-old girl', 'an girl', 'a eight-years-old girl'], 'Eight starts with a vowel sound: an eight-year-old girl.'),
  mc('aan', 'x', 'Which is correct?', ['an SMS', 'a SMS', 'an sms message', 'a SMS message'], 'The letter S is said "es", a vowel sound: an SMS.'),
  mc('aan', 'x', 'Which is correct?', ['a UFO', 'an UFO', 'an U.F.O', 'an ufos'], 'UFO is said "you-eff-oh": it starts with the sound "you", so a UFO.'),
  sort('aan', 'c', [['cat','a'],['egg','an'],['lion','a'],['apple','an']], 'a before consonant sounds (cat, lion), an before vowel sounds (egg, apple).'),
  sort('aan', 'c', [['octopus','an'],['monkey','a'],['olive','an'],['zebra','a']], 'octopus and olive start with vowel sounds; monkey and zebra with consonant sounds.'),
  sort('aan', 'c', [['pineapple','a'],['umbrella','an'],['tomato','a'],['onion','an']], 'pineapple and tomato → a; umbrella and onion → an.'),
  sort('aan', 'c', [['elephant','an'],['watermelon','a'],['biscuit','a'],['ant','an']], 'elephant and ant → an; watermelon and biscuit → a.'),
  sort('aan', 'x', [['hour','an'],['hotel','a'],['university','a'],['X-ray','an']], 'Listen to the first SOUND: hour (silent h) → an; hotel → a; university (you-) → a; X-ray (eks) → an.'),
  sort('aan', 'x', [['honest girl','an'],['horse','a'],['unicorn','a'],['MBA','an']], 'honest (silent h) and MBA (em) → an; horse and unicorn (you-) → a.'),
  fix('aan', 'c', 'I can see a elephant.', 'I can see an elephant.', 'elephant starts with a vowel sound: an elephant.'),
  fix('aan', 'c', 'I can see an lion.', 'I can see a lion.', 'lion starts with a consonant sound: a lion.'),
  fix('aan', 'c', 'It is a apple.', 'It is an apple.', 'apple starts with a vowel sound: an apple.'),
  fix('aan', 'c', 'He has a orange and a egg.', 'He has an orange and an egg.', 'orange and egg both start with vowel sounds: an orange, an egg.'),
  fix('aan', 'c', 'This is an cake.', 'This is a cake.', 'cake starts with a consonant sound: a cake.'),
  fix('aan', 'x', 'My father is a engineer in a university.', 'My father is an engineer in a university.', 'engineer starts with a vowel sound (an), university with a "you" sound (a).'),
  fix('aan', 'x', 'We wait for a hour.', 'We wait for an hour.', 'The h in hour is silent: an hour.'),
  fix('aan', 'x', 'She wears an uniform.', 'She wears a uniform.', 'Uniform starts with the sound "you": a uniform.'),
  tr('aan', 'c', "Men sherni ko'raman.", 'I can see a lion.', 'a lion: lion starts with a consonant sound.'),
  tr('aan', 'c', "Men filni ko'raman.", 'I can see an elephant.', 'an elephant: elephant starts with a vowel sound.'),
  tr('aan', 'c', "Men sakkizoyoqni ko'raman.", 'I can see an octopus.', 'an octopus: octopus starts with a vowel sound.'),
  tr('aan', 'c', "Bu olma.", '(It is|It\'s|This is) an apple.', 'an apple: apple starts with a vowel sound.'),
  tr('aan', 'x', "Men bir soat kutaman.", "(I wait|I'm waiting|I am waiting) for an hour.", 'The h in hour is silent: an hour.'),
  ord('aan', 'c', 'I can see an elephant.', 'an elephant: elephant starts with a vowel sound.'),
  ord('aan', 'c', 'I can see a lion.', 'a lion: lion starts with a consonant sound.'),
  ord('aan', 'c', 'It is an octopus.', 'an octopus.')
);

/* ---------- plural rules and traps ---------- */
RAW.push(
  mc('plus', 'c', 'How do we make the plural of most nouns?', ['Add -s', 'Add -es', 'Add -ies', 'Add -ves'], 'Most nouns just add -s: one bird, two birds.'),
  mc('plus', 'c', 'Which one is correct?', ['three dogs', 'three dog', 'three a dogs', 'three an dog'], 'After a number bigger than one the noun is plural: three dogs.'),
  mc('plus', 'c', 'Which one is correct?', ['two pianos', 'two pianoes', 'two pianoss', 'two pianoz'], 'Piano and radio are exceptions: only -s.'),
  mc('plus', 'x', 'How many snakes? "one snake, ___"', ['two snakes', 'two snake', 'twos snakes', 'two snakees'], 'After two, three, four... use the plural.'),
  mc('plus', 'x', 'Which noun takes only -s although it ends in -o?', ['radio', 'tomato', 'potato', 'hero'], 'Radio, piano (and photo) only take -s. Tomato, potato and hero take -es.'),
  mc('plus', 'x', 'Which noun takes only -s although it ends in -fe?', ['giraffe', 'knife', 'wife', 'life'], 'Giraffe is an exception: giraffes. Knife, wife and life become knives, wives, lives.'),
  mc('plus', 'x', 'Which pair is correct?', ['roof → roofs', 'roof → rooves', 'cliff → clives', 'chef → cheves'], 'Not every noun ending in -f changes to -ves: roofs, cliffs, chefs.'),
  mc('y', 'c', 'Consonant + y: baby → babies. What happens to the y?', ['y changes to -ies', 'We add -s', 'We add -es', 'Nothing changes'], 'Consonant + y: take off y and add -ies.'),
  mc('y', 'c', 'Vowel + y: key → keys. What happens?', ['We just add -s', 'y changes to -ies', 'We add -es', 'We add -ves'], 'Vowel + y (ay, ey, oy, uy): just add -s.'),
  mc('y', 'c', 'Which word ends in vowel + y?', ['boy', 'baby', 'cherry', 'butterfly'], 'boy: the letter before y is o (a vowel), so boys.'),
  mc('y', 'c', 'Which word ends in consonant + y?', ['strawberry', 'monkey', 'toy', 'donkey'], 'strawberry: the letter before y is r (a consonant), so strawberries.'),
  mc('y', 'x', 'Which is correct?', ['holidays', 'holidies', 'holidayes', 'holidaies'], 'Vowel + y: only -s.'),
  mc('y', 'x', 'Which is correct?', ['countries', 'countrys', 'countryes', 'countryies'], 'Consonant + y → -ies: country → countries.'),
  mc('es', 'c', 'Which endings take -es in the plural?', ['-s, -ss, -sh, -ch, -x, -o', '-a, -e, -i', '-y after a vowel', '-f and -fe'], 'bus → buses, glass → glasses, dish → dishes, torch → torches, box → boxes, potato → potatoes.'),
  mc('es', 'c', 'Which one is correct?', ['two boxes', 'two boxs', 'two boxies', 'two boxen'], 'Ends in -x: add -es.'),
  mc('es', 'c', 'Which one is correct?', ['three tomatoes', 'three tomatos', 'three tomatoies', 'three tomatoves'], 'tomato ends in -o: add -es.'),
  mc('es', 'x', 'How do we say the plural -es in "buses"?', ['It has an extra syllable (/ɪz/)', 'Like /s/ in "cats"', 'Like /z/ in "dogs"', 'We do not say it'], 'After /s/, /z/, /ʃ/, /tʃ/ the -es is a new syllable: bus-es, dish-es, watch-es.'),
  mc('es', 'x', 'Which plural ends with the sound /s/?', ['cats', 'dogs', 'keys', 'eggs'], 'After p, t, k, f sounds the -s is /s/: cats, books, laptops. After other sounds it is /z/.'),
  mc('es', 'x', 'Which plural ends with the sound /z/?', ['dogs', 'cats', 'books', 'cliffs'], 'After vowels and voiced sounds the -s is /z/: dogs, keys, pens.'),
  mc('ves', 'c', 'Wolf → wolves. What happens to -f?', ['f changes to -ves', 'We add -s', 'We add -es', 'Nothing changes'], '-f / -fe → remove it and add -ves: wolf → wolves, knife → knives.'),
  mc('ves', 'c', 'Which one is correct?', ['two knives', 'two knifes', 'two knifves', 'two knifs'], 'knife → knives.'),
  mc('ves', 'c', 'Which one is correct?', ['four leaves', 'four leafs', 'four leafes', 'four leafves'], 'leaf → leaves.'),
  mc('irr', 'c', 'Which noun does NOT change in the plural?', ['sheep', 'goose', 'tooth', 'child'], 'One sheep, two sheep. Deer and fish also stay the same.'),
  mc('irr', 'c', 'Which noun does NOT change in the plural?', ['deer', 'mouse', 'man', 'woman'], 'One deer, two deer.'),
  mc('irr', 'c', 'Which noun does NOT change in the plural?', ['fish', 'foot', 'ox', 'person'], 'One fish, two fish.'),
  mc('irr', 'c', 'Which one is correct?', ['three men', 'three mans', 'three mens', 'three manes'], 'man → men.'),
  mc('irr', 'c', 'Which one is correct?', ['two feet', 'two foots', 'two feets', 'two footes'], 'foot → feet.'),
  mc('irr', 'c', 'Which one is correct?', ['five children', 'five childs', 'five childrens', 'five childes'], 'child → children (already plural, no more -s).'),
  mc('irr', 'x', 'Which one is correct?', ['The people are happy.', 'The peoples are happy.', 'The people is happy.', 'The persons are happy.'], 'People is already plural: the people are.'),
  mc('irr', 'x', 'Which is the plural of "ox"?', ['oxen', 'oxes', 'ox', 'oxs'], 'ox → oxen is irregular (like child → children).'),
  mc('irr', 'x', 'Which noun is ALWAYS plural?', ['scissors', 'scarf', 'sheep', 'child'], 'Scissors, trousers, jeans and glasses (for your eyes) are always plural: a pair of scissors.'),
  mc('irr', 'x', 'Which is correct?', ['two pairs of trousers', 'two trouser', 'two trousers pair', 'a trousers'], 'Trousers is always plural: a pair of trousers, two pairs of trousers.'),
  mc('irr', 'x', 'Which plural is WRONG?', ['mouses', 'mice', 'geese', 'teeth'], 'mouse → mice (irregular).'),
  mc('mix', 'c', 'Which sentence is correct?', ['I can see two mice.', 'I can see two mouses.', 'I can see a mice.', 'I can see two mouse.'], 'a mouse (one) / two mice (two).'),
  mc('mix', 'c', 'Which sentence is correct?', ['I can see three sheep.', 'I can see three sheeps.', 'I can see three a sheep.', 'I can see three sheepes.'], 'Sheep does not change.'),
  mc('mix', 'c', 'Which sentence is correct?', ['One tomato, two tomatoes.', 'One tomato, two tomatos.', 'One tomatoe, two tomatoes.', 'One tomatoes, two tomato.'], 'tomato → tomatoes.'),
  mc('mix', 'c', 'Which sentence is correct?', ['Six strawberries.', 'Six strawberrys.', 'Six strawberry.', 'Six strawberries are.'], 'strawberry → strawberries.'),
  mc('mix', 'c', 'Which one is correct?', ['an egg and two eggs', 'a egg and two egg', 'an egg and an eggs', 'a egg and two eggses'], 'One thing: an egg. Two things: two eggs.'),
  mc('mix', 'x', 'Which group has ONLY correct plurals?', ['boxes, babies, keys, women', 'boxs, babies, keys, woman', 'boxes, babys, keys, womans', 'boxes, babies, keyes, womens'], 'box → boxes, baby → babies, key → keys, woman → women.'),
  mc('mix', 'x', 'Which group has ONLY correct plurals?', ['knives, wolves, leaves, shelves', 'knifes, wolfs, leafs, shelfs', 'knives, wolfes, leaves, shelves', 'knives, wolves, leafes, shelfes'], '-f / -fe → -ves.'),
  mc('mix', 'x', 'Which sentence is correct?', ['A heroes saves two babies.', 'A hero saves two babies.', 'A hero saves two babys.', 'A heroes saves two baby.'], 'hero (one, with a) / two babies.'),
  fix('plus', 'c', 'I can see two bird.', 'I can see two birds.', 'two → plural: two birds.'),
  fix('plus', 'c', 'There are three zebra.', 'There are three zebras.', 'three → plural: zebras.'),
  fix('plus', 'c', 'Five snake and four frog.', 'Five snakes and four frogs.', 'Both nouns need -s.'),
  fix('y', 'c', 'Two babys and three ladys.', 'Two babies and three ladies.', 'Consonant + y → -ies.'),
  fix('y', 'c', 'Four butterflys.', 'Four butterflies.', 'butterfly → butterflies.'),
  fix('y', 'c', 'Two donkies and three monkies.', 'Two donkeys and three monkeys.', 'Vowel + y: just add -s.'),
  fix('es', 'c', 'Three tomatos and two potatos.', 'Three tomatoes and two potatoes.', 'Nouns ending in -o: add -es.'),
  fix('es', 'c', 'Four bus and two box.', 'Four buses and two boxes.', 'bus → buses, box → boxes.'),
  fix('es', 'c', 'Three dishs and two glasss.', 'Three dishes and two glasses.', 'dish → dishes, glass → glasses.'),
  fix('ves', 'c', 'Two knifes and three wolfs.', 'Two knives and three wolves.', 'knife → knives, wolf → wolves.'),
  fix('irr', 'c', 'Two mans and three womans.', 'Two men and three women.', 'man → men, woman → women.'),
  fix('irr', 'c', 'Four childs and two foots.', 'Four children and two feet.', 'child → children, foot → feet.'),
  fix('irr', 'c', 'Five sheeps and three deers.', 'Five sheep and three deer.', 'Sheep and deer do not change.'),
  fix('irr', 'c', 'Two mouses and three gooses.', 'Two mice and three geese.', 'mouse → mice, goose → geese.'),
  fix('mix', 'x', 'I can see a elephants and three fishes.', 'I can see an elephant and three fish.', 'one elephant needs "an"; fish does not change.'),
  fix('mix', 'x', 'Two persons and four childs.', '(Two people|Two persons) and four children.', 'child → children. (People is the normal plural of person.)'),
  fix('mix', 'x', 'Three hero and two quiz.', 'Three heroes and two quizzes.', 'hero → heroes, quiz → quizzes.'),
  tr('plus', 'c', "Men uchta ilonni ko'raman.", 'I can see three snakes.', 'three → plural: snakes.'),
  tr('y', 'c', "Men beshta qulupnayni ko'raman.", 'I can see five strawberries.', 'strawberry → strawberries.'),
  tr('y', 'c', "Men to'rtta kalitni ko'raman.", 'I can see four keys.', 'vowel + y: keys.'),
  tr('es', 'c', "Men oltita pomidorni ko'raman.", 'I can see six tomatoes.', 'tomato → tomatoes.'),
  tr('es', 'c', "Men ikkita qutini ko'raman.", 'I can see two boxes.', 'box → boxes.'),
  tr('ves', 'c', "Men uchta bo'rini ko'raman.", 'I can see three wolves.', 'wolf → wolves.'),
  tr('ves', 'c', "Men to'rtta pichoqni ko'raman.", 'I can see four knives.', 'knife → knives.'),
  tr('irr', 'c', "Men ikkita sichqonni ko'raman.", 'I can see two mice.', 'mouse → mice.'),
  tr('irr', 'c', "Men uchta qo'yni ko'raman.", 'I can see three sheep.', 'sheep does not change.'),
  tr('irr', 'c', "Men besh bolani ko'raman.", 'I can see five children.', 'child → children.'),
  tr('irr', 'c', "Men to'rtta odamni ko'raman.", 'I can see four (people|persons).', 'person → people.'),
  tr('mix', 'x', "Men bitta fil va ikkita sherni ko'raman.", 'I can see an elephant and two lions.', 'an elephant (one), two lions (plural).'),
  tr('mix', 'x', "Men olti baliqni va bitta ahtapotni ko'raman.", 'I can see six fish and an octopus.', 'fish does not change; an octopus.'),
  ord('plus', 'c', 'I can see five birds.', 'five → plural: birds.'),
  ord('y', 'c', 'I can see three babies.', 'baby → babies.'),
  ord('es', 'c', 'I can see two sandwiches.', 'sandwich → sandwiches.'),
  ord('es', 'c', 'One tomato, two tomatoes.', 'tomato → tomatoes.'),
  ord('ves', 'c', 'I can see four leaves.', 'leaf → leaves.'),
  ord('irr', 'c', 'I can see two mice.', 'mouse → mice.'),
  ord('irr', 'c', 'One fish, two fish.', 'fish does not change.'),
  ord('mix', 'c', 'I can see an octopus and a fish.', 'an octopus, a fish.'),
  ord('mix', 'x', 'Six dishes and nine glasses.', 'dish → dishes, glass → glasses.'),
  ord('mix', 'x', 'Three men and two women.', 'man → men, woman → women.'),
  fill('mix', 'c', 'One fish, two ___.', 'fish', 'fish does not change.'),
  fill('mix', 'c', 'One sheep, three ___.', 'sheep', 'sheep does not change.'),
  fill('irr', 'x', 'The ___ are in the park. (person)', 'people', 'person → people.'),
  fill('irr', 'x', 'I brush my ___ every day. (tooth)', 'teeth', 'tooth → teeth.'),
  fill('mix', 'x', 'I see with my two ___. (eye)', 'eyes', 'eye → eyes.'),
  fill('mix', 'x', 'a pair of ___ (scissors / scissor)', 'scissors', 'Scissors is always plural.')
);

/* ---------- assemble ---------- */
function hashId(s) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return 'q' + h.toString(36);
}
const QS = RAW.map(r => {
  const key = r.cat + r.t + r.q + (r.a || (r.opts && r.opts[0]) || JSON.stringify(r.items));
  return Object.assign({}, r, { id: hashId(key) });
});
const QBY = {};
QS.forEach(q => { QBY[q.id] = q; });

if (typeof module !== 'undefined') module.exports = { QS, QBY, CATS };
