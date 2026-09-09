import { db } from '../../lib/firebase';
import { collection, doc, setDoc, updateDoc } from 'firebase/firestore';
import { Invoice, InvoiceStatus, PaymentTransaction, Booking } from '../../types';
import { activityService } from '../activity/activity.service';

export const billingService = {
  /**
   * Generates a formal invoice for a rental booking.
   */
  async generateInvoice(
    booking: Booking,
    actor: { id: string; name: string },
    surcharges: { description: string; amount: number }[] = []
  ): Promise<Invoice> {
    const invoiceId = `INV-${Date.now()}`;
    const invoiceNumber = `AUTORENT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const items = [
      {
        description: `Location véhicule: ${booking.vehicleName} (${booking.durationDays} jours)`,
        quantity: booking.durationDays,
        unitPrice: booking.dailyRate,
        total: booking.rentalSubtotal,
      },
      ...surcharges.map((s) => ({
        description: s.description,
        quantity: 1,
        unitPrice: s.amount,
        total: s.amount,
      })),
    ];

    const subtotal = items.reduce((sum, i) => sum + i.total, 0);
    const taxRate = 0.19; // 19% TVA Tunisie
    const taxAmount = Math.round(subtotal * taxRate * 100) / 100;
    const totalAmount = Math.round((subtotal + taxAmount) * 100) / 100;

    const invoice: Invoice = {
      id: invoiceId,
      invoiceNumber,
      bookingId: booking.id,
      clientName: booking.clientName,
      clientAddress: 'Tunisie',
      clientEmail: booking.clientEmail,
      vehicleInfo: `${booking.vehicleName} (${booking.vehiclePlate})`,
      agencyName: 'AUTORENT CAR TUNISIA',
      agencyAddress: 'Aéroport Tunis-Carthage, Terminal Arrivées, Tunis',
      date: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      items,
      subtotal,
      taxRate: 19,
      taxAmount,
      totalAmount,
      paymentMethod: booking.paymentMethod,
      paymentStatus: booking.paymentStatus,
    };

    await setDoc(doc(db, 'invoices', invoiceId), invoice);

    await activityService.logAction(
      actor,
      'INVOICE_GENERATED',
      'PAYMENT',
      invoiceId,
      `Facture ${invoiceNumber} générée pour ${booking.clientName} d'un montant de ${totalAmount} DT`
    );

    return invoice;
  },

  /**
   * Records a payment transaction against a booking/invoice.
   */
  async recordPayment(
    transaction: PaymentTransaction,
    actor: { id: string; name: string }
  ): Promise<void> {
    const paymentRef = doc(db, 'payments', transaction.id);
    await setDoc(paymentRef, {
      ...transaction,
      timestamp: transaction.timestamp || new Date().toISOString(),
    });

    await activityService.logAction(
      actor,
      'PAYMENT_RECEIVED',
      'PAYMENT',
      transaction.id,
      `Règlement de ${transaction.amount} DT (${transaction.method}) enregistré pour le dossier ${transaction.bookingId}`
    );
  },
};
