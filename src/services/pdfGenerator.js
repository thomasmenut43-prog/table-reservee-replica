// PDF Generator - Local replacement for serverless function
// Uses jsPDF to generate reservation PDFs client-side

import { jsPDF } from 'jspdf';

export async function generateReservationPDF({ reservationId }) {
    // Import the db service
    const { entities } = await import('./localStorageService.js');

    // Fetch reservation
    const reservations = await entities.Reservation.list();
    const reservation = reservations.find(r => r.id === reservationId);

    if (!reservation) {
        throw new Error('Reservation not found');
    }

    // Fetch restaurant
    const restaurants = await entities.Restaurant.list();
    const restaurant = restaurants.find(r => r.id === reservation.restaurantId);

    // Fetch platform settings
    const settings = await entities.PlatformSettings.filter({ settingKey: 'design' });
    const platformSettings = settings[0];

    // Generate PDF
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });

    // Header
    doc.setFillColor(25, 118, 210);
    doc.rect(0, 0, 210, 35, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Fiche de Reservation', 50, 22);

    // Reset
    doc.setTextColor(0, 0, 0);
    let y = 50;

    // Reference box
    doc.setFillColor(245, 245, 245);
    doc.rect(15, y, 180, 18, 'F');
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Reference:', 18, y + 7);
    doc.setTextColor(25, 118, 210);
    doc.setFontSize(12);
    doc.text(reservation.reference || 'N/A', 50, y + 7);
    doc.setTextColor(0, 0, 0);

    y += 28;

    // Restaurant section
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('Restaurant', 15, y);
    y += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(restaurant?.name || 'N/A', 15, y);
    y += 6;

    if (restaurant?.address) {
        doc.text(restaurant.address, 15, y);
        y += 6;
    }

    if (restaurant?.phone) {
        doc.text('Tel: ' + restaurant.phone, 15, y);
        y += 6;
    }

    y += 8;

    // Reservation details
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('Details de la Reservation', 15, y);
    y += 8;

    doc.setFontSize(10);
    const startDate = new Date(reservation.dateTimeStart);
    const dateStr = startDate.toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    const timeStr = startDate.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit'
    });
    const serviceLabel = reservation.serviceType === 'MIDI' ? 'Dejeuner' : 'Diner';

    const details = [
        ['Date:', dateStr],
        ['Heure:', timeStr],
        ['Service:', serviceLabel],
        ['Nombre de personnes:', reservation.guestsCount.toString()]
    ];

    details.forEach(([label, value]) => {
        doc.setFont('helvetica', 'bold');
        doc.text(label, 15, y);
        doc.setFont('helvetica', 'normal');
        doc.text(value, 70, y);
        y += 6;
    });

    y += 8;

    // Client info
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('Informations Client', 15, y);
    y += 8;

    doc.setFontSize(10);
    const statusLabels = {
        'confirmed': 'Confirmee',
        'pending': 'En attente',
        'canceled': 'Annulee',
        'completed': 'Terminee'
    };
    const statusLabel = statusLabels[reservation.status] || reservation.status;

    const clientDetails = [
        ['Nom:', reservation.firstName + ' ' + reservation.lastName],
        ['Telephone:', reservation.phone],
        ['Email:', reservation.email || '-'],
        ['Statut:', statusLabel]
    ];

    clientDetails.forEach(([label, value]) => {
        doc.setFont('helvetica', 'bold');
        doc.text(label, 15, y);
        doc.setFont('helvetica', 'normal');
        doc.text(value, 70, y);
        y += 6;
    });

    // Footer
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.setFont('helvetica', 'normal');
    doc.text('Veuillez vous presenter 5 minutes avant l\'heure de votre reservation.', 15, 270);
    const now = new Date();
    doc.text('Genere le ' + now.toLocaleDateString('fr-FR') + ' a ' + now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }), 15, 280);

    // Return as ArrayBuffer for consistency with original API
    return {
        data: doc.output('arraybuffer')
    };
}
