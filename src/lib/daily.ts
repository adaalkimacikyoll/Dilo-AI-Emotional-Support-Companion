import type { LanguageCode } from "./chat-types";

/**
 * Quote and affirmation of the day. Everything is bundled with the app: nothing is fetched or sent.
 * Quotes are limited to well-documented lines from classic, public-domain works, with their source,
 * because quotes found online are very often misattributed. Translations are Dilo's own.
 */

type Localized = Record<LanguageCode, string>;

export interface Quote {
  text: Localized;
  author: Localized;
  source: Localized;
}

const latin = (name: string, el: string, ar: string, fa: string): Localized => ({ en: name, tr: name, de: name, fr: name, es: name, el, ar, fa });

export const QUOTES: Quote[] = [
  {
    author: latin("Seneca", "Σενέκας", "سينيكا", "سنکا"),
    source: { en: "Letters to Lucilius, 13", tr: "Lucilius'a Mektuplar, 13", de: "Briefe an Lucilius, 13", fr: "Lettres à Lucilius, 13", es: "Cartas a Lucilio, 13", el: "Επιστολές προς τον Λουκίλιο, 13", ar: "رسائل إلى لوسيليوس، 13", fa: "نامه‌هایی به لوسیلیوس، ۱۳" },
    text: {
      en: "We suffer more often in imagination than in reality.",
      tr: "Gerçekte olduğundan çok daha sık, hayalimizde acı çekeriz.",
      de: "Wir leiden öfter in der Vorstellung als in der Wirklichkeit.",
      fr: "Nous souffrons plus souvent en imagination que dans la réalité.",
      es: "Sufrimos más a menudo en la imaginación que en la realidad.",
      el: "Υποφέρουμε πιο συχνά με τη φαντασία μας παρά στην πραγματικότητα.",
      ar: "نحن نتألم في الخيال أكثر مما نتألم في الواقع.",
      fa: "ما بیشتر در خیال رنج می‌کشیم تا در واقعیت.",
    },
  },
  {
    author: latin("Epictetus", "Επίκτητος", "إبكتيتوس", "اپیکتتوس"),
    source: { en: "Enchiridion, 5", tr: "Enkheiridion, 5", de: "Handbüchlein der Moral, 5", fr: "Manuel, 5", es: "Enquiridión, 5", el: "Εγχειρίδιον, 5", ar: "المختصر، 5", fa: "انکیریدیون، ۵" },
    text: {
      en: "People are disturbed not by things, but by the views they take of them.",
      tr: "İnsanları rahatsız eden şeylerin kendisi değil, o şeyler hakkındaki düşünceleridir.",
      de: "Nicht die Dinge selbst beunruhigen die Menschen, sondern ihre Meinungen über die Dinge.",
      fr: "Ce qui trouble les hommes, ce ne sont pas les choses, mais les jugements qu'ils portent sur les choses.",
      es: "No nos perturban las cosas, sino las opiniones que tenemos de ellas.",
      el: "Τους ανθρώπους δεν τους ταράζουν τα πράγματα, αλλά οι γνώμες τους για τα πράγματα.",
      ar: "لا تُقلق الناسَ الأشياءُ نفسها، بل آراؤهم فيها.",
      fa: "آنچه آدمی را آشفته می‌کند خود چیزها نیستند، بلکه برداشت او از آن‌هاست.",
    },
  },
  {
    author: latin("Marcus Aurelius", "Μάρκος Αυρήλιος", "ماركوس أوريليوس", "مارکوس اورلیوس"),
    source: { en: "Meditations, 4.3", tr: "Kendime Düşünceler, 4.3", de: "Selbstbetrachtungen, 4.3", fr: "Pensées pour moi-même, 4.3", es: "Meditaciones, 4.3", el: "Τα εις εαυτόν, 4.3", ar: "التأملات، 4.3", fa: "تأملات، ۴.۳" },
    text: {
      en: "The universe is change; our life is what our thoughts make it.",
      tr: "Evren değişimdir; hayatımız, düşüncelerimizin onu yaptığı şeydir.",
      de: "Die Welt ist Wandel, das Leben ist, wozu unsere Gedanken es machen.",
      fr: "L'univers est changement ; notre vie est ce que nos pensées en font.",
      es: "El universo es cambio; nuestra vida es lo que nuestros pensamientos hacen de ella.",
      el: "Ο κόσμος είναι αλλαγή· η ζωή μας είναι ό,τι την κάνουν οι σκέψεις μας.",
      ar: "الكون تغيّر، وحياتنا هي ما تصنعه منها أفكارنا.",
      fa: "جهان دگرگونی است؛ زندگی ما همان است که اندیشه‌هایمان از آن می‌سازند.",
    },
  },
  {
    author: latin("Lao Tzu", "Λάο Τσε", "لاو تسو", "لائوتسه"),
    source: { en: "Tao Te Ching, 64", tr: "Tao Te Ching, 64", de: "Tao Te King, 64", fr: "Tao Te King, 64", es: "Tao Te Ching, 64", el: "Τάο Τε Τσινγκ, 64", ar: "كتاب الطريق والفضيلة، 64", fa: "تائو ته چینگ، ۶۴" },
    text: {
      en: "A journey of a thousand miles begins with a single step.",
      tr: "Bin millik yolculuk tek bir adımla başlar.",
      de: "Eine Reise von tausend Meilen beginnt mit dem ersten Schritt.",
      fr: "Un voyage de mille lieues commence par un premier pas.",
      es: "Un viaje de mil millas comienza con un solo paso.",
      el: "Ένα ταξίδι χιλίων μιλίων αρχίζει με ένα μόνο βήμα.",
      ar: "رحلة الألف ميل تبدأ بخطوة واحدة.",
      fa: "سفر هزار فرسنگی با یک گام آغاز می‌شود.",
    },
  },
  {
    author: latin("Seneca", "Σενέκας", "سينيكا", "سنکا"),
    source: { en: "On the Shortness of Life, 2", tr: "Hayatın Kısalığı Üzerine, 2", de: "Von der Kürze des Lebens, 2", fr: "De la brièveté de la vie, 2", es: "Sobre la brevedad de la vida, 2", el: "Περί της συντομίας της ζωής, 2", ar: "في قِصر الحياة، 2", fa: "در کوتاهی زندگی، ۲" },
    text: {
      en: "Life is long if you know how to use it.",
      tr: "Nasıl kullanacağını bilirsen hayat uzundur.",
      de: "Das Leben ist lang, wenn man es zu nutzen weiß.",
      fr: "La vie est longue si l'on sait en user.",
      es: "La vida es larga si sabes usarla.",
      el: "Η ζωή είναι μεγάλη, αν ξέρεις πώς να τη χρησιμοποιείς.",
      ar: "الحياة طويلة إن عرفت كيف تستعملها.",
      fa: "زندگی بلند است، اگر بدانی چگونه از آن بهره ببری.",
    },
  },
  {
    author: latin("Epictetus", "Επίκτητος", "إبكتيتوس", "اپیکتتوس"),
    source: { en: "Discourses, 3.23", tr: "Söylevler, 3.23", de: "Lehrgespräche, 3.23", fr: "Entretiens, 3.23", es: "Disertaciones, 3.23", el: "Διατριβαί, 3.23", ar: "المحادثات، 3.23", fa: "گفتارها، ۳.۲۳" },
    text: {
      en: "First say to yourself what you would be; then do what you have to do.",
      tr: "Önce kendine ne olmak istediğini söyle; sonra yapman gerekeni yap.",
      de: "Sag dir zuerst, wer du sein willst; dann tu, was du tun musst.",
      fr: "Dis-toi d'abord ce que tu veux être ; puis fais ce que tu dois faire.",
      es: "Primero dite a ti mismo lo que quieres ser; luego haz lo que tengas que hacer.",
      el: "Πες πρώτα στον εαυτό σου τι θέλεις να είσαι· έπειτα κάνε ό,τι πρέπει να κάνεις.",
      ar: "قل لنفسك أولاً ماذا تريد أن تكون، ثم افعل ما عليك فعله.",
      fa: "نخست به خود بگو که می‌خواهی چه باشی؛ سپس آنچه باید انجام دهی را انجام بده.",
    },
  },
  {
    author: latin("Emily Dickinson", "Έμιλι Ντίκινσον", "إميلي ديكنسون", "امیلی دیکنسون"),
    source: { en: "Poem 254 (1891)", tr: "Şiir 254 (1891)", de: "Gedicht 254 (1891)", fr: "Poème 254 (1891)", es: "Poema 254 (1891)", el: "Ποίημα 254 (1891)", ar: "القصيدة 254 (1891)", fa: "شعر ۲۵۴ (۱۸۹۱)" },
    text: {
      en: "Hope is the thing with feathers that perches in the soul.",
      tr: "Umut, ruhumuza konan tüylü bir şeydir.",
      de: "Hoffnung ist das Ding mit Federn, das in der Seele sitzt.",
      fr: "L'espoir est cette chose à plumes qui se perche dans l'âme.",
      es: "La esperanza es esa cosa con plumas que se posa en el alma.",
      el: "Η ελπίδα είναι εκείνο το φτερωτό που κουρνιάζει μέσα στην ψυχή.",
      ar: "الأمل هو ذلك الشيء ذو الريش الذي يحطّ في الروح.",
      fa: "امید آن پرنده‌ای است که بر شاخسار جان می‌نشیند.",
    },
  },
  {
    author: latin("Leo Tolstoy", "Λέων Τολστόι", "ليو تولستوي", "لئو تولستوی"),
    source: { en: "War and Peace", tr: "Savaş ve Barış", de: "Krieg und Frieden", fr: "Guerre et Paix", es: "Guerra y paz", el: "Πόλεμος και Ειρήνη", ar: "الحرب والسلام", fa: "جنگ و صلح" },
    text: {
      en: "The two most powerful warriors are patience and time.",
      tr: "En güçlü iki savaşçı sabır ve zamandır.",
      de: "Die zwei stärksten Krieger sind Geduld und Zeit.",
      fr: "Les deux guerriers les plus puissants sont la patience et le temps.",
      es: "Los dos guerreros más poderosos son la paciencia y el tiempo.",
      el: "Οι δύο πιο δυνατοί πολεμιστές είναι η υπομονή και ο χρόνος.",
      ar: "أقوى محاربَين هما الصبر والوقت.",
      fa: "دو جنگاور نیرومند، صبر و زمان‌اند.",
    },
  },
  {
    author: latin("Helen Keller", "Έλεν Κέλερ", "هيلين كيلر", "هلن کلر"),
    source: { en: "Optimism (1903)", tr: "İyimserlik (1903)", de: "Optimismus (1903)", fr: "L'Optimisme (1903)", es: "Optimismo (1903)", el: "Αισιοδοξία (1903)", ar: "التفاؤل (1903)", fa: "خوش‌بینی (۱۹۰۳)" },
    text: {
      en: "Although the world is full of suffering, it is full also of the overcoming of it.",
      tr: "Dünya acıyla dolu olsa da, o acının üstesinden gelmekle de doludur.",
      de: "Obwohl die Welt voller Leid ist, ist sie auch voll von seiner Überwindung.",
      fr: "Bien que le monde soit plein de souffrance, il est aussi plein de sa victoire sur elle.",
      es: "Aunque el mundo está lleno de sufrimiento, también está lleno de su superación.",
      el: "Αν και ο κόσμος είναι γεμάτος πόνο, είναι γεμάτος και από την υπέρβασή του.",
      ar: "مع أن العالم مليء بالمعاناة، فإنه مليء أيضًا بالتغلب عليها.",
      fa: "هرچند جهان پر از رنج است، پر از چیره شدن بر آن نیز هست.",
    },
  },
  {
    author: latin("Rainer Maria Rilke", "Ράινερ Μαρία Ρίλκε", "راينر ماريا ريلكه", "راینر ماریا ریلکه"),
    source: { en: "Letters to a Young Poet", tr: "Genç Bir Şaire Mektuplar", de: "Briefe an einen jungen Dichter", fr: "Lettres à un jeune poète", es: "Cartas a un joven poeta", el: "Γράμματα σε έναν νέο ποιητή", ar: "رسائل إلى شاعر شاب", fa: "نامه‌هایی به یک شاعر جوان" },
    text: {
      en: "Be patient toward all that is unsolved in your heart and try to love the questions themselves.",
      tr: "Kalbinde çözülmemiş ne varsa ona karşı sabırlı ol ve soruların kendisini sevmeye çalış.",
      de: "Haben Sie Geduld gegen alles Ungelöste in Ihrem Herzen und versuchen Sie, die Fragen selbst liebzuhaben.",
      fr: "Sois patient envers tout ce qui n'est pas résolu dans ton cœur et essaie d'aimer les questions elles-mêmes.",
      es: "Ten paciencia con todo lo que no está resuelto en tu corazón e intenta amar las preguntas mismas.",
      el: "Κάνε υπομονή με ό,τι μένει άλυτο στην καρδιά σου και προσπάθησε να αγαπήσεις τις ίδιες τις ερωτήσεις.",
      ar: "تحلَّ بالصبر تجاه كل ما لم يُحلّ في قلبك، وحاول أن تحب الأسئلة نفسها.",
      fa: "با هرچه در دلت حل‌نشده مانده صبور باش و بکوش خودِ پرسش‌ها را دوست بداری.",
    },
  },
  {
    author: latin("Søren Kierkegaard", "Σέρεν Κίρκεγκωρ", "سورين كيركغارد", "سورن کی‌یرکگور"),
    source: { en: "Journals (1843)", tr: "Günlükler (1843)", de: "Tagebücher (1843)", fr: "Journal (1843)", es: "Diarios (1843)", el: "Ημερολόγια (1843)", ar: "اليوميات (1843)", fa: "یادداشت‌ها (۱۸۴۳)" },
    text: {
      en: "Life can only be understood backwards; but it must be lived forwards.",
      tr: "Hayat ancak geriye bakarak anlaşılır; ama ileriye doğru yaşanmalıdır.",
      de: "Das Leben kann nur rückwärts verstanden, aber muss vorwärts gelebt werden.",
      fr: "La vie ne peut être comprise qu'en regardant en arrière, mais elle doit être vécue en regardant en avant.",
      es: "La vida solo puede entenderse hacia atrás, pero debe vivirse hacia adelante.",
      el: "Η ζωή μπορεί να γίνει κατανοητή μόνο προς τα πίσω· πρέπει όμως να ζηθεί προς τα εμπρός.",
      ar: "لا تُفهم الحياة إلا بالنظر إلى الوراء، لكن لا بد أن تُعاش إلى الأمام.",
      fa: "زندگی را تنها می‌توان رو به عقب فهمید، اما باید رو به جلو زیست.",
    },
  },
  {
    author: latin("Marcus Aurelius", "Μάρκος Αυρήλιος", "ماركوس أوريليوس", "مارکوس اورلیوس"),
    source: { en: "Meditations, 8.47", tr: "Kendime Düşünceler, 8.47", de: "Selbstbetrachtungen, 8.47", fr: "Pensées pour moi-même, 8.47", es: "Meditaciones, 8.47", el: "Τα εις εαυτόν, 8.47", ar: "التأملات، 8.47", fa: "تأملات، ۸.۴۷" },
    text: {
      en: "If you are distressed by anything external, the pain is not due to the thing itself, but to your estimate of it.",
      tr: "Dışarıdaki bir şey seni üzüyorsa, acı o şeyin kendisinden değil, senin onu nasıl değerlendirdiğinden gelir.",
      de: "Wenn dich etwas Äußeres betrübt, so ist es nicht die Sache selbst, die dich quält, sondern dein Urteil darüber.",
      fr: "Si une chose extérieure te chagrine, ce n'est pas elle qui te trouble, mais le jugement que tu portes sur elle.",
      es: "Si algo externo te angustia, el dolor no se debe a la cosa en sí, sino a la idea que tienes de ella.",
      el: "Αν σε στενοχωρεί κάτι εξωτερικό, ο πόνος δεν οφείλεται στο ίδιο το πράγμα, αλλά στην κρίση σου γι' αυτό.",
      ar: "إن أحزنك أمرٌ خارجي، فالألم ليس من الأمر نفسه، بل من حكمك عليه.",
      fa: "اگر چیزی بیرونی آزارت می‌دهد، درد از خود آن چیز نیست، بلکه از داوری تو درباره‌ی آن است.",
    },
  },
];

