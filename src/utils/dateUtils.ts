
/**
 * Utility functions για σωστό χειρισμό ημερομηνιών χωρίς timezone issues
 */

export const formatDateToLocalString = (date: Date): string => {
  console.log('🔧 [dateUtils] formatDateToLocalString input:', {
    date: date,
    toString: date.toString(),
    toISOString: date.toISOString(),
    getFullYear: date.getFullYear(),
    getMonth: date.getMonth(),
    getDate: date.getDate(),
    getTimezoneOffset: date.getTimezoneOffset()
  });
  
  // Χρησιμοποιούμε την τοπική ημερομηνία του χρήστη
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  const result = `${year}-${month}-${day}`;
  
  console.log('🔧 [dateUtils] formatDateToLocalString output:', {
    input: date,
    result: result,
    components: { year, month, day }
  });
  
  return result;
};

export const parseDateFromString = (dateString: string): Date => {
  console.log('🔧 [dateUtils] parseDateFromString input:', dateString);
  
  // Δημιουργούμε Date object χωρίς timezone conversion
  const [year, month, day] = dateString.split('-').map(Number);
  const result = new Date(year, month - 1, day);
  
  console.log('🔧 [dateUtils] parseDateFromString output:', {
    input: dateString,
    result: result,
    components: { year, month, day },
    resultString: result.toString(),
    resultISOString: result.toISOString()
  });
  
  return result;
};

export const ensureLocalDate = (date: Date | string): Date => {
  console.log('🔧 [dateUtils] ensureLocalDate input:', {
    date: date,
    type: typeof date
  });
  
  if (typeof date === 'string') {
    const result = parseDateFromString(date);
    console.log('🔧 [dateUtils] ensureLocalDate string→date:', { input: date, result: result });
    return result;
  }
  
  // Αν είναι ήδη Date object, δημιουργούμε νέο με τοπική ώρα
  const result = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  console.log('🔧 [dateUtils] ensureLocalDate date→local:', { input: date, result: result });
  return result;
};

export const formatDatesArray = (dates: (Date | string)[]): string[] => {
  console.log('🔧 [dateUtils] formatDatesArray input:', dates);
  
  const result = dates.map((date, index) => {
    console.log(`🔧 [dateUtils] formatDatesArray processing ${index}:`, {
      date: date,
      type: typeof date
    });
    
    if (typeof date === 'string') {
      // Αν είναι ήδη string, ελέγχουμε αν έχει timestamp
      if (date.includes('T')) {
        const dateOnly = date.split('T')[0];
        console.log(`🔧 [dateUtils] formatDatesArray string with timestamp: ${date} → ${dateOnly}`);
        return dateOnly;
      }
      console.log(`🔧 [dateUtils] formatDatesArray string kept: ${date}`);
      return date;
    }
    const formatted = formatDateToLocalString(date);
    console.log(`🔧 [dateUtils] formatDatesArray date formatted: ${date} → ${formatted}`);
    return formatted;
  });
  
  console.log('🔧 [dateUtils] formatDatesArray output:', result);
  return result;
};
