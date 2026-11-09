import type { LanguageCode } from "./chat-types";

/** Texts of the code emails, in every app language. "{code}" is replaced with the 6-digit code. */
export const EMAIL_TEXTS: Record<LanguageCode, { subject: string; verifyLead: string; resetLead: string; validity: string; ignore: string }> = {
  en: {
    subject: "Your Dilo code: {code}",
    verifyLead: "Here is your code to confirm your email address for Dilo:",
    resetLead: "Here is your code to set a new password for Dilo:",
    validity: "The code is valid for 10 minutes.",
    ignore: "If you didn't request this, you can ignore this email.",
  },
  tr: {
    subject: "Dilo kodun: {code}",
    verifyLead: "Dilo için e-posta adresini doğrulama kodun:",
    resetLead: "Dilo'da yeni şifre belirleme kodun:",
    validity: "Kod 10 dakika geçerlidir.",
    ignore: "Bu kodu sen istemediysen bu e-postayı görmezden gelebilirsin.",
  },
  de: {
    subject: "Dein Dilo-Code: {code}",
    verifyLead: "Hier ist dein Code, um deine E-Mail-Adresse für Dilo zu bestätigen:",
    resetLead: "Hier ist dein Code, um ein neues Passwort für Dilo festzulegen:",
    validity: "Der Code ist 10 Minuten gültig.",
    ignore: "Wenn du das nicht angefordert hast, kannst du diese E-Mail ignorieren.",
  },
  fr: {
    subject: "Votre code Dilo : {code}",
    verifyLead: "Voici votre code pour confirmer votre adresse e-mail sur Dilo :",
    resetLead: "Voici votre code pour définir un nouveau mot de passe sur Dilo :",
    validity: "Le code est valable 10 minutes.",
    ignore: "Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail.",
  },
  es: {
    subject: "Tu código de Dilo: {code}",
    verifyLead: "Este es tu código para confirmar tu correo en Dilo:",
    resetLead: "Este es tu código para crear una nueva contraseña en Dilo:",
    validity: "El código es válido durante 10 minutos.",
    ignore: "Si no lo has solicitado, puedes ignorar este correo.",
  },
  el: {
    subject: "Ο κωδικός σου για το Dilo: {code}",
    verifyLead: "Αυτός είναι ο κωδικός για να επιβεβαιώσεις το email σου στο Dilo:",
    resetLead: "Αυτός είναι ο κωδικός για να ορίσεις νέο κωδικό πρόσβασης στο Dilo:",
    validity: "Ο κωδικός ισχύει για 10 λεπτά.",
    ignore: "Αν δεν το ζήτησες εσύ, μπορείς να αγνοήσεις αυτό το email.",
  },
  ar: {
    subject: "رمزك في Dilo: {code}",
    verifyLead: "هذا رمزك لتأكيد بريدك الإلكتروني في Dilo:",
    resetLead: "هذا رمزك لتعيين كلمة مرور جديدة في Dilo:",
    validity: "الرمز صالح لمدة 10 دقائق.",
    ignore: "إذا لم تطلب ذلك، يمكنك تجاهل هذه الرسالة.",
  },
  fa: {
    subject: "کد Dilo تو: {code}",
    verifyLead: "این کد برای تأیید ایمیلت در Dilo است:",
    resetLead: "این کد برای تعیین رمز جدید در Dilo است:",
    validity: "کد تا ۱۰ دقیقه معتبر است.",
    ignore: "اگر این را درخواست نکرده‌ای، می‌توانی این ایمیل را نادیده بگیری.",
  },
};
