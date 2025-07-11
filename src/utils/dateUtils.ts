
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
    getTimezoneOffset: date.getTimezoneOffset(),
    toDateString: date.toDateString(),
    toLocaleDateString: date.toLocaleDateString()
  });
  
  // ΔΙΟΡΘΩΣΗ: Χρησιμοποιούμε την τοπική ημερομηνία του χρήστη ΧΩΡΙΣ timezone conversion
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0'); // +1 επειδή getMonth() επιστρέφει 0-11
  const day = String(date.getDate()).padStart(2, '0');
  
  const result = `${year}-${month}-${day}`;
  
  console.log('🔧 [dateUtils] formatDateToLocalString output:', {
    input: date,
    result: result,
    components: { year, month: date.getMonth() + 1, day: date.getDate() },
    debugInfo: `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()} → ${result}`,
    verification: 'Date components extracted directly from Date object'
  });
  
  return result;
};

export const parseDateFromString = (dateString: string): Date => {
  console.log('🔧 [dateUtils] parseDateFromString input:', dateString);
  
  // ΔΙΟΡΘΩΣΗ: Δημιουργούμε Date object χωρίς timezone conversion
  const [year, month, day] = dateString.split('-').map(Number);
  
  // ΣΗΜΑΝΤΙΚΟ: Χρησιμοποιούμε την ώρα μεσημέρι για να αποφύγουμε DST issues
  const result = new Date(year, month - 1, day, 12, 0, 0); // -1 επειδή το Date constructor θέλει 0-11, 12:00 PM
  
  console.log('🔧 [dateUtils] parseDateFromString output:', {
    input: dateString,
    result: result,
    components: { year, month: month - 1, day },
    verification: `${result.getDate()}/${result.getMonth() + 1}/${result.getFullYear()}`,
    resultString: result.toString(),
    resultISOString: result.toISOString(),
    withNoonTime: 'Set to 12:00 PM to avoid DST issues'
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
  
  // ΔΙΟΡΘΩΣΗ: Αν είναι ήδη Date object, δημιουργούμε νέο με τοπική ώρα στο μεσημέρι
  const result = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0);
  console.log('🔧 [dateUtils] ensureLocalDate date→local:', { 
    input: date, 
    result: result,
    inputDebug: `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`,
    resultDebug: `${result.getDate()}/${result.getMonth() + 1}/${result.getFullYear()}`,
    withNoonTime: 'Set to 12:00 PM for consistency'
  });
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

// Νέα helper function για debugging
export const debugDate = (date: Date, label: string = '') => {
  console.log(`🔧 [dateUtils] DEBUG ${label}:`, {
    date: date,
    getFullYear: date.getFullYear(),
    getMonth: date.getMonth(),
    getMonthDisplay: date.getMonth() + 1, // Human readable month
    getDate: date.getDate(),
    getHours: date.getHours(),
    getMinutes: date.getMinutes(),
    toString: date.toString(),
    toISOString: date.toISOString(),
    toLocaleDateString: date.toLocaleDateString(),
    formatted: formatDateToLocalString(date)
  });
};

// Νέα function για σωστή δημιουργία ημερομηνίας από calendar
export const createDateFromCalendar = (date: Date): Date => {
  console.log('🔧 [dateUtils] createDateFromCalendar input:', {
    originalDate: date,
    toString: date.toString(),
    getFullYear: date.getFullYear(),
    getMonth: date.getMonth(),
    getDate: date.getDate(),
    getTimezoneOffset: date.getTimezoneOffset()
  });

  // Δημιουργούμε νέα ημερομηνία με τα ίδια στοιχεία αλλά στο μεσημέρι
  const cleanDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0);
  
  console.log('🔧 [dateUtils] createDateFromCalendar output:', {
    input: date,
    output: cleanDate,
    formatted: formatDateToLocalString(cleanDate),
    verification: `${cleanDate.getDate()}/${cleanDate.getMonth() + 1}/${cleanDate.getFullYear()}`
  });

  return cleanDate;
};

// ΔΙΟΡΘΩΣΗ: Νέες συναρτήσεις για καλύτερη διαχείριση ημερομηνιών
export const formatDateForStorage = (date: Date): string => {
  // Χρησιμοποιούμε την τοπική ημερομηνία χωρίς timezone conversion
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

export const createDateForDisplay = (dateString: string): Date => {
  // Δημιουργούμε ημερομηνία στο μεσημέρι για να αποφύγουμε timezone issues
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day, 12, 0, 0);
};