export const AFFIRMATIONS: Localized[] = [
  {
    en: "I'm allowed to rest. Rest isn't something I have to earn.",
    tr: "Dinlenmeye hakkım var. Dinlenmek hak etmem gereken bir şey değil.",
    de: "Ich darf mich ausruhen. Ruhe muss ich mir nicht verdienen.",
    fr: "J'ai le droit de me reposer. Le repos n'est pas quelque chose que je dois mériter.",
    es: "Tengo derecho a descansar. El descanso no es algo que tenga que ganarme.",
    el: "Επιτρέπεται να ξεκουραστώ. Η ξεκούραση δεν είναι κάτι που πρέπει να κερδίσω.",
    ar: "يحق لي أن أرتاح. الراحة ليست شيئًا عليّ أن أستحقه.",
    fa: "حق دارم استراحت کنم. استراحت چیزی نیست که باید به دستش بیاورم.",
  },
  {
    en: "My feelings make sense, even the difficult ones.",
    tr: "Duygularım anlamlı, zor olanlar bile.",
    de: "Meine Gefühle ergeben Sinn, auch die schwierigen.",
    fr: "Mes émotions ont un sens, même les plus difficiles.",
    es: "Mis emociones tienen sentido, incluso las difíciles.",
    el: "Τα συναισθήματά μου έχουν νόημα, ακόμα και τα δύσκολα.",
    ar: "مشاعري مفهومة، حتى الصعبة منها.",
    fa: "احساساتم معنا دارند، حتی سخت‌ترینشان.",
  },
  {
    en: "I don't have to have everything figured out today.",
    tr: "Bugün her şeyi çözmüş olmak zorunda değilim.",
    de: "Ich muss heute nicht alles herausgefunden haben.",
    fr: "Je n'ai pas besoin d'avoir tout compris aujourd'hui.",
    es: "No tengo que tenerlo todo resuelto hoy.",
    el: "Δεν χρειάζεται να τα έχω λύσει όλα σήμερα.",
    ar: "لست مضطرًا إلى أن أعرف كل شيء اليوم.",
    fa: "لازم نیست امروز همه‌چیز را حل کرده باشم.",
  },
  {
    en: "Small steps still move me forward.",
    tr: "Küçük adımlar da beni ileri taşır.",
    de: "Auch kleine Schritte bringen mich voran.",
    fr: "Les petits pas me font avancer, eux aussi.",
    es: "Los pasos pequeños también me hacen avanzar.",
    el: "Και τα μικρά βήματα με πηγαίνουν μπροστά.",
    ar: "الخطوات الصغيرة تدفعني إلى الأمام أيضًا.",
    fa: "گام‌های کوچک هم مرا به جلو می‌برند.",
  },
  {
    en: "I can be as kind to myself as I am to a friend.",
    tr: "Kendime de bir arkadaşıma davrandığım kadar nazik davranabilirim.",
    de: "Ich darf so freundlich zu mir sein wie zu einem Freund.",
    fr: "Je peux être aussi bienveillant envers moi qu'envers un ami.",
    es: "Puedo ser tan amable conmigo como lo soy con un amigo.",
    el: "Μπορώ να είμαι τόσο καλός/ή με τον εαυτό μου όσο με έναν φίλο.",
    ar: "أستطيع أن أكون لطيفًا مع نفسي كما أكون مع صديق.",
    fa: "می‌توانم با خودم همان‌قدر مهربان باشم که با یک دوست.",
  },
  {
    en: "It's okay to ask for help.",
    tr: "Yardım istemek sorun değil.",
    de: "Es ist in Ordnung, um Hilfe zu bitten.",
    fr: "C'est normal de demander de l'aide.",
    es: "Está bien pedir ayuda.",
    el: "Είναι εντάξει να ζητάω βοήθεια.",
    ar: "لا بأس في أن أطلب المساعدة.",
    fa: "کمک خواستن اشکالی ندارد.",
  },
  {
    en: "I am more than my hardest day.",
    tr: "Ben en zor günümden çok daha fazlasıyım.",
    de: "Ich bin mehr als mein schwerster Tag.",
    fr: "Je suis plus que ma journée la plus difficile.",
    es: "Soy más que mi día más difícil.",
    el: "Είμαι κάτι περισσότερο από την πιο δύσκολη μέρα μου.",
    ar: "أنا أكثر من أصعب أيامي.",
    fa: "من بیشتر از سخت‌ترین روزم هستم.",
  },
  {
    en: "I can take this one moment at a time.",
    tr: "Bunu an an yaşayabilirim.",
    de: "Ich kann das Schritt für Schritt nehmen, Moment für Moment.",
    fr: "Je peux vivre cela un instant après l'autre.",
    es: "Puedo vivir esto momento a momento.",
    el: "Μπορώ να το πάρω μία στιγμή τη φορά.",
    ar: "أستطيع أن أعيش هذا لحظة بلحظة.",
    fa: "می‌توانم این را لحظه به لحظه پیش ببرم.",
  },
  {
    en: "I deserve care, too.",
    tr: "Ben de ilgiyi ve şefkati hak ediyorum.",
    de: "Auch ich verdiene Fürsorge.",
    fr: "Moi aussi, je mérite qu'on prenne soin de moi.",
    es: "Yo también merezco cuidado.",
    el: "Κι εγώ αξίζω φροντίδα.",
    ar: "أنا أيضًا أستحق الرعاية.",
    fa: "من هم شایسته‌ی مراقبت هستم.",
  },
  {
    en: "Progress isn't always visible, and it still counts.",
    tr: "İlerleme her zaman görünmez, ama yine de sayılır.",
    de: "Fortschritt ist nicht immer sichtbar, und er zählt trotzdem.",
    fr: "Le progrès n'est pas toujours visible, et il compte quand même.",
    es: "El progreso no siempre se ve, y aun así cuenta.",
    el: "Η πρόοδος δεν φαίνεται πάντα, κι όμως μετράει.",
    ar: "التقدم لا يكون مرئيًا دائمًا، لكنه يُحسب.",
    fa: "پیشرفت همیشه دیده نمی‌شود، اما باز هم به حساب می‌آید.",
  },
  {
    en: "I can say no without feeling guilty.",
    tr: "Suçluluk duymadan hayır diyebilirim.",
    de: "Ich darf Nein sagen, ohne mich schuldig zu fühlen.",
    fr: "Je peux dire non sans me sentir coupable.",
    es: "Puedo decir que no sin sentirme culpable.",
    el: "Μπορώ να πω όχι χωρίς να νιώθω ενοχές.",
    ar: "أستطيع أن أقول لا دون أن أشعر بالذنب.",
    fa: "می‌توانم بدون احساس گناه نه بگویم.",
  },
  {
    en: "Today I'll notice one good thing, however small.",
    tr: "Bugün ne kadar küçük olursa olsun iyi bir şeyi fark edeceğim.",
    de: "Heute achte ich auf eine gute Sache, so klein sie auch ist.",
    fr: "Aujourd'hui, je remarquerai une bonne chose, aussi petite soit-elle.",
    es: "Hoy me fijaré en algo bueno, por pequeño que sea.",
    el: "Σήμερα θα προσέξω ένα καλό πράγμα, όσο μικρό κι αν είναι.",
    ar: "اليوم سألاحظ شيئًا جميلًا واحدًا، مهما كان صغيرًا.",
    fa: "امروز به یک چیز خوب توجه می‌کنم، هرچقدر هم کوچک باشد.",
  },
  {
    en: "I've made it through hard days before.",
    tr: "Daha önce de zor günleri atlattım.",
    de: "Ich habe schon früher schwere Tage überstanden.",
    fr: "J'ai déjà traversé des jours difficiles.",
    es: "Ya he superado días difíciles antes.",
    el: "Έχω ξεπεράσει δύσκολες μέρες και στο παρελθόν.",
    ar: "لقد تجاوزت أيامًا صعبة من قبل.",
    fa: "پیش از این هم روزهای سخت را پشت سر گذاشته‌ام.",
  },
  {
    en: "Being gentle with myself is a strength.",
    tr: "Kendime yumuşak davranmak bir güçtür.",
    de: "Sanft mit mir zu sein ist eine Stärke.",
    fr: "Être doux avec moi-même est une force.",
    es: "Ser amable conmigo es una fortaleza.",
    el: "Το να είμαι τρυφερός/ή με τον εαυτό μου είναι δύναμη.",
    ar: "أن أكون رفيقًا بنفسي قوة.",
    fa: "مهربان بودن با خودم نوعی قدرت است.",
  },
  {
    en: "I don't have to carry everything alone.",
    tr: "Her şeyi tek başıma taşımak zorunda değilim.",
    de: "Ich muss nicht alles allein tragen.",
    fr: "Je n'ai pas à tout porter seul.",
    es: "No tengo que cargar con todo yo solo.",
    el: "Δεν χρειάζεται να τα κουβαλάω όλα μόνος/η.",
    ar: "لست مضطرًا إلى حمل كل شيء وحدي.",
    fa: "لازم نیست همه‌چیز را به‌تنهایی به دوش بکشم.",
  },
];

/** Days since 1 Jan 1970 in the user's own time zone, so "today" changes at their midnight. */
export function localDayNumber(date = new Date()) {
  return Math.floor((date.getTime() - date.getTimezoneOffset() * 60_000) / 86_400_000);
}

/** Today's quote and affirmation. The lists have different lengths, so pairs don't repeat in a short cycle. */
export function dailyPicks(date = new Date()) {
  const day = localDayNumber(date);
  return { quote: QUOTES[day % QUOTES.length], affirmation: AFFIRMATIONS[(day * 7) % AFFIRMATIONS.length] };
}
