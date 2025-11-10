import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export const generateReceiptPDF = async (elementId: string = 'receipt-content'): Promise<string | null> => {
  const element = document.getElementById(elementId);
  if (!element) return null;

  try {
    // Περιμένουμε να φορτώσουν όλες οι εικόνες
    const images = element.querySelectorAll('img');
    await Promise.all(Array.from(images).map(img => {
      if (img.complete) return Promise.resolve();
      return new Promise(resolve => {
        img.onload = resolve;
        img.onerror = resolve;
        setTimeout(resolve, 1000);
      });
    }));

    // Δημιουργία canvas
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      ignoreElements: () => false,
      removeContainer: false,
      foreignObjectRendering: false,
      imageTimeout: 5000,
      onclone: (clonedDoc, clonedElement) => {
        const originalElement = document.getElementById(elementId);
        if (originalElement && clonedElement) {
          clonedElement.style.cssText = originalElement.style.cssText;
          clonedElement.style.display = 'block';
          clonedElement.style.visibility = 'visible';
          clonedElement.style.opacity = '1';
          clonedElement.style.transform = 'none';
          clonedElement.style.position = 'static';
          
          const allElements = originalElement.querySelectorAll('*');
          const clonedElements = clonedElement.querySelectorAll('*');
          
          allElements.forEach((el, index) => {
            if (clonedElements[index]) {
              (clonedElements[index] as HTMLElement).style.cssText = (el as HTMLElement).style.cssText;
            }
          });
        }
      }
    });
    
    const imgData = canvas.toDataURL('image/png', 1.0);
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    const imgWidth = pdfWidth - 10;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    if (imgHeight <= pdfHeight - 10) {
      pdf.addImage(imgData, 'PNG', 5, 5, imgWidth, imgHeight);
    } else {
      const scaledHeight = pdfHeight - 10;
      const scaledWidth = (canvas.width * scaledHeight) / canvas.height;
      const x = (pdfWidth - scaledWidth) / 2;
      pdf.addImage(imgData, 'PNG', x, 5, scaledWidth, scaledHeight);
    }
    
    // Επιστροφή PDF ως base64 string
    return pdf.output('datauristring').split(',')[1];
  } catch (error) {
    console.error('Error generating PDF:', error);
    return null;
  }
};

export const downloadPDFFromBase64 = (base64: string, filename: string) => {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: 'application/pdf' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  window.URL.revokeObjectURL(url);
};
