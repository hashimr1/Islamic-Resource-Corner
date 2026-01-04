// =====================================================
// Upload Form Options - Constants
// =====================================================
// These constants define all the available options for the resource upload form

export const GRADES = [
  'Pre-school',
  'Nursery',
  'Year 1',
  'Year 2',
  'Year 3',
  'Year 4',
  'Year 5',
  'Year 6',
  'Year 7',
  'Year 8',
  'Year 9',
  'Year 10+',
  'Secondary',
  'Adult',
] as const

export const SUBJECTS = [
  'Islamic Studies',
  'Quran',
  'Arabic',
  'English',
  'Math',
  'Science',
  'Art',
  'History',
  'Geography',
  'Other',
] as const

export const RESOURCE_TYPES = [
  'Activity',
  'Worksheet',
  'Poster',
  'Game',
  'Flashcard',
  'Presentation',
  'Booklet',
  'Colouring',
  'Craft',
  'Assessment',
  'Reading',
  'Writing',
  'Other',
] as const

export const ISLAMIC_TOPICS = [
  'Seerah',
  'Fiqh',
  'Hadith',
  'Aqeedah',
  'Manners/Adab',
  'Quran Stories',
  'Prophets',
  'Sahaba',
  'Islamic History',
  'Ramadan',
  'Eid',
  'Hajj',
  'Prayer/Salah',
  'Wudu',
  'Dua',
  'Tafseer',
  'Character Building',
  'Other',
] as const

export const GENERAL_TOPICS = [
  'Seasons',
  'Animals',
  'Family',
  'Health',
  'Colors',
  'Numbers',
  'Shapes',
  'Alphabet',
  'Weather',
  'Food',
  'Transportation',
  'Community',
  'Environment',
  'Emotions',
  'Other',
] as const

// Type exports for TypeScript
export type Grade = typeof GRADES[number]
export type Subject = typeof SUBJECTS[number]
export type ResourceType = typeof RESOURCE_TYPES[number]
export type IslamicTopic = typeof ISLAMIC_TOPICS[number]
export type GeneralTopic = typeof GENERAL_TOPICS[number]

// Helper function to check if an array contains any of the search items
export function containsAny<T>(arr: T[], searchItems: T[]): boolean {
  return searchItems.some(item => arr.includes(item))
}

// Helper function to format array for display
export function formatArray(arr: string[]): string {
  if (arr.length === 0) return 'None'
  if (arr.length === 1) return arr[0]
  if (arr.length === 2) return arr.join(' and ')
  return `${arr.slice(0, -1).join(', ')}, and ${arr[arr.length - 1]}`
}

