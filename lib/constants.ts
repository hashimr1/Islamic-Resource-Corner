export const CATEGORIES = [
  'Quran',
  'Hadith',
  'Fiqh',
  'History',
  'Arabic Language',
  'Islamic Studies',
  'Seerah',
  'Tafsir',
  'Aqeedah',
  'Duas & Adhkar',
  'Islamic Art',
  'Character Building',
  'Other'
] as const

export const GRADE_LEVELS = [
  'Pre-K',
  'Kindergarten',
  'Grade 1',
  'Grade 2',
  'Grade 3',
  'Grade 4',
  'Grade 5',
  'Grade 6',
  'Grade 7',
  'Grade 8',
  'Grade 9-10',
  'Grade 11-12',
  'Adult',
  'All Ages'
] as const

export const RESOURCE_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected'
} as const

export const USER_ROLES = {
  USER: 'user',
  ADMIN: 'admin'
} as const

export const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB in bytes

export const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/zip'
]

export const ITEMS_PER_PAGE = 12

export const OCCUPATION_OPTIONS = [
  'Parent',
  'Weekend School Teacher',
  'Full Time School Teacher',
  'Scholar',
  'School Administrator',
  'Other'
] as const

