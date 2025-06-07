
/**
 * Utility functions για σωστό χειρισμό ημερομηνιών χωρίς timezone issues
 */

export const formatDateToLocalString = (date: Date): string => {
  // Χρησιμοποιούμε την τοπική ημερομηνία του χρήστη
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

export const parseDateFromString = (dateString: string): Date => {
  // Δημιουργούμε Date object χωρίς timezone conversion
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
};

export const ensureLocalDate = (date: Date | string): Date => {
  if (typeof date === 'string') {
    return parseDateFromString(date);
  }
  
  // Αν είναι ήδη Date object, δημιουργούμε νέο με τοπική ώρα
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
};

export const formatDatesArray = (dates: (Date | string)[]): string[] => {
  return dates.map(date => {
    if (typeof date === 'string') {
      // Αν είναι ήδη string, ελέγχουμε αν έχει timestamp
      if (date.includes('T')) {
        return date.split('T')[0];
      }
      return date;
    }
    return formatDateToLocalString(date);
  });
};
