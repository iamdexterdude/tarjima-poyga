/* ======================================================================
   SENTENCE BANK — Navigate Beginner A1, Units 1–4 and lesson 5.1 only.
   Every sentence is present simple: positive, negative or question.

   Vocabulary comes from the coursebook: common verbs (live, work, study,
   play, read, watch, like, teach), transport (bus, train, car, ferry,
   motorbike, walk, cycle), daily activities (get up, have breakfast,
   start/finish work, get home, go out, go to bed), family, jobs, places,
   possessions, clothes and colours, and adverbs of frequency (5.1).

   Each row: [Uzbek sentence, English pattern, tags]
   Pattern syntax:  (a|b|c) = one of these      [a|b] = optional
   The first option is the model answer. Articles never need to be listed:
   the checker ignores a / an / the. Synonyms (store = shop, mum = mother,
   movie = film ...) are also handled by the checker, not here.
   ====================================================================== */

const SIS = "(|older )sister";
const YSIS = "(|younger )sister";
const BRO = "(|older )brother";
const YBRO = "(|younger )brother";
const WEEKEND = "at the weekend";            // also accepts on weekends, at weekends ...
const MORN = "(in the morning|in the mornings)";
const EVE = "(in the evening|in the evenings)";
const T = (rest, time) => `(${rest} ${time}|${time} ${rest})`;
const DAY = d => `(on ${d}s|on ${d}|every ${d})`;
// adverb of frequency: before the main verb; usually/often/sometimes may also start the sentence
const A = (sub, adv, rest) => {
  if (adv === 'always' || adv === 'never') return `${sub} ${adv} ${rest}`;
  const opts = [`${sub} ${adv} ${rest}`, `${adv} ${sub} ${rest}`];
  if (adv === 'sometimes') opts.push(`${sub} ${rest} sometimes`);
  return `(${opts.join('|')})`;
};

const LEVELS = {
  easy: { key: 'easy', name: 'Easy', uz: 'Oson', n: 4,
    blurb: 'Short sentences: live, work, study, play, read, like, wear.' },
  avg: { key: 'avg', name: 'Average', uz: "O'rta", n: 3,
    blurb: 'Daily routine, transport and time words: every day, on Sundays, at seven.' },
  hard: { key: 'hard', name: 'Hard', uz: 'Qiyin', n: 3,
    blurb: 'Always, usually, often, never; and, but, because; where and what time questions.' }
};

const TIPS = {
  pb: 'With I, you, we, they (and plural nouns) the verb keeps its base form: we live, they play.',
  p3: 'With he, she, it (and one person) add -s or -es: she works, he watches, my mother goes.',
  nb: 'Negative with I, you, we, they: subject + don’t + base verb. I don’t drive.',
  n3: 'Negative with he, she, it: subject + doesn’t + base verb. The -s moves to does: she doesn’t work.',
  qb: 'Question with I, you, we, they: Do + subject + base verb? Do you live here?',
  q3: 'Question with he, she, it: Does + subject + base verb? The -s goes on does: Does he work?',
  wh: 'Question word + do/does + subject + base verb: Where does he work? What time do you get up?',
  have: 'have becomes has with he, she, it. You can also say have got / has got: I’ve got a car, she hasn’t got a dog.',
  adv: 'always, usually, often, sometimes, never go before the main verb: she usually walks, I don’t often buy clothes.',
  advbe: 'With am, is, are the frequency word comes after the verb: we are never late.',
  time: 'Time words go at the end (every day, on Sundays, at seven) or at the very start of the sentence.',
  conj: 'and adds information, but gives different information, because gives a reason. Each part needs its own correct verb.'
};

