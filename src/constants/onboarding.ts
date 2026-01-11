// Lazy-loaded onboarding constants to reduce initial bundle size

export const RELATIONSHIP_OPTIONS = [
  { label: 'Single & Dating', value: 'single_dating' },
  { label: 'In a Relationship', value: 'in_relationship' },
  { label: 'Long Term', value: 'long_term' },
  { label: 'Married', value: 'married' },
  { label: 'Figuring it Out', value: 'figuring_it_out' },
] as const;

export const INTENT_OPTIONS = [
  { label: 'Reflect on dates', value: 'reflect_on_dates' },
  { label: 'Spot patterns', value: 'spot_patterns' },
  { label: 'Gain clarity', value: 'gain_clarity' },
  { label: 'Communicate better', value: 'communicate_better' },
  { label: 'Heal or reset', value: 'heal_or_reset' },
] as const;

export const MAX_SELECTIONS = 2;

