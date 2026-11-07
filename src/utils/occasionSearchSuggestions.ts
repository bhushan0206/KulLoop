import { FamilyOccasion, Member, Person } from '../types';

export interface SearchSuggestionChip {
  label: string;
  term: string;
}

const RITUAL_CHIPS: SearchSuggestionChip[] = [
  { label: 'Shraddha rites', term: 'shraddha' },
  { label: 'Birthdays', term: 'birthday' },
  { label: 'Vrats & kuldevta', term: 'vrat' },
  { label: 'Festivals', term: 'festival' },
];

function firstSearchToken(name: string): string | null {
  const cleaned = name.replace(/^(late|कै\.)\s+/i, '').trim();
  const token = cleaned.split(/[\s(/]/)[0]?.trim();
  if (!token || token.length < 2) return null;
  return token.toLowerCase();
}

function displayLabelForTerm(term: string, members: Member[], people: Person[], occasions: FamilyOccasion[]): string {
  const matchMember = members.find((m) => firstSearchToken(m.name) === term);
  if (matchMember) return matchMember.name.split('(')[0].trim();

  const matchPerson = people.find((p) => firstSearchToken(p.name) === term);
  if (matchPerson) return matchPerson.name.split('(')[0].trim();

  const matchOcc = occasions.find((o) => o.personNameDisplay && firstSearchToken(o.personNameDisplay) === term);
  if (matchOcc?.personNameDisplay) return matchOcc.personNameDisplay.split('(')[0].trim();

  return term.charAt(0).toUpperCase() + term.slice(1);
}

/** Ritual shortcuts + this family's member/person names only (no demo names). */
export function buildOccasionSearchSuggestions(
  members: Member[],
  people: Person[],
  occasions: FamilyOccasion[]
): SearchSuggestionChip[] {
  const chips: SearchSuggestionChip[] = [...RITUAL_CHIPS];
  const terms = new Set<string>();

  const consider = (name: string) => {
    const term = firstSearchToken(name);
    if (!term || terms.has(term)) return;
    if (RITUAL_CHIPS.some((c) => c.term === term)) return;
    terms.add(term);
    chips.push({
      label: displayLabelForTerm(term, members, people, occasions),
      term,
    });
  };

  members.forEach((m) => consider(m.name));
  people.forEach((p) => consider(p.name));
  occasions.forEach((o) => {
    if (o.personNameDisplay) consider(o.personNameDisplay);
    if (o.relationshipDisplay) consider(o.relationshipDisplay);
  });

  return chips.slice(0, 9);
}

export function quickPerformedBySuggestions(members: Member[], familyConfigurator?: string): string[] {
  const names = members
    .map((m) => m.name.split('(')[0].trim())
    .filter(Boolean)
    .slice(0, 4);
  if (names.length === 0 && familyConfigurator) {
    return [familyConfigurator, 'Family elders'];
  }
  if (names.length === 0) {
    return ['Family configurator', 'Family elders'];
  }
  return [...new Set([...names, 'Family elders'])].slice(0, 5);
}
