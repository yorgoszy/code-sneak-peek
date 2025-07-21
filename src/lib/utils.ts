import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Αφαιρεί τόνους από ελληνικά κείμενα για καλύτερη αναζήτηση
 */
export function normalizeGreekText(text: string): string {
  return text
    .toLowerCase()
    .replace(/ά/g, 'α')
    .replace(/έ/g, 'ε') 
    .replace(/ή/g, 'η')
    .replace(/ί/g, 'ι')
    .replace(/ό/g, 'ο')
    .replace(/ύ/g, 'υ')
    .replace(/ώ/g, 'ω')
    .replace(/ΐ/g, 'ι')
    .replace(/ΰ/g, 'υ')
}

/**
 * Ελέγχει αν το searchTerm ταιριάζει με το text χωρίς τόνους
 */
export function matchesSearchTerm(text: string, searchTerm: string): boolean {
  const normalizedText = normalizeGreekText(text)
  const normalizedSearchTerm = normalizeGreekText(searchTerm)
  return normalizedText.includes(normalizedSearchTerm)
}
