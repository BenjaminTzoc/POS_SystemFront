import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

@Injectable({
  providedIn: 'root',
})
export class PrintService {
  async generatePDF(elementId: string): Promise<Blob> {
    const data = document.getElementById(elementId);
    if (!data) throw new Error(`Element with id ${elementId} not found`);

    const canvas = await html2canvas(data, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    const imgWidth = 80; // 80mm for thermal printer
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    // Create PDF with custom size based on content height
    const pdf = new jsPDF('p', 'mm', [imgWidth, imgHeight]);
    const imgData = canvas.toDataURL('image/png');

    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);

    return pdf.output('blob');
  }

  downloadPDF(blob: Blob, fileName: string) {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${fileName}.pdf`;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  printPDF(blob: Blob) {
    const url = window.URL.createObjectURL(blob);
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = url;
    document.body.appendChild(iframe);

    iframe.onload = () => {
      iframe.contentWindow?.print();
      // Remove iframe after printing dialog closes (or roughly after some time)
      setTimeout(() => {
        document.body.removeChild(iframe);
        window.URL.revokeObjectURL(url);
      }, 1000);
    };
  }
}
