import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export interface ExportReceipt {
  receiptNumber: string;
  customerName: string;
  customerVat?: string;
  date: string;
  subtotal: number;
  vat: number;
  total: number;
  invoiceMark?: string;
}

const monthNames = [
  'Ιανουάριος', 'Φεβρουάριος', 'Μάρτιος', 'Απρίλιος', 'Μάιος', 'Ιούνιος',
  'Ιούλιος', 'Αύγουστος', 'Σεπτέμβριος', 'Οκτώβριος', 'Νοέμβριος', 'Δεκέμβριος'
];

export async function exportReceiptsToPDF(
  receipts: ExportReceipt[],
  months: number[],
  year: number
) {
  const monthsLabel = months
    .sort((a, b) => a - b)
    .map(m => monthNames[m - 1])
    .join(', ');

  const totalSum = receipts.reduce((s, r) => s + r.total, 0);
  const netSum = receipts.reduce((s, r) => s + r.subtotal, 0);
  const vatSum = receipts.reduce((s, r) => s + r.vat, 0);

  // Build container off-screen
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-10000px';
  container.style.top = '0';
  container.style.width = '800px';
  container.style.padding = '24px';
  container.style.background = '#ffffff';
  container.style.color = '#000000';
  container.style.fontFamily = 'Arial, Helvetica, sans-serif';
  container.style.fontSize = '12px';

  const rowsHtml = receipts.map(r => `
    <tr>
      <td style="padding:6px;border:1px solid #ddd;">${escapeHtml(r.receiptNumber)}</td>
      <td style="padding:6px;border:1px solid #ddd;">${escapeHtml(r.date)}</td>
      <td style="padding:6px;border:1px solid #ddd;">${escapeHtml(r.customerName || '')}${r.customerVat ? `<br/><span style="font-size:10px;color:#666;">ΑΦΜ: ${escapeHtml(r.customerVat)}</span>` : ''}</td>
      <td style="padding:6px;border:1px solid #ddd;text-align:right;">€${r.subtotal.toFixed(2)}</td>
      <td style="padding:6px;border:1px solid #ddd;text-align:right;">€${r.vat.toFixed(2)}</td>
      <td style="padding:6px;border:1px solid #ddd;text-align:right;font-weight:bold;">€${r.total.toFixed(2)}</td>
      <td style="padding:6px;border:1px solid #ddd;font-size:10px;">${escapeHtml(r.invoiceMark || '-')}</td>
    </tr>
  `).join('');

  container.innerHTML = `
    <div style="margin-bottom:16px;">
      <h1 style="font-size:20px;margin:0 0 4px 0;">Ιστορικό Αποδείξεων</h1>
      <p style="margin:0;font-size:13px;color:#333;">Μήνες: ${monthsLabel} ${year}</p>
      <p style="margin:0;font-size:12px;color:#666;">Σύνολο αποδείξεων: ${receipts.length}</p>
    </div>
    <table style="width:100%;border-collapse:collapse;font-size:11px;">
      <thead>
        <tr style="background:#f3f3f3;">
          <th style="padding:6px;border:1px solid #ddd;text-align:left;">Αριθμός</th>
          <th style="padding:6px;border:1px solid #ddd;text-align:left;">Ημ/νία</th>
          <th style="padding:6px;border:1px solid #ddd;text-align:left;">Πελάτης</th>
          <th style="padding:6px;border:1px solid #ddd;text-align:right;">Καθαρό</th>
          <th style="padding:6px;border:1px solid #ddd;text-align:right;">ΦΠΑ</th>
          <th style="padding:6px;border:1px solid #ddd;text-align:right;">Σύνολο</th>
          <th style="padding:6px;border:1px solid #ddd;text-align:left;">ΜΑΡΚ</th>
        </tr>
      </thead>
      <tbody>${rowsHtml}</tbody>
      <tfoot>
        <tr style="background:#f9f9f9;font-weight:bold;">
          <td colspan="3" style="padding:8px;border:1px solid #ddd;text-align:right;">Σύνολα:</td>
          <td style="padding:8px;border:1px solid #ddd;text-align:right;">€${netSum.toFixed(2)}</td>
          <td style="padding:8px;border:1px solid #ddd;text-align:right;">€${vatSum.toFixed(2)}</td>
          <td style="padding:8px;border:1px solid #ddd;text-align:right;">€${totalSum.toFixed(2)}</td>
          <td style="padding:8px;border:1px solid #ddd;"></td>
        </tr>
      </tfoot>
    </table>
  `;

  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      backgroundColor: '#ffffff',
      useCORS: true,
      logging: false,
    });

    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const margin = 5;
    const usableWidth = pdfWidth - margin * 2;
    const usableHeight = pdfHeight - margin * 2;

    const imgWidth = usableWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    if (imgHeight <= usableHeight) {
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', margin, margin, imgWidth, imgHeight);
    } else {
      // Paginate by slicing canvas
      const pageHeightPx = (usableHeight * canvas.width) / imgWidth;
      let renderedPx = 0;
      let isFirst = true;
      while (renderedPx < canvas.height) {
        const sliceHeight = Math.min(pageHeightPx, canvas.height - renderedPx);
        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = canvas.width;
        pageCanvas.height = sliceHeight;
        const ctx = pageCanvas.getContext('2d')!;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
        ctx.drawImage(canvas, 0, renderedPx, canvas.width, sliceHeight, 0, 0, canvas.width, sliceHeight);
        const sliceImgHeight = (sliceHeight * imgWidth) / canvas.width;
        if (!isFirst) pdf.addPage();
        pdf.addImage(pageCanvas.toDataURL('image/png'), 'PNG', margin, margin, imgWidth, sliceImgHeight);
        isFirst = false;
        renderedPx += sliceHeight;
      }
    }

    const filename = `apodeixeis_${months.sort((a,b)=>a-b).join('-')}_${year}.pdf`;
    pdf.save(filename);
  } finally {
    document.body.removeChild(container);
  }
}

function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
