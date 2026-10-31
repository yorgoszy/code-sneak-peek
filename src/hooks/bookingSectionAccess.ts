export function canBookSection(sectionId: string, allowedSections?: readonly string[] | null): boolean {
  return !allowedSections?.length || allowedSections.includes(sectionId);
}