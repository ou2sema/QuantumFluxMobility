import jsPDF from 'jspdf';
import { Agency, Booking, Client, Vehicle } from '../types';

export interface GenerateContractPdfOptions {
  booking: Booking;
  agency: Agency;
  vehicle?: Vehicle;
  client?: Client;
}

export function generateContractPdf({
  booking,
  agency,
  vehicle,
  client,
}: GenerateContractPdfOptions): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const invoiceNumber = `INV-2026-${booking.bookingNumber.replace('BK-2026-', '')}`;
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2; // 182mm

  // Colors
  const primaryNavy = [15, 23, 42] as const; // #0F172A
  const accentBlue = [37, 99, 235] as const; // #2563EB
  const textDark = [30, 41, 59] as const; // #1E293B
  const textMuted = [100, 116, 139] as const; // #64748B
  const lightBg = [248, 250, 252] as const; // #F8FAFC
  const borderGrey = [226, 232, 240] as const; // #E2E8F0

  // 1. Top Decorative Brand Bar
  doc.setFillColor(...primaryNavy);
  doc.rect(0, 0, pageWidth, 24, 'F');

  doc.setFillColor(...accentBlue);
  doc.rect(0, 22, pageWidth, 2, 'F');

  // Brand title in header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text('QUANTUMFLUX MOBILITY', margin, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(191, 219, 254);
  doc.text('Solution de Gestion & Location Automobile Professionnelle', margin, 18);

  // Document Type & Number in Header Right
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text('CONTRAT DE LOCATION & FACTURE', pageWidth - margin, 12, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(253, 224, 71); // Amber
  doc.text(invoiceNumber, pageWidth - margin, 18, { align: 'right' });

  let y = 32;

  // 2. Agency Information & Invoice Meta
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(...primaryNavy);
  doc.text(agency.name, margin, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...textMuted);
  y += 4.5;
  doc.text(agency.address || 'Agence Aéroport & Centre-Ville', margin, y);
  y += 4;
  doc.text(`Tél : ${agency.phone || '+33 1 49 75 00 00'}  •  Email : ${agency.email || 'contact@quantumflux.io'}`, margin, y);
  y += 4;
  doc.text('SIRET : 894 120 442 00019  •  Code NAF : 7711A  •  TVA Intra : FR48894120442', margin, y);

  // Right Meta Box
  const metaBoxWidth = 65;
  const metaBoxX = pageWidth - margin - metaBoxWidth;
  doc.setFillColor(...lightBg);
  doc.setDrawColor(...borderGrey);
  doc.roundedRect(metaBoxX, 29, metaBoxWidth, 23, 2, 2, 'FD');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...textMuted);
  doc.text('Date d\'émission :', metaBoxX + 4, 35);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...textDark);
  doc.text('02/09/2026', metaBoxX + 32, 35);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...textMuted);
  doc.text('Réf. Réservation :', metaBoxX + 4, 41);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryNavy);
  doc.text(booking.bookingNumber, metaBoxX + 32, 41);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...textMuted);
  doc.text('Statut :', metaBoxX + 4, 47);
  doc.setFont('helvetica', 'bold');
  if (booking.paymentStatus === 'PAID') {
    doc.setTextColor(16, 185, 129); // Emerald
    doc.text('PAYÉ (Acquitté)', metaBoxX + 32, 47);
  } else {
    doc.setTextColor(245, 158, 11); // Amber
    doc.text('EN ATTENTE', metaBoxX + 32, 47);
  }

  y = 58;

  // 3. Dual Information Cards (Locataire & Véhicule)
  const cardWidth = (contentWidth - 6) / 2;
  const cardHeight = 44;

  // --- Locataire Card ---
  doc.setFillColor(...lightBg);
  doc.setDrawColor(...borderGrey);
  doc.roundedRect(margin, y, cardWidth, cardHeight, 2, 2, 'FD');

  // Header band for card
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, cardWidth, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...accentBlue);
  doc.text('LOCATAIRE PRINCIPAL', margin + 4, y + 5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...textDark);
  doc.text(booking.clientName, margin + 4, y + 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...textMuted);
  doc.text(`Tél : ${booking.clientPhone}`, margin + 4, y + 20);
  doc.text(`Email : ${booking.clientEmail}`, margin + 4, y + 25);
  doc.text(`N° Permis : ${client?.licenseNumber || '26FR991823'}`, margin + 4, y + 31);
  doc.text(`Délivré le : ${client?.licenseIssueDate || '15/03/2018'}`, margin + 4, y + 36);
  if (client?.city) {
    doc.text(`Domicile : ${client.city}`, margin + 4, y + 41);
  }

  // --- Véhicule Card ---
  const vehCardX = margin + cardWidth + 6;
  doc.setFillColor(...lightBg);
  doc.setDrawColor(...borderGrey);
  doc.roundedRect(vehCardX, y, cardWidth, cardHeight, 2, 2, 'FD');

  doc.setFillColor(241, 245, 249);
  doc.rect(vehCardX, y, cardWidth, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...accentBlue);
  doc.text('VÉHICULE & DÉTAIL LOCATION', vehCardX + 4, y + 5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...textDark);
  doc.text(booking.vehicleName, vehCardX + 4, y + 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...textMuted);
  doc.text('Immatriculation :', vehCardX + 4, y + 20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...accentBlue);
  doc.text(booking.vehiclePlate, vehCardX + 32, y + 20);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...textMuted);
  doc.text('Période :', vehCardX + 4, y + 26);
  doc.setTextColor(...textDark);
  doc.text(`${booking.startDate} au ${booking.endDate} (${booking.durationDays} jours)`, vehCardX + 22, y + 26);

  doc.setTextColor(...textMuted);
  doc.text('Kilométrage départ :', vehCardX + 4, y + 32);
  doc.setTextColor(...textDark);
  doc.text(`${vehicle?.mileage?.toLocaleString('fr-FR') || '42 500'} km (${booking.includedKm || 250} km/j inclus)`, vehCardX + 36, y + 32);

  doc.setTextColor(...textMuted);
  doc.text('Caution bloquée :', vehCardX + 4, y + 38);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(217, 119, 6); // Amber dark
  doc.text(`${booking.depositAmount} DT (Pré-autorisation CB)`, vehCardX + 32, y + 38);

  y += cardHeight + 8;

  // 4. Detailed Prestations Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...primaryNavy);
  doc.text('DÉTAIL DES PRESTATIONS FACTURÉES', margin, y);
  y += 4;

  // Table Header
  const colDesc = margin;
  const colDescWidth = 98;
  const colQty = colDesc + colDescWidth;
  const colQtyWidth = 22;
  const colPU = colQty + colQtyWidth;
  const colPUWidth = 30;
  const colTotal = colPU + colPUWidth;
  const colTotalWidth = 32;

  doc.setFillColor(...primaryNavy);
  doc.rect(margin, y, contentWidth, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text('Description de la prestation', colDesc + 3, y + 4.8);
  doc.text('Quantité', colQty + colQtyWidth / 2, y + 4.8, { align: 'center' });
  doc.text('P.U. HT', colPU + colPUWidth - 3, y + 4.8, { align: 'right' });
  doc.text('Total HT', colTotal + colTotalWidth - 3, y + 4.8, { align: 'right' });

  y += 7;

  // Table Rows
  const items = [
    {
      desc: `Location de véhicule de tourisme : ${booking.vehicleName} [${booking.vehiclePlate}]`,
      subDesc: `Tarif journalier base de ${(booking.dailyRate / 1.2).toFixed(2)} DT HT • Forfait kilométrique inclus`,
      qty: `${booking.durationDays} j`,
      pu: `${(booking.dailyRate / 1.2).toFixed(2)} DT`,
      total: `${(booking.rentalSubtotal / 1.2).toFixed(2)} DT`,
    },
  ];

  if (booking.extrasTotal > 0) {
    items.push({
      desc: 'Pack Sérénité Assurance Tous Risques & Zéro Franchise',
      subDesc: 'Rachat partiel de franchise en cas de dommage responsable ou vol',
      qty: '1',
      pu: `${(booking.extrasTotal / 1.2).toFixed(2)} DT`,
      total: `${(booking.extrasTotal / 1.2).toFixed(2)} DT`,
    });
  }

  doc.setFont('helvetica', 'normal');
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const rowHeight = 12;
    doc.setFillColor(i % 2 === 0 ? 255 : 248, i % 2 === 0 ? 255 : 250, i % 2 === 0 ? 255 : 252);
    doc.rect(margin, y, contentWidth, rowHeight, 'F');
    doc.setDrawColor(...borderGrey);
    doc.line(margin, y + rowHeight, margin + contentWidth, y + rowHeight);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...textDark);
    doc.text(item.desc, colDesc + 3, y + 4.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...textMuted);
    doc.text(item.subDesc, colDesc + 3, y + 9);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...textDark);
    doc.text(item.qty, colQty + colQtyWidth / 2, y + 6.5, { align: 'center' });
    doc.text(item.pu, colPU + colPUWidth - 3, y + 6.5, { align: 'right' });
    doc.text(item.total, colTotal + colTotalWidth - 3, y + 6.5, { align: 'right' });

    y += rowHeight;
  }

  // Border around table
  doc.setDrawColor(...borderGrey);
  doc.rect(margin, y - items.length * 12 - 7, contentWidth, items.length * 12 + 7, 'D');

  y += 4;

  // 5. Financial Summary Block (Right Aligned)
  const totalBoxWidth = 80;
  const totalBoxX = pageWidth - margin - totalBoxWidth;
  const totalHT = (booking.totalAmount / 1.2).toFixed(2);
  const totalTVA = (booking.totalAmount - booking.totalAmount / 1.2).toFixed(2);
  const totalTTC = booking.totalAmount.toFixed(2);

  doc.setFillColor(...lightBg);
  doc.setDrawColor(...borderGrey);
  doc.roundedRect(totalBoxX, y, totalBoxWidth, 26, 2, 2, 'FD');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...textMuted);
  doc.text('Total Hors Taxes (HT) :', totalBoxX + 4, y + 6);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...textDark);
  doc.text(`${totalHT} DT`, totalBoxX + totalBoxWidth - 4, y + 6, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...textMuted);
  doc.text('TVA Collectée (20%) :', totalBoxX + 4, y + 12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...textDark);
  doc.text(`${totalTVA} DT`, totalBoxX + totalBoxWidth - 4, y + 12, { align: 'right' });

  doc.setDrawColor(...borderGrey);
  doc.line(totalBoxX + 4, y + 16, totalBoxX + totalBoxWidth - 4, y + 16);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(16, 185, 129); // Emerald
  doc.text('TOTAL TTC RÉGLÉ :', totalBoxX + 4, y + 22);
  doc.text(`${totalTTC} DT`, totalBoxX + totalBoxWidth - 4, y + 22, { align: 'right' });

  y += 32;

  // 6. Terms and Conditions Summary
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(...borderGrey);
  doc.roundedRect(margin, y, contentWidth, 24, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...primaryNavy);
  doc.text('EXTRAIT DES CONDITIONS GÉNÉRALES DE LOCATION & ENGAGEMENTS DU LOCATAIRE', margin + 3, y + 4.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(...textMuted);
  const terms = [
    '• Le locataire déclare être titulaire d\'un permis de conduire en cours de validité depuis plus de 2 ans et n\'avoir fait l\'objet d\'aucune suspension.',
    '• Restitution : Le véhicule doit être restitué avec le même niveau de carburant et à la date/heure stipulées ci-dessus sous peine de pénalités.',
    '• Caution & Franchise : La caution de ' + booking.depositAmount + ' DT sera libérée après vérification de l\'état des lieux retour contradictoire.',
    '• Sinistres : Tout dommage ou accident doit être notifié à QuantumFlux dans les 24 heures avec constat amiable dûment rempli.',
  ];
  let termY = y + 9;
  for (const t of terms) {
    doc.text(t, margin + 3, termY);
    termY += 3.5;
  }

  y += 28;

  // 7. Signature Boxes
  const sigBoxWidth = (contentWidth - 8) / 2;
  const sigBoxHeight = 32;

  // Agency Signature
  doc.setDrawColor(...borderGrey);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(margin, y, sigBoxWidth, sigBoxHeight, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...primaryNavy);
  doc.text('POUR L\'AGENCE QUANTUMFLUX', margin + 4, y + 5);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7);
  doc.setTextColor(...textMuted);
  doc.text('Signature & Cachet commercial électronique', margin + 4, y + 9);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(16, 185, 129);
  doc.text('CONTRAT VALIDÉ & CERTIFIÉ', margin + 8, y + 20);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(...textMuted);
  doc.text('Document horodaté et sécurisé par QuantumFlux Mobility Cloud', margin + 8, y + 25);

  // Client Signature
  const clientSigX = margin + sigBoxWidth + 8;
  doc.setDrawColor(...borderGrey);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(clientSigX, y, sigBoxWidth, sigBoxHeight, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...primaryNavy);
  doc.text('LE LOCATAIRE', clientSigX + 4, y + 5);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7);
  doc.setTextColor(...textMuted);
  doc.text('Précédé de la mention manuscrite "Bon pour accord"', clientSigX + 4, y + 9);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...textDark);
  doc.text(booking.clientName, clientSigX + 8, y + 22);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7);
  doc.setTextColor(37, 99, 235);
  doc.text('Accepté électroniquement lors de la réservation', clientSigX + 8, y + 26);

  // 8. Footer legal line
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `QuantumFlux Mobility SAS au capital de 100 000 DT • SIRET 894 120 442 00019 • ${invoiceNumber} • Page 1/1`,
    pageWidth / 2,
    pageHeight - 6,
    { align: 'center' }
  );

  return doc;
}

