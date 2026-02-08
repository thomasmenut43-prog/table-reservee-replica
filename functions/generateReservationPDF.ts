import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { jsPDF } from 'npm:jspdf@4.0.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { reservationId } = body;

    if (!reservationId) {
      return Response.json({ error: 'Reservation ID required' }, { status: 400 });
    }

    // Fetch reservation details
    const reservation = await base44.entities.Reservation.list()
      .then(all => all.find(r => r.id === reservationId));

    if (!reservation) {
      return Response.json({ error: 'Reservation not found' }, { status: 404 });
    }

    // Fetch restaurant details
    const restaurants = await base44.entities.Restaurant.list();
    const restaurant = restaurants.find(r => r.id === reservation.restaurantId);

    // Fetch platform settings for logo
    const settings = await base44.entities.PlatformSettings.filter({ settingKey: 'design' })
      .then(result => result[0]);





    // Generate PDF with real data
    const pdfBytes = await generatePDFFromHTML(reservation, restaurant, settings);

    return new Response(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="reservation-${reservation.reference}.pdf"`
      }
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function generatePDFFromHTML(reservation, restaurant, settings) {
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
  const dateStr = startDate.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = startDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
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
  const statusLabel = reservation.status === 'confirmed' ? 'Confirmee' : reservation.status === 'pending' ? 'En attente' : reservation.status;

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

  return doc.output('arraybuffer');
}