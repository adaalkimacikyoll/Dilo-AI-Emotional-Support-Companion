export type LanguageCode = "en" | "tr" | "de" | "fr" | "es" | "ar" | "fa";
export type MoodId = "happy" | "sad" | "anxious" | "tired" | "stressed" | "energetic";
type RecCategory = "activity" | "food" | "extra";

export interface Strings {
  tagline: string;
  friendly: string;
  reflective: string;
  friendlyHint: string;
  reflectiveHint: string;
  modeLabel: string;
  getHelp: string;
  openPanel: string;
  close: string;
  newChat: string;
  newChatConfirm: string;
  welcomeTitle: string;
  welcomeBody: string;
  moodPrompt: string;
  moodHint: string;
  moodClear: string;
  recsTitle: string;
  activity: string;
  food: string;
  extra: string;
  preferences: string;
  language: string;
  theme: string;
  themeLight: string;
  themeDark: string;
  themeSystem: string;
  textSize: string;
  small: string;
  medium: string;
  large: string;
  replySound: string;
  inputPlaceholder: string;
  send: string;
  micStart: string;
  micStop: string;
  listening: string;
  micDenied: string;
  you: string;
  typing: string;
  retry: string;
  crisisTitle: string;
  crisisEmergency: string;
  crisisLinesTitle: string;
  crisisFind: string;
  crisisInline: string;
  disclaimer: string;
  errors: Record<"missing_key" | "invalid_key" | "quota" | "network" | "unknown", string>;
  quickSuggestions: string[];
  moods: Record<MoodId, string>;
  recommendations: Record<MoodId, Record<RecCategory, string[]>>;
}