/**
 * Downloads the PDF directly with a formatted filename
 */
export function downloadContractPdf(options: GenerateContractPdfOptions): string {
  const doc = generateContractPdf(options);
  const invoiceNumber = `INV-2026-${options.booking.bookingNumber.replace('BK-2026-', '')}`;
  const filename = `Contrat_Location_${invoiceNumber}_${options.booking.clientName.replace(/\s+/g, '_')}.pdf`;
  doc.save(filename);
  return filename;
}

/**
 * Generates a clean HTML document for printing in an invisible iframe
 */
export function printContractDocument(options: GenerateContractPdfOptions): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      const { booking, agency, vehicle, client } = options;
      const invoiceNumber = `INV-2026-${booking.bookingNumber.replace('BK-2026-', '')}`;
      const totalHT = (booking.totalAmount / 1.2).toFixed(2);
      const totalTVA = (booking.totalAmount - booking.totalAmount / 1.2).toFixed(2);
      const totalTTC = booking.totalAmount.toFixed(2);

      // Create an invisible iframe for direct printing
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = 'none';
      document.body.appendChild(iframe);

      const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Contrat de Location - ${invoiceNumber}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm 15mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      font-size: 12px;
      line-height: 1.4;
    }
    .header-bar {
      background: #0f172a;
      color: #ffffff;
      padding: 14px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-radius: 8px 8px 0 0;
      border-bottom: 3px solid #2563eb;
    }
    .brand-title {
      font-size: 16px;
      font-weight: 800;
      letter-spacing: 0.5px;
    }
    .brand-subtitle {
      font-size: 10px;
      color: #93c5fd;
      margin-top: 2px;
    }
    .invoice-badge {
      text-align: right;
    }
    .invoice-title {
      font-size: 12px;
      font-weight: 800;
    }
    .invoice-num {
      font-size: 13px;
      font-weight: bold;
      color: #fde047;
      font-family: monospace;
    }
    .content {
      padding: 16px 0;
    }
    .agency-meta {
      display: flex;
      justify-content: space-between;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 14px;
      margin-bottom: 14px;
    }
    .agency-info h3 {
      font-size: 14px;
      font-weight: 800;
      color: #0f172a;
      margin-bottom: 3px;
    }
    .agency-info p {
      color: #64748b;
      font-size: 11px;
    }
    .meta-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 8px 12px;
      font-size: 11px;
      min-width: 220px;
    }
    .meta-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 4px;
    }
    .grid-cards {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
      margin-bottom: 16px;
    }
    .card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 12px;
    }
    .card-title {
      font-size: 10px;
      font-weight: 800;
      color: #2563eb;
      text-transform: uppercase;
      margin-bottom: 6px;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 4px;
    }
    .card-main {
      font-size: 13px;
      font-weight: 800;
      color: #0f172a;
      margin-bottom: 4px;
    }
    .card p {
      color: #475569;
      font-size: 11px;
      margin-bottom: 2px;
    }
    .table-container {
      margin-bottom: 14px;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      overflow: hidden;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;
    }
    th {
      background: #0f172a;
      color: #ffffff;
      padding: 8px 12px;
      text-align: left;
      font-weight: 700;
      font-size: 10px;
      text-transform: uppercase;
    }
    td {
      padding: 8px 12px;
      border-bottom: 1px solid #e2e8f0;
    }
    tr:nth-child(even) td {
      background: #f8fafc;
    }
    .text-right {
      text-align: right;
    }
    .text-center {
      text-align: center;
    }
    .font-mono {
      font-family: monospace;
    }
    .totals-wrapper {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 16px;
    }
    .totals-box {
      width: 260px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 10px 14px;
      font-size: 11px;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 4px;
    }
    .total-highlight {
      font-size: 13px;
      font-weight: 800;
      color: #059669;
      border-top: 1px solid #cbd5e1;
      padding-top: 6px;
      margin-top: 6px;
    }
    .terms-box {
      background: #f1f5f9;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 10px 12px;
      font-size: 9.5px;
      color: #475569;
      margin-bottom: 16px;
    }
    .terms-title {
      font-weight: 800;
      color: #0f172a;
      margin-bottom: 4px;
      text-transform: uppercase;
    }
    .signatures {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-top: 10px;
    }
    .sig-box {
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 10px 12px;
      height: 90px;
      position: relative;
    }
    .sig-header {
      font-size: 10px;
      font-weight: 800;
      color: #0f172a;
      text-transform: uppercase;
    }
    .sig-sub {
      font-size: 9px;
      color: #64748b;
      font-style: italic;
    }
    .sig-stamp {
      position: absolute;
      bottom: 10px;
      left: 12px;
      font-weight: 700;
      color: #059669;
      font-size: 11px;
    }
  </style>
