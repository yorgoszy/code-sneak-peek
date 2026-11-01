export function canBookSection(sectionId: string, allowedSections?: readonly string[] | null): boolean {
  return !allowedSections?.length || allowedSections.includes(sectionId);
}

interface GymBookingAccess {
  type: string;
  allowed_sections?: readonly string[] | null;
  available_monthly?: number;
  available_visits?: number;
}

export function canBookGymSection(sectionId: string, availability?: GymBookingAccess | null): boolean {
  if (!availability || !canBookSection(sectionId, availability.allowed_sections)) return false;
  if (availability.type === 'hypergym') return (availability.available_monthly || 0) > 0;
  if (availability.type === 'visit_packages') return (availability.available_visits || 0) > 0;
  return false;
}