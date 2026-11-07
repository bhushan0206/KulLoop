import { FamilyOccasion, LanguageCode } from '../types';

export function formatTithiLabel(occ: FamilyOccasion): string {
  if (occ.tithiFields) {
    const { lunarMonth, paksha, tithi } = occ.tithiFields;
    const dev = occ.tithiFields.tithiDevanagari;
    const base = `${lunarMonth} ${paksha} ${tithi}`.trim();
    return dev ? `${dev} · ${base}` : base;
  }
  return occ.occurrence2027?.tithiSpan || occ.title;
}

export type ReminderLang = LanguageCode;

export function memberLanguageToReminderLang(lang: LanguageCode): ReminderLang {
  return lang;
}

export function reminderLangLabel(lang: ReminderLang): string {
  if (lang === 'mr') return 'Marathi';
  if (lang === 'hi') return 'Hindi';
  return 'English';
}
