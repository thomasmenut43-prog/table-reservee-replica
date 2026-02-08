import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (user?.role !== 'admin') {
            return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
        }

        // Tâches de maintenance quotidiennes
        const tasks = [];
        
        // Supprimer les anciennes réservations annulées (> 30 jours)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const oldReservations = await base44.asServiceRole.entities.Reservation.filter({
            status: 'canceled'
        });
        
        const deletedReservations = [];
        for (const reservation of oldReservations) {
            if (new Date(reservation.created_date) < thirtyDaysAgo) {
                await base44.asServiceRole.entities.Reservation.delete(reservation.id);
                deletedReservations.push(reservation.id);
            }
        }
        
        tasks.push({
            task: 'Nettoyage réservations annulées',
            deleted: deletedReservations.length
        });

        return Response.json({
            success: true,
            message: 'Cache vidé et maintenance effectuée',
            timestamp: new Date().toISOString(),
            tasks
        });
    } catch (error) {
        return Response.json({ 
            success: false,
            error: error.message 
        }, { status: 500 });
    }
});