</head>
<body>
  <div class="header-bar">
    <div>
      <div class="brand-title">QUANTUMFLUX MOBILITY</div>
      <div class="brand-subtitle">Solution de Gestion & Location Automobile Professionnelle</div>
    </div>
    <div class="invoice-badge">
      <div class="invoice-title">CONTRAT DE LOCATION & FACTURE</div>
      <div class="invoice-num">${invoiceNumber}</div>
    </div>
  </div>

  <div class="content">
    <div class="agency-meta">
      <div class="agency-info">
        <h3>${agency.name}</h3>
        <p>${agency.address || 'Agence Aéroport & Centre-Ville'}</p>
        <p>Tél : ${agency.phone || '+33 1 49 75 00 00'} • Email : ${agency.email || 'contact@quantumflux.io'}</p>
        <p>SIRET : 894 120 442 00019 • TVA : FR48894120442</p>
      </div>
      <div class="meta-box">
        <div class="meta-row"><span>Date :</span> <strong>02/09/2026</strong></div>
        <div class="meta-row"><span>Réf. Dossier :</span> <strong>${booking.bookingNumber}</strong></div>
        <div class="meta-row"><span>Statut :</span> <strong style="color: ${booking.paymentStatus === 'PAID' ? '#059669' : '#d97706'}">${booking.paymentStatus === 'PAID' ? 'PAYÉ (Acquitté)' : 'EN ATTENTE'}</strong></div>
      </div>
    </div>

    <div class="grid-cards">
      <div class="card">
        <div class="card-title">Locataire Principal</div>
        <div class="card-main">${booking.clientName}</div>
        <p>Tél : ${booking.clientPhone}</p>
        <p>Email : ${booking.clientEmail}</p>
        <p>Permis : <strong style="color: #0284c7">${client?.licenseNumber || '26FR991823'}</strong></p>
        <p>Délivré le : ${client?.licenseIssueDate || '15/03/2018'}</p>
      </div>

      <div class="card">
        <div class="card-title">Véhicule Loué & Modalités</div>
        <div class="card-main">${booking.vehicleName}</div>
        <p>Immatriculation : <strong style="color: #2563eb">${booking.vehiclePlate}</strong></p>
        <p>Période : Du <strong>${booking.startDate}</strong> au <strong>${booking.endDate}</strong> (${booking.durationDays} j)</p>
        <p>Kilométrage départ : ${vehicle?.mileage?.toLocaleString('fr-FR') || '42 500'} km</p>
        <p style="color: #b45309; font-weight: bold;">Caution bloquée : ${booking.depositAmount} DT (Empreinte CB)</p>
      </div>
    </div>

    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th style="width: 55%;">Prestation</th>
            <th class="text-center" style="width: 15%;">Qté</th>
            <th class="text-right" style="width: 15%;">P.U. HT</th>
            <th class="text-right" style="width: 15%;">Total HT</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <strong>Location de véhicule de tourisme (${booking.vehicleName})</strong><br>
              <span style="color: #64748b; font-size: 10px;">Forfait kilométrique inclus • Entretien et assistance 24/7</span>
            </td>
            <td class="text-center font-mono">${booking.durationDays} j</td>
            <td class="text-right font-mono">${(booking.dailyRate / 1.2).toFixed(2)} DT</td>
            <td class="text-right font-mono">${(booking.rentalSubtotal / 1.2).toFixed(2)} DT</td>
          </tr>
          ${
            booking.extrasTotal > 0
              ? `<tr>
            <td>
              <strong>Pack Assurance Tous Risques & Zéro Franchise</strong><br>
              <span style="color: #64748b; font-size: 10px;">Rachat de franchise bris de glace, carrosserie et vol</span>
            </td>
            <td class="text-center font-mono">1</td>
            <td class="text-right font-mono">${(booking.extrasTotal / 1.2).toFixed(2)} DT</td>
            <td class="text-right font-mono">${(booking.extrasTotal / 1.2).toFixed(2)} DT</td>
          </tr>`
              : ''
          }
        </tbody>
      </table>
    </div>

    <div class="totals-wrapper">
      <div class="totals-box">
        <div class="total-row"><span>Total Hors Taxes :</span> <strong class="font-mono">${totalHT} DT</strong></div>
        <div class="total-row"><span>TVA (20%) :</span> <strong class="font-mono">${totalTVA} DT</strong></div>
        <div class="total-row total-highlight"><span>TOTAL TTC :</span> <span class="font-mono">${totalTTC} DT</span></div>
      </div>
    </div>

    <div class="terms-box">
      <div class="terms-title">Conditions Générales de Location Résumées</div>
      <div>• Le locataire certifie l'exactitude des informations fournies et s'engage à restituer le véhicule avec le plein de carburant.</div>
      <div>• La restitution tardive au-delà d'un délai de grâce de 1 heure entraînera la facturation d'une journée supplémentaire.</div>
      <div>• La caution de ${booking.depositAmount} DT sera libérée après constatation d'absence de dommage lors de l'état des lieux retour.</div>
    </div>

    <div class="signatures">
      <div class="sig-box">
        <div class="sig-header">Pour l'Agence QuantumFlux</div>
        <div class="sig-sub">Signature & Cachet commercial</div>
        <div class="sig-stamp">✓ VALIDÉ ET ENREGISTRÉ</div>
      </div>
      <div class="sig-box">
        <div class="sig-header">Le Locataire</div>
        <div class="sig-sub">Mention manuscrite "Bon pour accord"</div>
        <div style="margin-top: 24px; font-weight: bold; color: #1e293b;">${booking.clientName}</div>
      </div>
    </div>
  </div>
</body>
</html>`;

      const frameDoc = iframe.contentWindow?.document || iframe.contentDocument;
      if (!frameDoc) {
        // Fallback to pdf download
        downloadContractPdf(options);
        document.body.removeChild(iframe);
        resolve(true);
        return;
      }

      frameDoc.open();
      frameDoc.write(html);
      frameDoc.close();

      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
          resolve(true);
        } catch (printErr) {
          console.warn('Iframe print intercepted, downloading PDF instead:', printErr);
          downloadContractPdf(options);
          resolve(true);
        } finally {
          setTimeout(() => {
            if (document.body.contains(iframe)) {
              document.body.removeChild(iframe);
            }
          }, 2000);
        }
      }, 350);
    } catch (err) {
      console.warn('Print contract failed, downloading PDF fallback:', err);
      downloadContractPdf(options);
      resolve(true);
    }
  });
}
