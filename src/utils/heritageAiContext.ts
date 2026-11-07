import { Family, FamilyOccasion } from '../types';

/** One-line context for Heritage AI — grounded in the family calendar, not generic noise. */
export function buildHeritageAiFamilyContext(
  family: Family,
  occasions: FamilyOccasion[]
): string {
  const now = new Date();
  const upcoming = [...occasions]
    .filter((o) => {
      const d = new Date(o.occurrence2027?.gregorianDateStr || '');
      return !Number.isNaN(d.getTime()) && d >= now;
    })
    .sort(
      (a, b) =>
        new Date(a.occurrence2027.gregorianDateStr).getTime() -
        new Date(b.occurrence2027.gregorianDateStr).getTime()
    )
    .slice(0, 3);

  if (upcoming.length === 0) {
    return `${family.name} · ${family.convention} · ${family.homeLocation}. No upcoming occasions loaded yet — help with calendar basics and prep guides.`;
  }

  const lines = upcoming.map((o) => {
    const d = o.occurrence2027.gregorianDateStr;
    const tithi = o.occurrence2027.tithiSpan?.split(' ').slice(0, 3).join(' ') || '';
    return `${o.title} on ${d}${tithi ? ` (${tithi})` : ''}`;
  });

  return `${family.name} · ${family.convention} · ${family.homeLocation}. Next on calendar: ${lines.join('; ')}.`;
}
