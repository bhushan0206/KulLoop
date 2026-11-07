/** Curated partner links — one calm card, no ad clutter. */
export const MYDHAROHAR = {
  home: 'https://www.mydharohar.org/',
  about: 'https://www.mydharohar.org/about',
  guides: 'https://www.mydharohar.org/guides',
  shraddhaGuide: 'https://www.mydharohar.org/guides/shraddha-vidhi-essentials',
  contact: 'https://www.mydharohar.org/contact',
  tagline: 'Optional printable preparation guides (partner site). KulLoop keeps your family dates private.',
} as const;

export const MYDHAROHAR_FEATURED_GUIDES = [
  {
    title: 'Shraddha essentials',
    titleMr: 'श्राद्ध विधी मार्गदर्शक',
    href: MYDHAROHAR.shraddhaGuide,
  },
  {
    title: 'Festival & puja prep',
    titleMr: 'सण व पूजा तयारी',
    href: `${MYDHAROHAR.guides}`,
  },
] as const;