export const TRANSLATIONS: Record<LanguageCode, Strings> = {
  en: {
    tagline: "Emotional support companion",
    friendly: "Friendly",
    reflective: "Reflective",
    friendlyHint: "Casual and warm, like talking to a friend",
    reflectiveHint: "Calmer and more structured, with guided reflection",
    modeLabel: "Conversation style",
    getHelp: "Get help now",
    openPanel: "Mood and settings",
    close: "Close",
    newChat: "New conversation",
    newChatConfirm: "Start a new conversation? Your current messages will be deleted from this device.",
    welcomeTitle: "How are you today?",
    welcomeBody: "Share whatever is on your mind. Dilo listens without judgement and can suggest small things that might help.",
    moodPrompt: "How are you feeling?",
    moodHint: "Optional. Dilo takes your mood into account when it replies.",
    moodClear: "Clear mood",
    recsTitle: "Ideas for when you feel {mood}",
    activity: "Activities",
    food: "Food and drink",
    extra: "Other ideas",
    preferences: "Preferences",
    language: "Language",
    theme: "Theme",
    themeLight: "Light",
    themeDark: "Dark",
    themeSystem: "System",
    textSize: "Text size",
    small: "Small",
    medium: "Medium",
    large: "Large",
    replySound: "Play a sound when Dilo replies",
    inputPlaceholder: "Write a message",
    send: "Send",
    micStart: "Start voice input",
    micStop: "Stop voice input",
    listening: "Listening",
    micDenied: "Microphone access is blocked. Allow it in your browser settings to use voice input.",
    you: "You",
    typing: "Dilo is writing",
    retry: "Try again",
    crisisTitle: "Get help now",
    crisisEmergency: "If you or someone else is in immediate danger, call your local emergency number: 112 in Europe and Türkiye, 911 in the US and Canada.",
    crisisLinesTitle: "Free, confidential crisis lines",
    crisisFind: "Find a helpline in your country",
    crisisInline: "You don't have to go through this alone. Trained people are available right now.",
    disclaimer: "Dilo is an AI and can make mistakes. It is not a substitute for professional care.",
    errors: {
      missing_key: "Dilo isn't connected yet. Add GEMINI_API_KEY to .env.local and restart the app.",
      invalid_key: "The Gemini API key was rejected. Check GEMINI_API_KEY in .env.local.",
      quota: "The Gemini usage limit has been reached. Wait a moment, then try again.",
      network: "No connection to Gemini. Check your internet connection and try again.",
      unknown: "Dilo couldn't reply this time. Try sending your message again.",
    },
    quickSuggestions: ["I'm feeling tired", "I just want to talk", "I want to feel better", "I'm feeling anxious"],
    moods: {
      happy: "Happy",
      sad: "Sad",
      anxious: "Anxious",
      tired: "Tired",
      stressed: "Stressed",
      energetic: "Energetic"
    },
    recommendations: {
      happy: {
        activity: ["Dance to your favorite song", "Go for a light jog", "Take photos of things you love"],
        food: ["Fresh fruit salad", "A colorful smoothie bowl", "Homemade lemonade"],
        extra: ["Write a gratitude list", "Call a friend to share the joy", "Listen to an upbeat playlist"]
      },
      sad: {
        activity: ["Gentle stretching", "A slow walk in nature", "Cozy up with a soft blanket"],
        food: ["Warm soup", "Dark chocolate", "Herbal tea with honey"],
        extra: ["Watch a comforting movie", "Write your feelings in a journal", "Listen to soothing rain sounds"]
      },
      anxious: {
        activity: ["5-minute deep breathing", "Progressive muscle relaxation", "Organize a small drawer"],
        food: ["Chamomile tea", "A handful of almonds", "Warm oatmeal"],
        extra: ["Try a grounding exercise (5-4-3-2-1)", "Listen to a guided meditation", "Doodle or color in a book"]
      },
      tired: {
        activity: ["Take a 20-minute power nap", "Gentle yoga poses", "Splash cold water on your face"],
        food: ["A piece of fresh fruit", "Greek yogurt with nuts", "Plenty of water"],
        extra: ["Listen to lo-fi beats", "Dim the lights and rest your eyes", "Read a few pages of a light book"]
      },
      stressed: {
        activity: ["Squeeze a stress ball", "Do a quick HIIT workout", "Take a long warm shower"],
        food: ["Crunchy vegetables (carrots/celery)", "Green tea", "A banana"],
        extra: ["Practice box breathing", "Listen to a calming podcast", "Declutter your workspace"]
      },
      energetic: {
        activity: ["Go for a long run", "Try a new workout class", "Start a creative project"],
        food: ["A protein-rich snack", "A big fresh salad", "Iced matcha latte"],
        extra: ["Learn a new skill online", "Plan a future trip or event", "Listen to a high-energy podcast"]
      }
    },
  },
  tr: {
    tagline: "Duygusal destek arkadaşı",
    friendly: "Arkadaşça",
    reflective: "Yansıtıcı",
    friendlyHint: "Rahat ve sıcak, bir arkadaşla konuşur gibi",
    reflectiveHint: "Daha sakin ve yapılandırılmış, rehberli düşünme ile",
    modeLabel: "Sohbet tarzı",
    getHelp: "Acil yardım",
    openPanel: "Ruh hali ve ayarlar",
    close: "Kapat",
    newChat: "Yeni sohbet",
    newChatConfirm: "Yeni bir sohbet başlatılsın mı? Mevcut mesajların bu cihazdan silinecek.",
    welcomeTitle: "Bugün nasılsın?",
    welcomeBody: "Aklından geçen her şeyi paylaşabilirsin. Dilo yargılamadan dinler ve iyi gelebilecek küçük şeyler önerebilir.",
    moodPrompt: "Nasıl hissediyorsun?",
    moodHint: "İsteğe bağlı. Dilo cevap verirken ruh halini dikkate alır.",
    moodClear: "Ruh halini temizle",
    recsTitle: "{mood} hissettiğinde deneyebileceklerin",
    activity: "Aktiviteler",
    food: "Yiyecek ve içecek",
    extra: "Diğer fikirler",
    preferences: "Tercihler",
    language: "Dil",
    theme: "Tema",
    themeLight: "Açık",
    themeDark: "Koyu",
    themeSystem: "Sistem",
    textSize: "Yazı boyutu",
    small: "Küçük",
    medium: "Orta",
    large: "Büyük",
    replySound: "Dilo cevap verdiğinde ses çal",
    inputPlaceholder: "Bir mesaj yaz",
    send: "Gönder",
    micStart: "Sesli girişi başlat",
    micStop: "Sesli girişi durdur",
    listening: "Dinleniyor",
    micDenied: "Mikrofon erişimi engellendi. Sesli giriş için tarayıcı ayarlarından izin ver.",
    you: "Sen",
    typing: "Dilo yazıyor",
    retry: "Tekrar dene",
    crisisTitle: "Acil yardım",
    crisisEmergency: "Sen ya da bir başkası şu anda tehlikedeyse yerel acil durum numarasını ara: Türkiye ve Avrupa'da 112, ABD ve Kanada'da 911.",
    crisisLinesTitle: "Ücretsiz ve gizli kriz hatları",
    crisisFind: "Ülkendeki destek hattını bul",
    crisisInline: "Bununla tek başına baş etmek zorunda değilsin. Şu anda seni dinleyebilecek eğitimli insanlar var.",
    disclaimer: "Dilo bir yapay zekadır ve hata yapabilir. Profesyonel desteğin yerini tutmaz.",
    errors: {
      missing_key: "Dilo henüz bağlı değil. .env.local dosyasına GEMINI_API_KEY ekleyip uygulamayı yeniden başlat.",
      invalid_key: "Gemini API anahtarı reddedildi. .env.local içindeki GEMINI_API_KEY değerini kontrol et.",
      quota: "Gemini kullanım sınırına ulaşıldı. Biraz bekleyip tekrar dene.",
      network: "Gemini'ye bağlanılamadı. İnternet bağlantını kontrol edip tekrar dene.",
      unknown: "Dilo bu sefer cevap veremedi. Mesajını tekrar göndermeyi dene.",
    },
    quickSuggestions: ["Kendimi yorgun hissediyorum", "Sadece konuşmak istiyorum", "Daha iyi hissetmek istiyorum", "Kaygılı hissediyorum"],
    moods: {
      happy: "Mutlu",
      sad: "Üzgün",
      anxious: "Endişeli",
      tired: "Yorgun",
      stressed: "Stresli",
      energetic: "Enerjik"
    },
    recommendations: {
      happy: {
        activity: ["En sevdiğin şarkıda dans et", "Hafif bir koşuya çık", "Sevdiğin şeylerin fotoğrafını çek"],
        food: ["Taze meyve salatası", "Renkli bir smoothie kasesi", "Ev yapımı limonata"],
        extra: ["Şükran listesi yaz", "Neşeni paylaşmak için bir arkadaşını ara", "Hareketli bir çalma listesi dinle"]
      },
      sad: {
        activity: ["Nazik esneme hareketleri", "Doğada yavaş bir yürüyüş", "Yumuşak bir battaniyeye sarıl"],
        food: ["Sıcak çorba", "Bitter çikolata", "Ballı bitki çayı"],
        extra: ["Rahatlatıcı bir film izle", "Duygularını bir günlüğe yaz", "Yatıştırıcı yağmur sesleri dinle"]
      },
      anxious: {
        activity: ["5 dakikalık derin nefes", "Kademeli kas gevşetme", "Küçük bir çekmeceyi düzenle"],
        food: ["Papatya çayı", "Bir avuç badem", "Sıcak yulaf ezmesi"],
        extra: ["Topraklama egzersizi dene (5-4-3-2-1)", "Rehberli bir meditasyon dinle", "Bir kitapta karalama yap veya boya"]
      },
      tired: {
        activity: ["20 dakikalık güç uykusu uyu", "Nazik yoga pozları", "Yüzüne soğuk su çarp"],
        food: ["Bir parça taze meyve", "Kuruyemişli süzme yoğurt", "Bol su"],
        extra: ["Lo-fi ritimler dinle", "Işıkları kıs ve gözlerini dinlendir", "Hafif bir kitabın birkaç sayfasını oku"]
      },
      stressed: {
        activity: ["Stres topu sık", "Hızlı bir HIIT antrenmanı yap", "Uzun ve sıcak bir duş al"],
        food: ["Kıtır sebzeler (havuç/kereviz)", "Yeşil çay", "Bir muz"],
        extra: ["Kutu nefesi uygula", "Sakinleştirici bir podcast dinle", "Çalışma alanını toparla"]
      },
      energetic: {
        activity: ["Uzun bir koşuya çık", "Yeni bir antrenman dersi dene", "Yaratıcı bir projeye başla"],
        food: ["Protein açısından zengin bir atıştırmalık", "Büyük taze bir salata", "Buzlu matcha latte"],
        extra: ["Çevrimiçi yeni bir beceri öğren", "Gelecekteki bir gezi veya etkinlik planla", "Yüksek enerjili bir podcast dinle"]
      }
    },
  },
  de: {
    tagline: "Begleiter für emotionale Unterstützung",
    friendly: "Freundschaftlich",
    reflective: "Reflektierend",
    friendlyHint: "Locker und warm, wie ein Gespräch mit einer Freundin",
    reflectiveHint: "Ruhiger und strukturierter, mit angeleiteter Reflexion",
    modeLabel: "Gesprächsstil",
    getHelp: "Sofort Hilfe",
    openPanel: "Stimmung und Einstellungen",
    close: "Schließen",
    newChat: "Neues Gespräch",
    newChatConfirm: "Neues Gespräch beginnen? Deine bisherigen Nachrichten werden von diesem Gerät gelöscht.",
    welcomeTitle: "Wie geht es dir heute?",
    welcomeBody: "Erzähl, was dich beschäftigt. Dilo hört ohne Urteil zu und kann kleine Dinge vorschlagen, die helfen könnten.",
    moodPrompt: "Wie fühlst du dich?",
    moodHint: "Optional. Dilo berücksichtigt deine Stimmung beim Antworten.",
    moodClear: "Stimmung zurücksetzen",
    recsTitle: "Ideen, wenn du dich {mood} fühlst",
    activity: "Aktivitäten",
    food: "Essen und Trinken",
    extra: "Weitere Ideen",
    preferences: "Einstellungen",
    language: "Sprache",
    theme: "Design",
    themeLight: "Hell",
    themeDark: "Dunkel",
    themeSystem: "System",
    textSize: "Textgröße",
    small: "Klein",
    medium: "Mittel",
    large: "Groß",
    replySound: "Ton abspielen, wenn Dilo antwortet",
    inputPlaceholder: "Nachricht schreiben",
    send: "Senden",
    micStart: "Spracheingabe starten",
    micStop: "Spracheingabe beenden",
    listening: "Hört zu",
    micDenied: "Der Mikrofonzugriff ist blockiert. Erlaube ihn in den Browser-Einstellungen, um die Spracheingabe zu nutzen.",
    you: "Du",
    typing: "Dilo schreibt",
    retry: "Erneut versuchen",
    crisisTitle: "Sofort Hilfe",
    crisisEmergency: "Wenn du oder jemand anderes in akuter Gefahr ist, ruf den Notruf an: 112 in Europa und der Türkei, 911 in den USA und Kanada.",
    crisisLinesTitle: "Kostenlose, vertrauliche Krisentelefone",
    crisisFind: "Hilfe-Telefon in deinem Land finden",
    crisisInline: "Du musst das nicht allein durchstehen. Geschulte Menschen sind jetzt für dich erreichbar.",
    disclaimer: "Dilo ist eine KI und kann Fehler machen. Dilo ersetzt keine professionelle Hilfe.",
    errors: {
      missing_key: "Dilo ist noch nicht verbunden. Trage GEMINI_API_KEY in .env.local ein und starte die App neu.",
      invalid_key: "Der Gemini-API-Schlüssel wurde abgelehnt. Prüfe GEMINI_API_KEY in .env.local.",
      quota: "Das Gemini-Nutzungslimit ist erreicht. Warte kurz und versuche es erneut.",
      network: "Keine Verbindung zu Gemini. Prüfe deine Internetverbindung und versuche es erneut.",
      unknown: "Dilo konnte diesmal nicht antworten. Sende deine Nachricht erneut.",
    },
    quickSuggestions: ["Ich bin müde", "Ich möchte einfach reden", "Ich möchte mich besser fühlen", "Ich fühle mich ängstlich"],
    moods: {
      happy: "Glücklich",
      sad: "Traurig",
      anxious: "Ängstlich",
      tired: "Müde",
      stressed: "Gestresst",
      energetic: "Energetisch"
    },
    recommendations: {
      happy: {
        activity: ["Tanze zu deinem Lieblingslied", "Gehe eine Runde joggen", "Fotografiere Dinge, die du liebst"],
        food: ["Frischer Obstsalat", "Eine bunte Smoothie-Bowl", "Hausgemachte Limonade"],
        extra: ["Schreibe eine Dankbarkeitsliste", "Rufe einen Freund an", "Höre eine fröhliche Playlist"]
      },
      sad: {
        activity: ["Sanftes Dehnen", "Ein langsamer Spaziergang", "Kuschel dich in eine Decke"],
        food: ["Warme Suppe", "Dunkle Schokolade", "Kräutertee mit Honig"],
        extra: ["Schaue einen tröstlichen Film", "Schreibe Tagebuch", "Höre beruhigende Regengeräusche"]
      },
      anxious: {
        activity: ["5 Minuten tief atmen", "Progressive Muskelentspannung", "Ordne eine Schublade"],
        food: ["Kamillentee", "Eine Handvoll Mandeln", "Warmer Haferbrei"],
        extra: ["Erdungsübung (5-4-3-2-1)", "Geführte Meditation", "Malen oder Kritzeln"]
      },
      tired: {
        activity: ["20 Minuten Powernap", "Sanfte Yoga-Übungen", "Kaltes Wasser ins Gesicht"],
        food: ["Ein Stück frisches Obst", "Griechischer Joghurt mit Nüssen", "Viel Wasser"],
        extra: ["Lo-Fi-Beats hören", "Licht dimmen und Augen ausruhen", "Ein paar Seiten lesen"]
      },
      stressed: {
        activity: ["Stressball drücken", "Ein kurzes HIIT-Workout", "Lange warm duschen"],
        food: ["Knackiges Gemüse", "Grüner Tee", "Eine Banane"],
        extra: ["Box-Breathing üben", "Beruhigenden Podcast hören", "Arbeitsplatz aufräumen"]
      },
      energetic: {
        activity: ["Langer Dauerlauf", "Neuen Fitnesskurs probieren", "Kreativprojekt starten"],
        food: ["Proteinreicher Snack", "Großer frischer Salat", "Iced Matcha Latte"],
        extra: ["Neue Fähigkeit lernen", "Reise oder Event planen", "Power-Podcast hören"]
      }
    },
  },
  fr: {
    tagline: "Compagnon de soutien émotionnel",
    friendly: "Amical",
    reflective: "Réflexif",
    friendlyHint: "Détendu et chaleureux, comme avec un ami",
    reflectiveHint: "Plus calme et structuré, avec une réflexion guidée",
    modeLabel: "Style de conversation",
    getHelp: "Aide immédiate",
    openPanel: "Humeur et paramètres",
    close: "Fermer",
    newChat: "Nouvelle conversation",
    newChatConfirm: "Commencer une nouvelle conversation ? Vos messages actuels seront supprimés de cet appareil.",
    welcomeTitle: "Comment allez-vous aujourd'hui ?",
    welcomeBody: "Partagez ce qui vous préoccupe. Dilo écoute sans jugement et peut suggérer de petites choses qui pourraient aider.",
    moodPrompt: "Comment vous sentez-vous ?",
    moodHint: "Facultatif. Dilo tient compte de votre humeur dans ses réponses.",
    moodClear: "Effacer l'humeur",
    recsTitle: "Idées quand vous vous sentez {mood}",
    activity: "Activités",
    food: "Boire et manger",
    extra: "Autres idées",
    preferences: "Préférences",
    language: "Langue",
    theme: "Thème",
    themeLight: "Clair",
    themeDark: "Sombre",
    themeSystem: "Système",
    textSize: "Taille du texte",
    small: "Petit",
    medium: "Moyen",
    large: "Grand",
    replySound: "Jouer un son quand Dilo répond",
    inputPlaceholder: "Écrire un message",
    send: "Envoyer",
    micStart: "Démarrer la saisie vocale",
    micStop: "Arrêter la saisie vocale",
    listening: "Écoute",
    micDenied: "L'accès au micro est bloqué. Autorisez-le dans les paramètres du navigateur pour utiliser la saisie vocale.",
    you: "Vous",
    typing: "Dilo écrit",
    retry: "Réessayer",
    crisisTitle: "Aide immédiate",
    crisisEmergency: "Si vous ou quelqu'un d'autre êtes en danger immédiat, appelez le numéro d'urgence : 112 en Europe et en Turquie, 911 aux États-Unis et au Canada.",
    crisisLinesTitle: "Lignes d'écoute gratuites et confidentielles",
    crisisFind: "Trouver une ligne d'écoute dans votre pays",
    crisisInline: "Vous n'avez pas à traverser cela seul. Des personnes formées sont disponibles dès maintenant.",
    disclaimer: "Dilo est une IA et peut se tromper. Dilo ne remplace pas un accompagnement professionnel.",
    errors: {
      missing_key: "Dilo n'est pas encore connecté. Ajoutez GEMINI_API_KEY dans .env.local puis redémarrez l'application.",
      invalid_key: "La clé API Gemini a été refusée. Vérifiez GEMINI_API_KEY dans .env.local.",
      quota: "La limite d'utilisation de Gemini est atteinte. Patientez un instant puis réessayez.",
      network: "Pas de connexion à Gemini. Vérifiez votre connexion Internet et réessayez.",
      unknown: "Dilo n'a pas pu répondre cette fois. Renvoyez votre message.",
    },
    quickSuggestions: ["Je suis fatigué", "J'ai juste envie de parler", "Je veux me sentir mieux", "Je me sens anxieux"],
    moods: {
      happy: "Heureux",
      sad: "Triste",
      anxious: "Anxieux",
      tired: "Fatigué",
      stressed: "Stressé",
      energetic: "Énergique"
    },
    recommendations: {
      happy: {
        activity: ["Dansez sur votre chanson préférée", "Faites un léger jogging", "Prenez des photos de ce que vous aimez"],
        food: ["Salade de fruits frais", "Un bol de smoothie coloré", "Limonade maison"],
        extra: ["Écrivez une liste de gratitude", "Appelez un ami", "Écoutez une playlist entraînante"]
      },
      sad: {
        activity: ["Étirements doux", "Une marche lente dans la nature", "Emmitouflez-vous dans une couverture"],
        food: ["Soupe chaude", "Chocolat noir", "Infusion au miel"],
        extra: ["Regardez un film réconfortant", "Écrivez dans un journal", "Écoutez des sons de pluie"]
      },
      anxious: {
        activity: ["5 minutes de respiration profonde", "Relaxation musculaire", "Ranger un petit tiroir"],
        food: ["Tisane à la camomille", "Une poignée d'amandes", "Flocons d'avoine chauds"],
        extra: ["Exercice d'ancrage (5-4-3-2-1)", "Méditation guidée", "Dessiner ou colorier"]
      },
      tired: {
        activity: ["Faites une sieste de 20 min", "Poses de yoga douces", "Aspergez votre visage d'eau froide"],
        food: ["Un fruit frais", "Yaourt grec aux noix", "Beaucoup d'eau"],
        extra: ["Écoutez des beats lo-fi", "Tamisez les lumières", "Lisez quelques pages"]
      },
      stressed: {
        activity: ["Pressez une balle anti-stress", "Séance de HIIT rapide", "Prenez une longue douche chaude"],
        food: ["Légumes croquants", "Thé vert", "Une banane"],
        extra: ["Pratiquez la respiration carrée", "Écoutez un podcast calme", "Rangez votre bureau"]
      },
      energetic: {
        activity: ["Faites une longue course", "Essayez un nouveau cours", "Lancez un projet créatif"],
        food: ["En-cas riche en protéines", "Grande salade fraîche", "Matcha latte glacé"],
        extra: ["Apprenez une nouvelle compétence", "Planifiez un voyage", "Écoutez un podcast dynamique"]
      }
    },
  },
  es: {
    tagline: "Compañero de apoyo emocional",
    friendly: "Cercano",
    reflective: "Reflexivo",
    friendlyHint: "Relajado y cálido, como hablar con un amigo",
    reflectiveHint: "Más calmado y estructurado, con reflexión guiada",
    modeLabel: "Estilo de conversación",
    getHelp: "Ayuda inmediata",
    openPanel: "Estado de ánimo y ajustes",
    close: "Cerrar",
    newChat: "Nueva conversación",
    newChatConfirm: "¿Empezar una nueva conversación? Tus mensajes actuales se borrarán de este dispositivo.",
    welcomeTitle: "¿Cómo estás hoy?",
    welcomeBody: "Comparte lo que tengas en mente. Dilo escucha sin juzgar y puede sugerir pequeñas cosas que podrían ayudarte.",
    moodPrompt: "¿Cómo te sientes?",
    moodHint: "Opcional. Dilo tiene en cuenta tu estado de ánimo al responder.",
    moodClear: "Quitar estado de ánimo",
    recsTitle: "Ideas para cuando te sientes {mood}",
    activity: "Actividades",
    food: "Comida y bebida",
    extra: "Otras ideas",
    preferences: "Preferencias",
    language: "Idioma",
    theme: "Tema",
    themeLight: "Claro",
    themeDark: "Oscuro",
    themeSystem: "Sistema",
    textSize: "Tamaño del texto",
    small: "Pequeño",
    medium: "Mediano",
    large: "Grande",
    replySound: "Reproducir un sonido cuando Dilo responda",
    inputPlaceholder: "Escribe un mensaje",
    send: "Enviar",
    micStart: "Iniciar entrada de voz",
    micStop: "Detener entrada de voz",
    listening: "Escuchando",
    micDenied: "El acceso al micrófono está bloqueado. Permítelo en los ajustes del navegador para usar la entrada de voz.",
    you: "Tú",
    typing: "Dilo está escribiendo",
    retry: "Reintentar",
    crisisTitle: "Ayuda inmediata",
    crisisEmergency: "Si tú u otra persona estáis en peligro inmediato, llama al número de emergencias: 112 en Europa y Turquía, 911 en EE. UU. y Canadá.",
    crisisLinesTitle: "Líneas de crisis gratuitas y confidenciales",
    crisisFind: "Encuentra una línea de ayuda en tu país",
    crisisInline: "No tienes que pasar por esto solo. Hay personas formadas disponibles ahora mismo.",
    disclaimer: "Dilo es una IA y puede equivocarse. No sustituye la atención profesional.",
    errors: {
      missing_key: "Dilo aún no está conectado. Añade GEMINI_API_KEY en .env.local y reinicia la aplicación.",
      invalid_key: "La clave de la API de Gemini fue rechazada. Revisa GEMINI_API_KEY en .env.local.",
      quota: "Se alcanzó el límite de uso de Gemini. Espera un momento y vuelve a intentarlo.",
      network: "No hay conexión con Gemini. Revisa tu conexión a Internet y vuelve a intentarlo.",
      unknown: "Dilo no pudo responder esta vez. Vuelve a enviar tu mensaje.",
    },
    quickSuggestions: ["Me siento cansado", "Solo quiero hablar", "Quiero sentirme mejor", "Me siento ansioso"],
    moods: {
      happy: "Feliz",
      sad: "Triste",
      anxious: "Ansioso",
      tired: "Cansado",
      stressed: "Estresado",
      energetic: "Enérgico"
    },
    recommendations: {
      happy: {
        activity: ["Baila tu canción favorita", "Sal a correr un poco", "Toma fotos de lo que amas"],
        food: ["Ensalada de frutas frescas", "Un bol de smoothie colorido", "Limonada casera"],
        extra: ["Escribe una lista de gratitud", "Llama a un amigo", "Escucha una playlist alegre"]
      },
      sad: {
        activity: ["Estiramientos suaves", "Un paseo lento por la naturaleza", "Envuélvete en una manta"],
        food: ["Sopa caliente", "Chocolate negro", "Té de hierbas con miel"],
        extra: ["Mira una película reconfortante", "Escribe en un diario", "Escucha sonidos de lluvia"]
      },
      anxious: {
        activity: ["5 minutos de respiración profunda", "Relajación muscular", "Organiza un cajón"],
        food: ["Té de manzanilla", "Un puñado de almendras", "Avena caliente"],
        extra: ["Ejercicio de conexión (5-4-3-2-1)", "Meditación guiada", "Dibujar o colorear"]
      },
      tired: {
        activity: ["Toma una siesta de 20 min", "Yoga suave", "Lávate la cara con agua fría"],
        food: ["Una pieza de fruta fresca", "Yogur griego con nueces", "Mucha agua"],
        extra: ["Escucha beats lo-fi", "Atenúa las luces", "Lee unas páginas"]
      },
      stressed: {
        activity: ["Aprieta una pelota antiestrés", "HIIT rápido", "Toma una ducha caliente"],
        food: ["Verduritas crujientes", "Té verde", "Un plátano"],
        extra: ["Respiración de caja", "Escucha un podcast tranquilo", "Ordena tu espacio"]
      },
      energetic: {
        activity: ["Sal a correr un buen rato", "Prueba una clase nueva", "Empieza un proyecto creativo"],
        food: ["Snack rico en proteínas", "Ensalada grande fresca", "Matcha latte helado"],
        extra: ["Aprende algo nuevo", "Planifica un viaje", "Escucha un podcast de energía"]
      }
    },
  },
  ar: {
    tagline: "رفيق للدعم العاطفي",
    friendly: "ودّي",
    reflective: "تأمّلي",
    friendlyHint: "بسيط ودافئ، كأنك تتحدث مع صديق",
    reflectiveHint: "أهدأ وأكثر تنظيمًا، مع تأمل موجَّه",
    modeLabel: "أسلوب المحادثة",
    getHelp: "مساعدة فورية",
    openPanel: "المزاج والإعدادات",
    close: "إغلاق",
    newChat: "محادثة جديدة",
    newChatConfirm: "هل تريد بدء محادثة جديدة؟ ستُحذف رسائلك الحالية من هذا الجهاز.",
    welcomeTitle: "كيف حالك اليوم؟",
    welcomeBody: "شارك ما يدور في ذهنك. ديلو يستمع دون أحكام ويمكنه اقتراح أشياء صغيرة قد تساعدك.",
    moodPrompt: "كيف تشعر؟",
    moodHint: "اختياري. يأخذ ديلو مزاجك في الاعتبار عند الرد.",
    moodClear: "مسح المزاج",
    recsTitle: "أفكار عندما تشعر بأنك {mood}",
    activity: "أنشطة",
    food: "طعام وشراب",
    extra: "أفكار أخرى",
    preferences: "التفضيلات",
    language: "اللغة",
    theme: "المظهر",
    themeLight: "فاتح",
    themeDark: "داكن",
    themeSystem: "النظام",
    textSize: "حجم النص",
    small: "صغير",
    medium: "متوسط",
    large: "كبير",
    replySound: "تشغيل صوت عند رد ديلو",
    inputPlaceholder: "اكتب رسالة",
    send: "إرسال",
    micStart: "بدء الإدخال الصوتي",
    micStop: "إيقاف الإدخال الصوتي",
    listening: "جارٍ الاستماع",
    micDenied: "الوصول إلى الميكروفون محظور. اسمح به من إعدادات المتصفح لاستخدام الإدخال الصوتي.",
    you: "أنت",
    typing: "ديلو يكتب",
    retry: "إعادة المحاولة",
    crisisTitle: "مساعدة فورية",
    crisisEmergency: "إذا كنت أنت أو شخص آخر في خطر مباشر، اتصل برقم الطوارئ المحلي: 112 في أوروبا وتركيا، و911 في الولايات المتحدة وكندا.",
    crisisLinesTitle: "خطوط أزمات مجانية وسرية",
    crisisFind: "ابحث عن خط مساعدة في بلدك",
    crisisInline: "لست مضطرًا لمواجهة هذا وحدك. هناك أشخاص مدرَّبون متاحون الآن.",
    disclaimer: "ديلو ذكاء اصطناعي وقد يخطئ. لا يُغني عن الرعاية المتخصصة.",
    errors: {
      missing_key: "ديلو غير متصل بعد. أضف GEMINI_API_KEY إلى ملف ‎.env.local ثم أعد تشغيل التطبيق.",
      invalid_key: "تم رفض مفتاح Gemini API. تحقّق من GEMINI_API_KEY في ملف ‎.env.local.",
      quota: "تم بلوغ حد استخدام Gemini. انتظر قليلًا ثم حاول مرة أخرى.",
      network: "لا يوجد اتصال بـ Gemini. تحقّق من اتصالك بالإنترنت وحاول مرة أخرى.",
      unknown: "لم يتمكن ديلو من الرد هذه المرة. أعد إرسال رسالتك.",
    },
    quickSuggestions: ["أشعر بالتعب", "أريد فقط أن أتحدث", "أريد أن أشعر بتحسن", "أشعر بالقلق"],
    moods: {
      happy: "سعيد",
      sad: "حزين",
      anxious: "قلق",
      tired: "متعب",
      stressed: "مجهد",
      energetic: "نشيط"
    },
    recommendations: {
      happy: {
        activity: ["ارقص على أغنيتك المفضلة", "اذهب للجري الخفيف", "التقط صوراً لأشياء تحبها"],
        food: ["سلطة فواكه طازجة", "وعاء سموذي ملون", "ليمونادة منزلية"],
        extra: ["اكتب قائمة امتنان", "اتصل بصديق لمشاركة الفرح", "استمع إلى قائمة أغاني مبهجة"]
      },
      sad: {
        activity: ["تمارين تمدد لطيفة", "مشية بطيئة في الطبيعة", "استرخِ تحت بطانية ناعمة"],
        food: ["حساء دافئ", "شوكولاتة داكنة", "شاي أعشاب بالعسل"],
        extra: ["شاهد فيلماً مريحاً", "اكتب مشاعرك في مذكراتك", "استمع إلى أصوات المطر المهدئة"]
      },
      anxious: {
        activity: ["تنفس عميق لمدة 5 دقائق", "استرخاء العضلات التدريجي", "رتب درجاً صغيراً"],
        food: ["شاي البابونج", "حفنة من اللوز", "دقيق الشوفان الدافئ"],
        extra: ["جرب تمرين التجذير (5-4-3-2-1)", "استمع إلى تأمل موجه", "ارسم أو لون في كتاب"]
      },
      tired: {
        activity: ["خذ قيلولة لمدة 20 دقيقة", "وضعيات يوغا لطيفة", "رش وجهك بالماء البارد"],
        food: ["قطعة فاكهة طازجة", "زبادي يوناني بالمكسرات", "الكثير من الماء"],
        extra: ["استمع إلى موسيقى لو-فاي", "خفت الأضواء وأرح عينيك", "اقرأ بضع صفحات من كتاب خفيف"]
      },
      stressed: {
        activity: ["اضغط على كرة التوتر", "مارس تمارين HIIT سريعة", "خذ حماماً دافئاً طويلاً"],
        food: ["خضروات مقرمشة (جزر/كرفس)", "شاي أخضر", "موزة"],
        extra: ["مارس تنفس المربع", "استمع إلى بودكاست مهدئ", "رتب مكان عملك"]
      },
      energetic: {
        activity: ["اذهب للجري لمسافة طويلة", "جرب حصة تمارين جديدة", "ابدأ مشروعاً إبداعياً"],
        food: ["وجبة خفيفة غنية بالبروتين", "سلطة طازجة كبيرة", "ماتشا لاتيه مثلج"],
        extra: ["تعلم مهارة جديدة عبر الإنترنت", "خطط لرحلة أو فعالية مستقبلية", "استمع إلى بودكاست عالي الطاقة"]
      }
    },
  },
  fa: {
    tagline: "همراهی برای حمایت عاطفی",
    friendly: "دوستانه",
    reflective: "تأملی",
    friendlyHint: "خودمانی و گرم، مثل صحبت با یک دوست",
    reflectiveHint: "آرام‌تر و ساختاریافته‌تر، با تأمل هدایت‌شده",
    modeLabel: "سبک گفتگو",
    getHelp: "کمک فوری",
    openPanel: "حال و تنظیمات",
    close: "بستن",
    newChat: "گفتگوی جدید",
    newChatConfirm: "گفتگوی جدید شروع شود؟ پیام‌های فعلی‌ات از این دستگاه حذف می‌شوند.",
    welcomeTitle: "امروز چطوری؟",
    welcomeBody: "هر چه در ذهنت هست را بگو. دیلو بدون قضاوت گوش می‌دهد و می‌تواند کارهای کوچکی پیشنهاد کند که شاید کمک کنند.",
    moodPrompt: "چه حسی داری؟",
    moodHint: "اختیاری. دیلو هنگام پاسخ دادن حالت را در نظر می‌گیرد.",
    moodClear: "پاک کردن حال",
    recsTitle: "ایده‌هایی برای وقتی که {mood} هستی",
    activity: "فعالیت‌ها",
    food: "خوراکی و نوشیدنی",
    extra: "ایده‌های دیگر",
    preferences: "ترجیحات",
    language: "زبان",
    theme: "پوسته",
    themeLight: "روشن",
    themeDark: "تیره",
    themeSystem: "سیستم",
    textSize: "اندازه متن",
    small: "کوچک",
    medium: "متوسط",
    large: "بزرگ",
    replySound: "پخش صدا هنگام پاسخ دیلو",
    inputPlaceholder: "پیامی بنویس",
    send: "ارسال",
    micStart: "شروع ورودی صوتی",
    micStop: "توقف ورودی صوتی",
    listening: "در حال گوش دادن",
    micDenied: "دسترسی به میکروفون مسدود است. برای استفاده از ورودی صوتی، آن را در تنظیمات مرورگر مجاز کن.",
    you: "تو",
    typing: "دیلو در حال نوشتن است",
    retry: "تلاش دوباره",
    crisisTitle: "کمک فوری",
    crisisEmergency: "اگر تو یا کس دیگری در خطر فوری هستید، با شماره اورژانس محلی تماس بگیر: ۱۱۵ و ۱۱۰ در ایران، ۱۱۲ در اروپا و ترکیه، ۹۱۱ در آمریکا و کانادا.",
    crisisLinesTitle: "خطوط بحران رایگان و محرمانه",
    crisisFind: "خط کمک در کشورت را پیدا کن",
    crisisInline: "لازم نیست این را تنها پشت سر بگذاری. همین حالا افراد آموزش‌دیده در دسترس هستند.",
    disclaimer: "دیلو یک هوش مصنوعی است و ممکن است اشتباه کند. جایگزین کمک تخصصی نیست.",
    errors: {
      missing_key: "دیلو هنوز متصل نیست. GEMINI_API_KEY را به فایل ‎.env.local اضافه کن و برنامه را دوباره اجرا کن.",
      invalid_key: "کلید Gemini API پذیرفته نشد. مقدار GEMINI_API_KEY را در ‎.env.local بررسی کن.",
      quota: "سقف استفاده از Gemini پر شده است. کمی صبر کن و دوباره امتحان کن.",
      network: "اتصال به Gemini برقرار نشد. اینترنتت را بررسی کن و دوباره امتحان کن.",
      unknown: "دیلو این بار نتوانست پاسخ دهد. پیامت را دوباره بفرست.",
    },
    quickSuggestions: ["احساس خستگی می‌کنم", "فقط می‌خواهم حرف بزنم", "می‌خواهم حالم بهتر شود", "احساس اضطراب دارم"],
    moods: {
      happy: "خوشحال",
      sad: "غمگین",
      anxious: "مضطرب",
      tired: "خسته",
      stressed: "پراسترس",
      energetic: "پرانرژی"
    },
    recommendations: {
      happy: {
        activity: ["با آهنگ مورد علاقه‌ات برقص", "کمی پیاده‌روی سریع برو", "از چیزهایی که دوست داری عکس بگیر"],
        food: ["سالاد میوه تازه", "یک کاسه اسموتی رنگارنگ", "شربت آبلیموی خانگی"],
        extra: ["لیست شکرگزاری بنویس", "به یک دوست زنگ بزن و شادی‌ات را تقسیم کن", "به یک لیست پخش شاد گوش بده"]
      },
      sad: {
        activity: ["کشش‌های ملایم انجام بده", "پیاده‌روی آرام در طبیعت", "زیر یک پتوی نرم استراحت کن"],
        food: ["سوپ گرم", "شکلات تلخ", "دمنوش گیاهی با عسل"],
        extra: ["یک فیلم آرامش‌بخش ببین", "احساساتت را در دفترچه بنویس", "به صدای آرام‌بخش باران گوش بده"]
      },
      anxious: {
        activity: ["۵ دقیقه تنفس عمیق", "آرام‌سازی تدریجی عضلات", "یک کشوی کوچک را مرتب کن"],
        food: ["چای بابونه", "یک مشت بادام", "بلغور جو دوسر گرم"],
        extra: ["تمرین زمین‌گیر شدن را امتحان کن (۵-۴-۳-۲-۱)", "به یک مدیتیشن هدایت‌شده گوش بده", "در یک کتاب نقاشی یا رنگ‌آمیزی کن"]
      },
      tired: {
        activity: ["۲۰ دقیقه خواب کوتاه داشته باش", "حرکات ملایم یوگا", "صورتت را با آب سرد بشوی"],
        food: ["یک تکه میوه تازه", "ماست یونانی با مغزیجات", "آب فراوان بنوش"],
        extra: ["به موسیقی لو-فای گوش بده", "نور را کم کن و به چشم‌هایت استراحت بده", "چند صفحه از یک کتاب سبک بخوان"]
      },
      stressed: {
        activity: ["توپ ضد استرس را فشار بده", "یک تمرین ورزشی سریع انجام بده", "یک دوش آب گرم طولانی بگیر"],
        food: ["سبزیجات ترد (هویج/کرفس)", "چای سبز", "یک عدد موز"],
        extra: ["تنفس مربعی را تمرین کن", "به یک پادکست آرام‌بخش گوش بده", "میز کارت را مرتب کن"]
      },
      energetic: {
        activity: ["یک دویدن طولانی برو", "یک کلاس ورزشی جدید را امتحان کن", "یک پروژه خلاقانه شروع کن"],
        food: ["یک میان‌وعده پرپروتئین", "یک سالاد بزرگ و تازه", "ماچا لاته یخ‌زده"],
        extra: ["یک مهارت جدید آنلاین یاد بگیر", "برای یک سفر یا رویداد آینده برنامه‌ریزی کن", "به یک پادکست پرانرژی گوش بده"]
      }
    },
  },
};