const BANK = {
  easy: {
    p: [
      ["Men Toshkentda yashayman.", "I live in Tashkent", "pb"],
      ["U kasalxonada ishlaydi.", "(He|She) works (in|at) a hospital", "p3"],
      ["Biz universitetda o'qiymiz.", "We study (at|in) university", "pb"],
      ["Ular basketbol o'ynaydi.", "They play basketball", "pb"],
      ["Opam kitob o'qiydi.", `My ${SIS} reads books`, "p3"],
      ["Sen televizor ko'rasan.", "You watch TV", "pb"],
      ["Onam ingliz tilidan dars beradi.", "My mother teaches English", "p3"],
      ["Men kofeni yoqtiraman.", "I like coffee", "pb"],
      ["Akam futbolni yoqtiradi.", `My ${BRO} likes football`, "p3"],
      ["Biz ishga piyoda boramiz.", "We (walk to work|go to work on foot)", "pb"],
      ["U ishga velosipedda boradi.", "(He|She) (cycles to work|goes to work by bicycle|rides a bicycle to work)", "p3"],
      ["Men nonushta qilaman.", "I (have|eat) breakfast", "pb"],
      ["U gitara chaladi.", "(He|She) plays the guitar", "p3"],
      ["Do'stim bankda ishlaydi.", "My friend works (in|at) a bank", "p3"],
      ["Biz kvartirada yashaymiz.", "We live in a flat", "pb"],
      ["Ustozimiz ingliz tilidan dars beradi.", "Our teacher teaches English", "p3"],
      ["Men oq krossovka kiyaman.", "I wear white trainers", "pb"],
      ["U qora shim kiyadi.", "(He|She) wears black trousers", "p3"],
      ["Singlim komikslar o'qiydi.", `My ${YSIS} reads comics`, "p3"],
      ["Ota-onam qishloqda yashaydi.", "My parents live in a village", "pb"],
      ["Bobom gazeta o'qiydi.", "My grandfather reads newspapers", "p3"],
      ["Buvim ovqat pishiradi.", "My grandmother cooks [food|dinner]", "p3"],
      ["Men ofisda ishlayman.", "I work (in|at) an office", "pb"],
      ["Ular mehmonxonada ishlaydi.", "They work (in|at) a hotel", "pb"],
      ["Biz yangiliklarni tinglaymiz.", "We listen to the news", "pb"],
      ["Lola musiqani o'rganadi.", "Lola (studies|learns) music", "p3"],
      ["Ali taksi haydaydi.", "Ali drives a taxi", "p3"],
      ["Men elektron pochtamni tekshiraman.", "I check (my |)emails", "pb"],
      ["U erta turadi.", "(He|She) gets up early", "p3"],
      ["Sen tennis o'ynaysan.", "You play tennis", "pb"],
      ["Akam restoranda ishlaydi.", `My ${BRO} works (in|at) a restaurant`, "p3"],
      ["Biz chet elga boramiz.", "We (go|travel) abroad", "pb"],
      ["U uyda ishlaydi.", "(He|She) works (at|from) home", "p3"],
      ["Men kiyim sotib olaman.", "I buy clothes", "pb"],
      ["Onam kiyim do'konida ishlaydi.", "My mother works (in|at) a clothes shop", "p3"],
      ["Qo'shnimizning iti bor.", "Our neighbour (has|has got) a dog", "have"],
      ["Mening velosipedim bor.", "I (have|have got) a bicycle", "have"],
      ["Ular kino ko'radi.", "They watch films", "pb"],
      ["Biz kechki ovqat pishiramiz.", "We cook dinner", "pb"],
      ["U xayriya tashkilotida ishlaydi.", "(He|She) works for a charity", "p3"],
      ["Menga yangi sumka kerak.", "I need a new bag", "pb"],
      ["Ular universitetda ingliz tilidan dars beradi.", "They teach English (at|in) university", "pb"],
      ["Akam sport kiyimi kiyadi.", `My ${BRO} wears sports clothes`, "p3"],
      ["Men onamga yordam beraman.", "I help my mother", "pb"]
    ],
    n: [
      ["Men kofe ichmayman.", "I do not (drink|have) coffee", "nb"],
      ["U televizor ko'rmaydi.", "(He|She) does not watch TV", "n3"],
      ["Biz shaharda yashamaymiz.", "We do not live in a city", "nb"],
      ["Ular golf o'ynamaydi.", "They do not play golf", "nb"],
      ["Opam gazeta o'qimaydi.", `My ${SIS} does not read newspapers`, "n3"],
      ["Dadam ofisda ishlamaydi.", "My father does not work (in|at) an office", "n3"],
      ["Men mashina haydamayman.", "I do not drive [a car]", "nb"],
      ["Akam kofeni yoqtirmaydi.", `My ${BRO} does not like coffee`, "n3"],
      ["Sen ishga piyoda bormaysan.", "You do not (walk to work|go to work on foot)", "nb"],
      ["Onam qizil kiyim kiymaydi.", "My mother does not wear red clothes", "n3"],
      ["Bobom kompyuterdan foydalanmaydi.", "My grandfather does not use a computer", "n3"],
      ["Ular bankda ishlamaydi.", "They do not work (in|at) a bank", "nb"],
      ["Singlim jinsi shim kiymaydi.", `My ${YSIS} does not wear jeans`, "n3"],
      ["U erta turmaydi.", "(He|She) does not get up early", "n3"],
      ["Men gitara chalmayman.", "I do not play the guitar", "nb"],
      ["Do'stlarim futbol o'ynamaydi.", "My friends do not play football", "nb"],
      ["U ovqat pishirmaydi.", "(He|She) does not cook [food|dinner]", "n3"],
      ["Biz avtobusda bormaymiz.", "We do not go by bus", "nb"],
      ["Mening mashinam yo'q.", "I (do not have|have not got) a car", "have"],
      ["Uning iti yo'q.", "(He|She) (does not have|has not got) a dog", "have"],
      ["Ota-onam kvartirada yashamaydi.", "My parents do not live in a flat", "nb"],
      ["Ustozimiz uyda ishlamaydi.", "Our teacher does not work (at|from) home", "n3"],
      ["Lola komikslar o'qimaydi.", "Lola does not read comics", "n3"],
      ["Ali basketbol o'ynamaydi.", "Ali does not play basketball", "n3"],
      ["Men shlyapa kiymayman.", "I do not wear hats", "nb"],
      ["Ular kiyim sotib olmaydi.", "They do not buy clothes", "nb"],
      ["U yangiliklarni tinglamaydi.", "(He|She) does not listen to the news", "n3"],
      ["Buvim televizor ko'rmaydi.", "My grandmother does not watch TV", "n3"],
      ["Menga yangi telefon kerak emas.", "I do not need a new phone", "nb"],
      ["Akam universitetda o'qimaydi.", `My ${BRO} does not study (at|in) university`, "n3"],
      ["U mehmonxonada ishlamaydi.", "(He|She) does not work (in|at) a hotel", "n3"],
      ["Ular kino ko'rmaydi.", "They do not watch films", "nb"],
      ["Qo'shnimiz Toshkentda ishlamaydi.", "Our neighbour does not work in Tashkent", "n3"],
      ["Men choyni yoqtirmayman.", "I do not like tea", "nb"],
      ["U xayriya tashkilotida ishlamaydi.", "(He|She) does not work for a charity", "n3"],
      ["Dadam ishga velosipedda bormaydi.", "My father does not (cycle to work|go to work by bicycle|ride a bicycle to work)", "n3"],
      ["Sen sport kiyimi kiymaysan.", "You do not wear sports clothes", "nb"],
      ["Onam kitob do'konida ishlamaydi.", "My mother does not work (in|at) a bookshop", "n3"],
      ["Men ingliz tilidan dars bermayman.", "I do not teach English", "nb"],
      ["Biz Samarqandda yashamaymiz.", "We do not live in Samarkand", "nb"]
    ],
    i: [
      ["Sen Toshkentda yashaysanmi?", "Do you live in Tashkent", "qb"],
      ["U kasalxonada ishlaydimi?", "Does (he|she) work (in|at) a hospital", "q3"],
      ["Ular tennis o'ynaydimi?", "Do they play tennis", "qb"],
      ["Opang kitob o'qiydimi?", `Does your ${SIS} read books`, "q3"],
      ["Siz kofeni yoqtirasizmi?", "Do you like coffee", "qb"],
      ["Dadang mashina haydaydimi?", "Does your father drive [a car]", "q3"],
      ["Sen gitara chalasanmi?", "Do you play the guitar", "qb"],
      ["Ular universitetda o'qiydimi?", "Do they study (at|in) university", "qb"],
      ["U erta turadimi?", "Does (he|she) get up early", "q3"],
      ["Siz ofisda ishlaysizmi?", "Do you work (in|at) an office", "qb"],
      ["Akang futbolni yoqtiradimi?", `Does your ${BRO} like football`, "q3"],
      ["Onang ovqat pishiradimi?", "Does your mother cook [food|dinner]", "q3"],
      ["Sizning mashinangiz bormi?", "(Do you have|Have you got) a car", "have"],
      ["Uning iti bormi?", "(Does (he|she) have|Has (he|she) got) a dog", "have"],
      ["Sen jinsi shim kiyasanmi?", "Do you wear jeans", "qb"],
      ["Ustozingiz uyda ishlaydimi?", "Does your teacher work (at|from) home", "q3"],
      ["Do'stlaring basketbol o'ynaydimi?", "Do your friends play basketball", "qb"],
      ["Siz kiyim do'konida ishlaysizmi?", "Do you work (in|at) a clothes shop", "qb"],
      ["Bobong gazeta o'qiydimi?", "Does your grandfather read newspapers", "q3"],
      ["Ular kvartirada yashaydimi?", "Do they live in a flat", "qb"],
      ["Sen ishga piyoda borasanmi?", "Do you (walk to work|go to work on foot)", "qb"],
      ["U yangiliklarni tinglaydimi?", "Does (he|she) listen to the news", "q3"],
      ["Siz komikslar o'qiysizmi?", "Do you read comics", "qb"],
      ["Lola ingliz tilidan dars beradimi?", "Does Lola teach English", "q3"],
      ["Ali bankda ishlaydimi?", "Does Ali work (in|at) a bank", "q3"],
      ["Ota-onang qishloqda yashaydimi?", "Do your parents live in a village", "qb"],
      ["Sizga yangi telefon kerakmi?", "Do you need a new phone", "qb"],
      ["Sen elektron pochtangni tekshirasanmi?", "Do you check (your |)emails", "qb"],
      ["Buving televizor ko'radimi?", "Does your grandmother watch TV", "q3"],
      ["U xayriya tashkilotida ishlaydimi?", "Does (he|she) work for a charity", "q3"],
      ["Siz chet elga borasizmi?", "Do you (go|travel) abroad", "qb"],
      ["Singling krossovka kiyadimi?", `Does your ${YSIS} wear trainers`, "q3"],
      ["Ular mehmonxonada ishlaydimi?", "Do they work (in|at) a hotel", "qb"],
      ["Sen choyni yoqtirasanmi?", "Do you like tea", "qb"],
      ["Qo'shningiz kompyuterdan foydalanadimi?", "Does your neighbour use a computer", "q3"],
      ["Siz kiyim sotib olasizmi?", "Do you buy clothes", "qb"],
      ["Sening velosipeding bormi?", "(Do you have|Have you got) a bicycle", "have"],
      ["Akang restoranda ishlaydimi?", `Does your ${BRO} work (in|at) a restaurant`, "q3"],
      ["Siz onangizga yordam berasizmi?", "Do you help your mother", "qb"],
      ["Ular kino ko'radimi?", "Do they watch films", "qb"]
    ]
  },

  avg: {
    p: [
      ["Men har kuni soat yettida turaman.", T("I get up at seven", "every day"), "time"],
      ["U har ertalab dush qabul qiladi.", T("(He|She) (has|takes) a shower", "every morning"), "time"],
      ["Biz soat sakkizda nonushta qilamiz.", "We (have|eat) breakfast at eight", "time"],
      ["Dadam ishga mashinada boradi.", "My father (drives to work|goes to work by car)", "p3"],
      ["Onam ishni soat to'qqizda boshlaydi.", "My mother starts work at nine", "time"],
      ["Ular ishni soat beshda tugatadi.", "They finish work at five", "time"],
      ["Akam soat oltida uyga keladi.", `My ${BRO} (gets|comes) home at six`, "time"],
      ["Men soat o'n birda uxlashga yotaman.", "I go to (bed|sleep) at eleven", "time"],
      ["Biz dam olish kunlari do'stlarimiz bilan ko'chaga chiqamiz.", T("We go out with our friends", WEEKEND), "time"],
      ["Opam ishga poyezdda boradi.", `My ${SIS} (goes to work by train|takes the train to work)`, "p3"],
      ["U har kuni elektron pochtasini tekshiradi.", T("(He|She) checks (his |her |)emails", "every day"), "time"],
      ["Ular yakshanba kunlari futbol o'ynaydi.", T("They play football", DAY("Sunday")), "time"],
      ["Men kechqurun televizor ko'raman.", T("I watch TV", EVE), "time"],
      ["Bobom ertalab gazeta o'qiydi.", T("My grandfather reads newspapers", MORN), "time"],
      ["Talabalar universitetga avtobusda boradi.", "The students (go to university by bus|take the bus to university)", "pb"],
      ["Singlim maktabga piyoda boradi.", `My ${YSIS} (walks to school|goes to school on foot)`, "p3"],
      ["Ali universitetga mototsiklda boradi.", "Ali goes to university by motorbike", "p3"],
      ["Biz soat birda tushlik qilamiz.", "We (have|eat) lunch at one", "time"],
      ["Onam kechqurun ovqat pishiradi.", T("My mother cooks [dinner|food]", EVE), "time"],
      ["Lola shanba kunlari xarid qilishga boradi.", T("Lola goes shopping", DAY("Saturday")), "time"],
      ["Dadam ishdan keyin yangiliklarni tinglaydi.", T("My father listens to the news", "after work"), "time"],
      ["Men maktabdan keyin kitob o'qiyman.", T("I read books", "after school"), "time"],
      ["Akam dam olish kunlari basketbol o'ynaydi.", T(`My ${BRO} plays basketball`, WEEKEND), "time"],
      ["Ular har kuni ishga taksida boradi.", T("They (go to work by taxi|take a taxi to work)", "every day"), "time"],
      ["Do'stlarim shanba kunlari kinoga boradi.", T("My friends go to the cinema", DAY("Saturday")), "time"],
      ["Biz dam olish kunlari plyajga boramiz.", T("We go to the beach", WEEKEND), "time"],
      ["Ustozimiz ishga avtobusda keladi.", "Our teacher (comes to work by bus|goes to work by bus|takes the bus to work)", "p3"],
      ["Men har kuni soat sakkizda kiyinaman.", T("I get dressed at eight", "every day"), "time"],
      ["Buvim har kuni ertalab choy ichadi.", T("My grandmother (has|drinks) tea", "every morning"), "time"],
      ["Qo'shnilarimiz ishga velosipedda boradi.", "Our neighbours (cycle to work|go to work by bicycle|ride bicycles to work)", "pb"],
      ["U dushanba kunlari ofisda ishlaydi.", T("(He|She) works (in|at) the office", DAY("Monday")), "time"],
      ["Biz kechqurun soat yettida kechki ovqat yeymiz.", "(We (have|eat) dinner at seven [in the evening]|In the evening we (have|eat) dinner at seven)", "time"],
      ["Sen har kuni ingliz tilini o'rganasan.", T("You (study|learn) English", "every day"), "time"],
      ["Opam ishda rasmiy kiyim kiyadi.", `My ${SIS} wears smart clothes at work`, "p3"],
      ["Dadam dam olish kunlari sport kiyimi kiyadi.", T("My father wears sports clothes", WEEKEND), "time"],
      ["Ular juma kunlari ishdan keyin ko'chaga chiqadi.", "(They go out after work on Fridays|On Fridays they go out after work|They go out on Fridays after work)", "time"],
      ["Men soat to'qqizda ishni boshlayman.", "I start work at nine", "time"],
      ["U soat yetti yarimda uyga keladi.", "(He|She) (gets|comes) home at seven thirty", "time"]
    ],
    n: [
      ["Men dam olish kunlari erta turmayman.", T("I do not get up early", WEEKEND), "time"],
      ["U yakshanba kunlari ishlamaydi.", T("(He|She) does not work", DAY("Sunday")), "time"],
      ["Biz ishga avtobusda bormaymiz.", "We do not (go to work by bus|take the bus to work)", "nb"],
      ["Dadam har kuni nonushta qilmaydi.", T("My father does not (have|eat) breakfast", "every day"), "time"],
      ["Onam kechqurun televizor ko'rmaydi.", T("My mother does not watch TV", EVE), "time"],
      ["Ular ishni soat beshda tugatmaydi.", "They do not finish work at five", "time"],
      ["Akam ishga mashinada bormaydi.", `My ${BRO} does not (drive to work|go to work by car)`, "n3"],
      ["Opam soat o'nda uxlashga yotmaydi.", `My ${SIS} does not go to (bed|sleep) at ten`, "time"],
      ["Men ishdan keyin ko'chaga chiqmayman.", T("I do not go out", "after work"), "time"],
      ["Ali har kuni elektron pochtasini tekshirmaydi.", T("Ali does not check (his |)emails", "every day"), "time"],
      ["Lola maktabga piyoda bormaydi.", "Lola does not (walk to school|go to school on foot)", "n3"],
      ["Bolalar shanba kunlari maktabga bormaydi.", T("The children do not go to school", DAY("Saturday")), "time"],
      ["Biz soat birda tushlik qilmaymiz.", "We do not (have|eat) lunch at one", "time"],
      ["Bobom poyezdda bormaydi.", "My grandfather does not (go|travel) by train", "n3"],
      ["Do'stim ertalab kofe ichmaydi.", T("My friend does not (drink|have) coffee", MORN), "time"],
      ["Ular dushanba kunlari ofisda ishlamaydi.", T("They do not work (in|at) the office", DAY("Monday")), "time"],
      ["Sen kechqurun ovqat pishirmaysan.", T("You do not cook [dinner|food]", EVE), "time"],
      ["U har kuni ertalab dush qabul qilmaydi.", T("(He|She) does not (have|take) a shower", "every morning"), "time"],
      ["Ustozimiz ishga taksida kelmaydi.", "Our teacher does not (come to work by taxi|go to work by taxi|take a taxi to work)", "n3"],
      ["Men soat sakkizda uyga kelmayman.", "I do not (get|come) home at eight", "time"],
      ["Qo'shnimiz dam olish kunlari sport kiyimi kiymaydi.", T("Our neighbour does not wear sports clothes", WEEKEND), "time"],
      ["Biz yakshanba kunlari xarid qilishga bormaymiz.", T("We do not go shopping", DAY("Sunday")), "time"],
      ["Ota-onam kechqurun ko'chaga chiqmaydi.", T("My parents do not go out", EVE), "time"],
      ["Akam ishdan keyin yangiliklarni tinglamaydi.", T(`My ${BRO} does not listen to the news`, "after work"), "time"],
      ["U maktabdan keyin kitob o'qimaydi.", T("(He|She) does not read books", "after school"), "time"],
      ["Ular dam olish kunlari plyajga bormaydi.", T("They do not go to the beach", WEEKEND), "time"],
      ["Onam ishni soat sakkizda boshlamaydi.", "My mother does not start work at eight", "time"],
      ["Dadam ishda jinsi shim kiymaydi.", "My father does not wear jeans at work", "n3"],
      ["Talabalar universitetga mototsiklda bormaydi.", "The students do not go to university by motorbike", "nb"],
      ["Buvim tushlikdan keyin choy ichmaydi.", T("My grandmother does not (drink|have) tea", "after lunch"), "time"],
      ["Sen juma kunlari ishlamaysan.", T("You do not work", DAY("Friday")), "time"],
      ["U ishga paromda bormaydi.", "(He|She) does not go to work by ferry", "n3"],
      ["Biz kechqurun soat yettida kechki ovqat yemaymiz.", "(We do not (have|eat) dinner at seven [in the evening]|In the evening we do not (have|eat) dinner at seven)", "time"],
      ["Singlim dushanba kunlari tennis o'ynamaydi.", T(`My ${YSIS} does not play tennis`, DAY("Monday")), "time"],
      ["Men ertalab elektron pochtamni tekshirmayman.", T("I do not check (my |)emails", MORN), "time"]
    ],
    i: [
      ["Sen har kuni erta turasanmi?", "Do you get up early every day", "time"],
      ["U ishga avtobusda boradimi?", "Does (he|she) (go to work by bus|take the bus to work)", "q3"],
      ["Siz soat sakkizda nonushta qilasizmi?", "Do you (have|eat) breakfast at eight", "time"],
      ["Dadang ishga mashinada boradimi?", "Does your father (drive to work|go to work by car)", "q3"],
      ["Onang ishni soat to'qqizda boshlaydimi?", "Does your mother start work at nine", "time"],
      ["Ular dam olish kunlari ishlaydimi?", `Do they work ${WEEKEND}`, "time"],
      ["Akang kechqurun ko'chaga chiqadimi?", `Does your ${BRO} go out ${EVE}`, "time"],
      ["Siz yakshanba kunlari futbol o'ynaysizmi?", `Do you play football ${DAY("Sunday")}`, "time"],
      ["Opang ishga poyezdda boradimi?", `Does your ${SIS} (go to work by train|take the train to work)`, "q3"],
      ["Sen kechqurun televizor ko'rasanmi?", `Do you watch TV ${EVE}`, "time"],
      ["Bolalar maktabga piyoda boradimi?", "Do the children (walk to school|go to school on foot)", "qb"],
      ["U har kuni elektron pochtasini tekshiradimi?", "Does (he|she) check (his |her |)emails every day", "time"],
      ["Siz ishni soat beshda tugatasizmi?", "Do you finish work at five", "time"],
      ["Bobong ertalab gazeta o'qiydimi?", `Does your grandfather read newspapers ${MORN}`, "time"],
      ["Ali universitetga mototsiklda boradimi?", "Does Ali go to university by motorbike", "q3"],
      ["Lola shanba kunlari xarid qilishga boradimi?", `Does Lola go shopping ${DAY("Saturday")}`, "time"],
      ["Sen soat o'n birda uxlashga yotasanmi?", "Do you go to (bed|sleep) at eleven", "time"],
      ["Ota-onang ishdan keyin yangiliklarni tinglaydimi?", "Do your parents listen to the news after work", "time"],
      ["Do'stlaring shanba kunlari kinoga boradimi?", `Do your friends go to the cinema ${DAY("Saturday")}`, "time"],
      ["Siz dam olish kunlari plyajga borasizmi?", `Do you go to the beach ${WEEKEND}`, "time"],
      ["Ustozingiz ishga avtobusda keladimi?", "Does your teacher (come to work by bus|go to work by bus|take the bus to work)", "q3"],
      ["U har kuni ertalab dush qabul qiladimi?", "Does (he|she) (have|take) a shower every morning", "time"],
      ["Siz soat birda tushlik qilasizmi?", "Do you (have|eat) lunch at one", "time"],
      ["Qo'shningiz dushanba kunlari ofisda ishlaydimi?", `Does your neighbour work (in|at) the office ${DAY("Monday")}`, "time"],
      ["Opang ishda rasmiy kiyim kiyadimi?", `Does your ${SIS} wear smart clothes at work`, "q3"],
      ["Sen dam olish kunlari sport kiyimi kiyasanmi?", `Do you wear sports clothes ${WEEKEND}`, "time"],
      ["Ular kechqurun soat yettida kechki ovqat yeydimi?", "Do they (have|eat) dinner at seven [in the evening]", "time"],
      ["Onang kechqurun ovqat pishiradimi?", `Does your mother cook [dinner|food] ${EVE}`, "time"],
      ["Sen soat oltida uyga kelasanmi?", "Do you (get|come) home at six", "time"],
      ["Talabalar universitetga avtobusda boradimi?", "Do the students (go to university by bus|take the bus to university)", "qb"],
      ["Dadang ishdan keyin ko'chaga chiqadimi?", "Does your father go out after work", "time"],
      ["Buving har kuni ertalab choy ichadimi?", "Does your grandmother (drink|have) tea every morning", "time"],
      ["Sen maktabdan keyin kitob o'qiysanmi?", "Do you read books after school", "time"],
      ["Siz har kuni ingliz tilini o'rganasizmi?", "Do you (study|learn) English every day", "time"]
    ]
  },

  hard: {
    p: [
      ["Men har doim nonushta qilaman.", A("I", "always", "(have|eat) breakfast"), "adv"],
      ["U odatda ishga avtobusda boradi.", A("(He|She)", "usually", "(goes to work by bus|takes the bus to work)"), "adv"],
      ["Biz ba'zan kinoga boramiz.", A("We", "sometimes", "go to the cinema"), "adv"],
      ["Akam tez-tez basketbol o'ynaydi.", A(`My ${BRO}`, "often", "plays basketball"), "adv"],
      ["Opam har doim rasmiy kiyim kiyadi, chunki u bankda ishlaydi.", `My ${SIS} always wears smart clothes because she works (in|at) a bank`, "conj"],
      ["Men Toshkentda yashayman, lekin Samarqandda ishlayman.", "I live in Tashkent but (I |)work in Samarkand", "conj"],
      ["Dadam soat oltida turadi va dush qabul qiladi.", "My father gets up at six and (he |)(has|takes) a shower", "conj"],
      ["Lola dam olish kunlari odatda sport kiyimi kiyadi.", T(A("Lola", "usually", "wears sports clothes"), WEEKEND), "adv"],
      ["Ular ba'zan do'stlari bilan ko'chaga chiqadi.", A("They", "sometimes", "go out with their friends"), "adv"],
      ["Opam ko'k jinsi shim va oq futbolka kiyadi.", `My ${SIS} wears blue jeans and a white T-shirt`, "p3"],
      ["Biz har doim shanba kunlari buvimiznikiga boramiz.", T(A("We", "always", "(visit our grandmother|go to our grandmother's house)"), DAY("Saturday")), "adv"],
      ["Lola kiyim do'konida ishlaydi va kiyimlarini o'zi tikadi.", "Lola works (in|at) a clothes shop and (she |)makes her (own |)clothes", "conj"],
      ["Akam odatda soat o'n ikkida uxlashga yotadi.", A(`My ${BRO}`, "usually", "goes to (bed|sleep) at twelve"), "adv"],
      ["Dadam tez-tez chet elga boradi, chunki u jurnalist.", `${A("My father", "often", "(goes|travels) abroad")} because he is a journalist`, "conj"],
      ["Ustozimiz har doim qora kurtka kiyadi.", A("Our teacher", "always", "wears a black jacket"), "adv"],
      ["Men ba'zan onamga yordam beraman.", A("I", "sometimes", "help my mother"), "adv"],
      ["Ali har kuni ertalab elektron pochtasini tekshiradi va yangiliklarni o'qiydi.", T("Ali checks (his |)emails and (he |)reads the news", "every morning"), "conj"],
      ["Singlim xarid qilishni juda yaxshi ko'radi.", `My ${YSIS} (loves shopping|loves going shopping|really likes shopping|likes shopping a lot)`, "p3"],
      ["Ota-onam odatda soat sakkizda kechki ovqat yeydi.", A("My parents", "usually", "(have|eat) dinner at eight"), "adv"],
      ["Buvim tez-tez qo'shnilarimizga qo'ng'iroq qiladi.", A("My grandmother", "often", "(calls|phones) our neighbours"), "adv"],
      ["Do'stim ishni soat to'qqizda boshlaydi va soat beshda tugatadi.", "My friend starts work at nine and (he |she |)finishes [work] at five", "conj"],
      ["U ba'zan oilasi bilan plyajga boradi.", A("(He|She)", "sometimes", "goes to the beach with (his|her) family"), "adv"],
      ["Men ishda har doim telefonimdan foydalanaman.", "(I always use my phone at work|At work I always use my phone)", "adv"],
      ["Men odatda dushanba kunlari ko'k ko'ylak kiyaman.", T(A("I", "usually", "wear a blue shirt"), DAY("Monday")), "adv"],
      ["Bolalar ba'zan maktabdan keyin futbol o'ynaydi.", T(A("The children", "sometimes", "play football"), "after school"), "adv"],
      ["Akam Rossiyada yashaydi va restoranda ishlaydi.", `My ${BRO} lives in Russia and (he |)works (in|at) a restaurant`, "conj"],
      ["Onam odatda soat oltida turadi, lekin dadam soat sakkizda turadi.", `${A("My mother", "usually", "gets up at six")} but my father gets up at eight`, "conj"],
      ["Ular tez-tez Turkiyaga boradi, chunki u yerda do'stlari bor.", `${A("They", "often", "go to Turkey")} because they (have|have got) friends there`, "conj"],
      ["Men har doim kiyimlarimni o'zim sotib olaman.", "I always buy my (own |)clothes", "adv"],
      ["Opam hafta ichida rasmiy kiyim, dam olish kunlari esa sport kiyimi kiyadi.", `My ${SIS} wears smart clothes in the week (and|but) (she wears |)sports clothes at the weekend`, "conj"],
      ["Dadam ko'pincha ishdan keyin futbol ko'radi.", T(A("My father", "often", "watches football"), "after work"), "adv"],
      ["Biz odatda ishga poyezdda boramiz.", A("We", "usually", "(go to work by train|take the train to work)"), "adv"]
    ],
    n: [
      ["U hech qachon kofe ichmaydi.", "(He|She) never (drinks|has) coffee", "adv"],
      ["Men hech qachon ishga taksida bormayman.", "I never (go to work by taxi|take a taxi to work)", "adv"],
      ["Akam kiyimni tez-tez sotib olmaydi.", `My ${BRO} does not often buy clothes`, "adv"],
      ["Opam ishda hech qachon jinsi shim kiymaydi.", `(My ${SIS} never wears jeans at work|At work my ${SIS} never wears jeans)`, "adv"],
      ["Biz dam olish kunlari odatda erta turmaymiz.", T("We do not usually get up early", WEEKEND), "adv"],
      ["Men choyni yoqtiraman, lekin kofeni yoqtirmayman.", "I like tea but (I |)do not like coffee", "conj"],
      ["Dadam mashina haydamaydi, chunki uning mashinasi yo'q.", "My father does not drive because he (does not have|has not got) a car", "conj"],
      ["Onam ishga piyoda boradi, chunki uning mashinasi yo'q.", "My mother (walks to work|goes to work on foot) because she (does not have|has not got) a car", "conj"],
      ["Lola xarid qilishni yoqtirmaydi, lekin ba'zan onasi bilan xaridga boradi.", "Lola does not like shopping but (she |)sometimes goes shopping with her mother", "conj"],
      ["Ular yakshanba kunlari hech qachon ishlamaydi.", T("They never work", DAY("Sunday")), "adv"],
      ["Ustozimiz hech qachon sport kiyimi kiymaydi.", "Our teacher never wears sports clothes", "adv"],
      ["Bobom kompyuterdan foydalanmaydi va uning telefoni yo'q.", "My grandfather does not use a computer and (he |)(does not have|has not got) a phone", "conj"],
      ["Onam ishga piyoda bormaydi, chunki u mashina haydaydi.", "My mother does not (walk to work|go to work on foot) because she drives [a car]", "conj"],
      ["Biz kechqurun televizor ko'rmaymiz, chunki kitob o'qiymiz.", `${T("We do not watch TV", EVE)} because we read books`, "conj"],
      ["U odatda soat o'ndan keyin ishlamaydi.", "(He|She) does not usually work after ten", "adv"],
      ["Men hech qachon qizil shlyapa kiymayman.", "I never wear a red hat", "adv"],
      ["Akam Toshkentda yashamaydi, u Buxoroda yashaydi.", `My ${BRO} does not live in Tashkent (but he|he|but) lives in Bukhara`, "n3"],
      ["Do'stlarim kinoga tez-tez bormaydi.", "My friends do not often go to the cinema", "adv"],
      ["Singlim hech qachon nonushta qilmaydi.", `My ${YSIS} never (has|eats) breakfast`, "adv"],
      ["Ular dam olish kunlari elektron pochtani tekshirmaydi.", T("They do not check (their |)emails", WEEKEND), "time"],
      ["Ali ofisda ishlamaydi, chunki u uyda ishlaydi.", "Ali does not work (in|at) an office because he works (at|from) home", "conj"],
      ["Qo'shnimiz kechasi hech qachon musiqa tinglamaydi.", T("Our neighbour never listens to music", "at night"), "adv"],
      ["Dadam odatda ishdan keyin ko'chaga chiqmaydi.", T("My father does not usually go out", "after work"), "adv"],
      ["Men qimmat kiyim sotib olmayman.", "I do not buy expensive clothes", "nb"],
      ["U qora kiyimni yoqtirmaydi, lekin oq kiyimni yaxshi ko'radi.", "(He|She) does not like black clothes but (he |she |)(loves|really likes|likes) white clothes", "conj"],
      ["Biz hech qachon ishga kech qolmaymiz.", "We (are never late (for|to) work|never (come|arrive) late (to|at|for) work|never get to work late)", "advbe"],
      ["Bolalar hech qachon soat o'ndan keyin uxlashga yotmaydi.", "The children never go to (bed|sleep) after ten", "adv"],
      ["Opam ishda telefonidan foydalanmaydi.", `My ${SIS} does not use her phone at work`, "n3"],
      ["Men ertalab odatda televizor ko'rmayman.", T("I do not usually watch TV", MORN), "adv"],
      ["Ota-onam kechqurun hech qachon ko'chaga chiqmaydi.", T("My parents never go out", EVE), "adv"],
      ["Akam ishga avtobusda bormaydi, chunki u velosipedda boradi.", `My ${BRO} does not (go to work by bus|take the bus to work) because he (cycles|goes by bicycle|rides a bicycle)`, "conj"]
    ],
    i: [
      ["Siz qayerda yashaysiz?", "Where do you live", "wh"],
      ["U qayerda ishlaydi?", "Where does (he|she) work", "wh"],
      ["Soat nechada turasan?", "(What time|When) do you get up", "wh"],
      ["Dadang kim bo'lib ishlaydi?", "(What does your father do|What job does your father do|What is your father's job)", "wh"],
      ["Siz dam olish kunlari nima qilasiz?", "What do you do at the weekend", "wh"],
      ["Opang nima o'qiydi?", `What does your ${SIS} (study|read)`, "wh"],
      ["Ishni soat nechada boshlaysiz?", "(What time|When) do you start work", "wh"],
      ["Akang soat nechada uyga keladi?", `(What time|When) does your ${BRO} (get|come) home`, "wh"],
      ["Ular qachon tushlik qiladi?", "(When|What time) do they (have|eat) lunch", "wh"],
      ["Sen odatda erta turasanmi?", "Do you usually get up early", "adv"],
      ["U tez-tez xarid qilishga boradimi?", "Does (he|she) often go shopping", "adv"],
      ["Onang har doim ishga piyoda boradimi?", "Does your mother always (walk to work|go to work on foot)", "adv"],
      ["Siz ishga qanday borasiz?", "How do you (go|get) to work", "wh"],
      ["Lola qanday kiyimlarni yoqtiradi?", "What clothes does Lola like", "wh"],
      ["Siz ishda nima kiyasiz?", "What do you wear at work", "wh"],
      ["Bolalar maktabdan keyin nima qiladi?", "What do the children do after school", "wh"],
      ["Ustozingiz qayerda yashaydi?", "Where does your teacher live", "wh"],
      ["Sen kechqurun nima ko'rasan?", `What do you watch ${EVE}`, "wh"],
      ["Do'stlaring qayerda o'qiydi?", "Where do your friends study", "wh"],
      ["U nima uchun rasmiy kiyim kiyadi?", "Why does (he|she) wear smart clothes", "wh"],
      ["Siz ba'zan oilangiz bilan kinoga borasizmi?", "Do you sometimes go to the cinema with your family", "adv"],
      ["Ota-onang qayerda yashaydi?", "Where do your parents live", "wh"],
      ["Sen soat nechada uxlashga yotasan?", "(What time|When) do you go to (bed|sleep)", "wh"],
      ["Opang soat nechada ishni tugatadi?", `(What time|When) does your ${SIS} finish work`, "wh"],
      ["Ular dam olish kunlari odatda ishlaydimi?", "Do they usually work at the weekend", "adv"],
      ["Akang tez-tez chet elga boradimi?", `Does your ${BRO} often (go|travel) abroad`, "adv"],
      ["Siz qanday sportni yoqtirasiz?", "(What|Which) sport do you like", "wh"],
      ["U qaysi gazetani o'qiydi?", "(What|Which) newspaper does (he|she) read", "wh"],
      ["Siz elektron pochtangizni qachon tekshirasiz?", "(When|What time) do you check (your |)emails", "wh"],
      ["Sen har doim nonushta qilasanmi?", "Do you always (have|eat) breakfast", "adv"],
      ["Ali qanday musiqani yoqtiradi?", "What music does Ali like", "wh"],
      ["Onang kiyimlarni qayerdan sotib oladi?", "Where does your mother buy (her |)clothes", "wh"],
      ["Dadang ishga nima bilan boradi?", "How does your father (go|get) to work", "wh"],
      ["Do'sting odatda ishga nima kiyadi?", "What does your friend usually wear (to|at|for) work", "wh"]
    ]
  }
};

/* Stable ids from the Uzbek text, so saved history and teacher-accepted answers
   keep pointing at the right sentence when new sentences are added. */
function hashId(s) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return 's' + h.toString(36);
}
const ITEMS = [];
const ITEM_BY_ID = {};
Object.keys(BANK).forEach(level => {
  ['p', 'n', 'i'].forEach(type => {
    BANK[level][type].forEach(row => {
      const it = { id: hashId(row[0]), level, type, uz: row[0], pat: row[1], tags: row[2].split(' ') };
      ITEMS.push(it);
      ITEM_BY_ID[it.id] = it;
    });
  });
});

if (typeof module !== 'undefined') module.exports = { ITEMS, ITEM_BY_ID, LEVELS, TIPS, BANK };
