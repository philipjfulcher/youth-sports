export const handbookSections = [
  { slug: 'swimmers', label: 'Swimmer Handbook' },
  { slug: 'parents', label: 'Parent Handbook' },
] as const

export type HandbookSection = typeof handbookSections[number]
