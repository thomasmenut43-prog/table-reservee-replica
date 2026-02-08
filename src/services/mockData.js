// Mock Data for Restaurant Reservation System
// This data is loaded into localStorage on first app load

export const mockData = {
    Restaurant: [
        {
            id: 'rest_1',
            name: 'Le Petit Bistrot',
            description: 'Un charmant bistrot français au cœur de la ville, proposant une cuisine traditionnelle revisitée avec des produits frais et locaux.',
            address: '15 Rue de la Paix',
            city: 'Paris',
            phone: '01 42 65 78 90',
            email: 'contact@petitbistrot.fr',
            coverPhoto: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800',
            photos: [
                'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800',
                'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800'
            ],
            cuisineTags: ['Français', 'Bistrot', 'Traditionnel'],
            latitude: 48.8698,
            longitude: 2.3298,
            isActive: true,
            onlineBookingEnabled: true,
            autoConfirmEnabled: true,
            mealDurationMinutes: 90,
            slotIntervalMinutes: 15,
            minAdvanceMinutes: 60,
            bookingWindowDays: 60,
            groupPendingThreshold: 8,
            tableJoiningEnabled: true,
            depositEnabled: false,
            ratingAvg: 4.5,
            ratingCount: 127,
            created_date: '2024-01-15T10:00:00Z'
        },
        {
            id: 'rest_2',
            name: 'Sakura Sushi',
            description: 'Restaurant japonais authentique avec sushis frais préparés devant vous par nos chefs experts.',
            address: '28 Avenue des Champs-Élysées',
            city: 'Paris',
            phone: '01 45 62 34 56',
            email: 'reservation@sakura-sushi.fr',
            coverPhoto: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800',
            photos: [
                'https://images.unsplash.com/photo-1553621042-f6e147245754?w=800'
            ],
            cuisineTags: ['Japonais', 'Sushi', 'Asiatique'],
            latitude: 48.8738,
            longitude: 2.2950,
            isActive: true,
            onlineBookingEnabled: true,
            autoConfirmEnabled: true,
            mealDurationMinutes: 75,
            slotIntervalMinutes: 15,
            minAdvanceMinutes: 120,
            bookingWindowDays: 30,
            groupPendingThreshold: 6,
            tableJoiningEnabled: false,
            depositEnabled: false,
            ratingAvg: 4.8,
            ratingCount: 89,
            created_date: '2024-02-20T10:00:00Z'
        },
        {
            id: 'rest_3',
            name: 'La Pizzeria Napoli',
            description: 'Pizzas napolitaines cuites au feu de bois, dans la pure tradition italienne.',
            address: '42 Rue de Rivoli',
            city: 'Paris',
            phone: '01 40 28 15 73',
            email: 'bonjour@pizzeria-napoli.fr',
            coverPhoto: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800',
            photos: [],
            cuisineTags: ['Italien', 'Pizza', 'Fast-food'],
            latitude: 48.8566,
            longitude: 2.3522,
            isActive: true,
            onlineBookingEnabled: true,
            autoConfirmEnabled: true,
            mealDurationMinutes: 60,
            slotIntervalMinutes: 30,
            minAdvanceMinutes: 30,
            bookingWindowDays: 14,
            groupPendingThreshold: 10,
            tableJoiningEnabled: true,
            depositEnabled: false,
            ratingAvg: 4.2,
            ratingCount: 203,
            created_date: '2024-03-01T10:00:00Z'
        }
    ],

    FloorPlan: [],
    MapObject: [],

    Table: [
        // Le Petit Bistrot tables
        { id: 'table_1', restaurantId: 'rest_1', name: 'Table 1', seats: 2, zone: 'main', isJoinable: true, position_x: 100, position_y: 100 },
        { id: 'table_2', restaurantId: 'rest_1', name: 'Table 2', seats: 2, zone: 'main', isJoinable: true, position_x: 200, position_y: 100 },
        { id: 'table_3', restaurantId: 'rest_1', name: 'Table 3', seats: 4, zone: 'main', isJoinable: true, position_x: 300, position_y: 100 },
        { id: 'table_4', restaurantId: 'rest_1', name: 'Table 4', seats: 4, zone: 'main', isJoinable: false, position_x: 100, position_y: 200 },
        { id: 'table_5', restaurantId: 'rest_1', name: 'Table 5', seats: 6, zone: 'main', isJoinable: false, position_x: 200, position_y: 200 },
        { id: 'table_6', restaurantId: 'rest_1', name: 'Terrasse 1', seats: 4, zone: 'terrace', isJoinable: true, position_x: 100, position_y: 300 },
        { id: 'table_7', restaurantId: 'rest_1', name: 'Terrasse 2', seats: 4, zone: 'terrace', isJoinable: true, position_x: 200, position_y: 300 },

        // Sakura Sushi tables
        { id: 'table_8', restaurantId: 'rest_2', name: 'Comptoir 1', seats: 2, zone: 'main', isJoinable: false, position_x: 100, position_y: 100 },
        { id: 'table_9', restaurantId: 'rest_2', name: 'Comptoir 2', seats: 2, zone: 'main', isJoinable: false, position_x: 150, position_y: 100 },
        { id: 'table_10', restaurantId: 'rest_2', name: 'Table Tatami 1', seats: 4, zone: 'private', isJoinable: false, position_x: 100, position_y: 200 },
        { id: 'table_11', restaurantId: 'rest_2', name: 'Table Tatami 2', seats: 6, zone: 'private', isJoinable: false, position_x: 200, position_y: 200 },

        // La Pizzeria Napoli tables
        { id: 'table_12', restaurantId: 'rest_3', name: 'Table 1', seats: 4, zone: 'main', isJoinable: true, position_x: 100, position_y: 100 },
        { id: 'table_13', restaurantId: 'rest_3', name: 'Table 2', seats: 4, zone: 'main', isJoinable: true, position_x: 200, position_y: 100 },
        { id: 'table_14', restaurantId: 'rest_3', name: 'Table 3', seats: 6, zone: 'main', isJoinable: false, position_x: 300, position_y: 100 },
        { id: 'table_15', restaurantId: 'rest_3', name: 'Terrasse', seats: 8, zone: 'terrace', isJoinable: false, position_x: 100, position_y: 200 }
    ],

    ServiceSchedule: [
        // Le Petit Bistrot schedules
        { id: 'sched_1', restaurantId: 'rest_1', dayOfWeek: 1, serviceType: 'MIDI', isOpen: true, startTime: '12:00', endTime: '14:30' },
        { id: 'sched_2', restaurantId: 'rest_1', dayOfWeek: 1, serviceType: 'SOIR', isOpen: true, startTime: '19:00', endTime: '22:30' },
        { id: 'sched_3', restaurantId: 'rest_1', dayOfWeek: 2, serviceType: 'MIDI', isOpen: true, startTime: '12:00', endTime: '14:30' },
        { id: 'sched_4', restaurantId: 'rest_1', dayOfWeek: 2, serviceType: 'SOIR', isOpen: true, startTime: '19:00', endTime: '22:30' },
        { id: 'sched_5', restaurantId: 'rest_1', dayOfWeek: 3, serviceType: 'MIDI', isOpen: true, startTime: '12:00', endTime: '14:30' },
        { id: 'sched_6', restaurantId: 'rest_1', dayOfWeek: 3, serviceType: 'SOIR', isOpen: true, startTime: '19:00', endTime: '22:30' },
        { id: 'sched_7', restaurantId: 'rest_1', dayOfWeek: 4, serviceType: 'MIDI', isOpen: true, startTime: '12:00', endTime: '14:30' },
        { id: 'sched_8', restaurantId: 'rest_1', dayOfWeek: 4, serviceType: 'SOIR', isOpen: true, startTime: '19:00', endTime: '22:30' },
        { id: 'sched_9', restaurantId: 'rest_1', dayOfWeek: 5, serviceType: 'MIDI', isOpen: true, startTime: '12:00', endTime: '14:30' },
        { id: 'sched_10', restaurantId: 'rest_1', dayOfWeek: 5, serviceType: 'SOIR', isOpen: true, startTime: '19:00', endTime: '23:00' },
        { id: 'sched_11', restaurantId: 'rest_1', dayOfWeek: 6, serviceType: 'MIDI', isOpen: true, startTime: '12:00', endTime: '15:00' },
        { id: 'sched_12', restaurantId: 'rest_1', dayOfWeek: 6, serviceType: 'SOIR', isOpen: true, startTime: '19:00', endTime: '23:00' },
        { id: 'sched_13', restaurantId: 'rest_1', dayOfWeek: 0, serviceType: 'MIDI', isOpen: false, startTime: null, endTime: null },
        { id: 'sched_14', restaurantId: 'rest_1', dayOfWeek: 0, serviceType: 'SOIR', isOpen: false, startTime: null, endTime: null },

        // Sakura Sushi schedules (closed Monday)
        { id: 'sched_15', restaurantId: 'rest_2', dayOfWeek: 2, serviceType: 'MIDI', isOpen: true, startTime: '12:00', endTime: '14:00' },
        { id: 'sched_16', restaurantId: 'rest_2', dayOfWeek: 2, serviceType: 'SOIR', isOpen: true, startTime: '19:00', endTime: '22:00' },
        { id: 'sched_17', restaurantId: 'rest_2', dayOfWeek: 3, serviceType: 'MIDI', isOpen: true, startTime: '12:00', endTime: '14:00' },
        { id: 'sched_18', restaurantId: 'rest_2', dayOfWeek: 3, serviceType: 'SOIR', isOpen: true, startTime: '19:00', endTime: '22:00' },
        { id: 'sched_19', restaurantId: 'rest_2', dayOfWeek: 4, serviceType: 'MIDI', isOpen: true, startTime: '12:00', endTime: '14:00' },
        { id: 'sched_20', restaurantId: 'rest_2', dayOfWeek: 4, serviceType: 'SOIR', isOpen: true, startTime: '19:00', endTime: '22:00' },
        { id: 'sched_21', restaurantId: 'rest_2', dayOfWeek: 5, serviceType: 'MIDI', isOpen: true, startTime: '12:00', endTime: '14:00' },
        { id: 'sched_22', restaurantId: 'rest_2', dayOfWeek: 5, serviceType: 'SOIR', isOpen: true, startTime: '19:00', endTime: '22:30' },
        { id: 'sched_23', restaurantId: 'rest_2', dayOfWeek: 6, serviceType: 'MIDI', isOpen: true, startTime: '12:00', endTime: '14:30' },
        { id: 'sched_24', restaurantId: 'rest_2', dayOfWeek: 6, serviceType: 'SOIR', isOpen: true, startTime: '19:00', endTime: '22:30' },
        { id: 'sched_25', restaurantId: 'rest_2', dayOfWeek: 0, serviceType: 'MIDI', isOpen: true, startTime: '12:00', endTime: '15:00' },
        { id: 'sched_26', restaurantId: 'rest_2', dayOfWeek: 0, serviceType: 'SOIR', isOpen: true, startTime: '19:00', endTime: '22:00' },

        // La Pizzeria Napoli schedules (open every day)
        { id: 'sched_27', restaurantId: 'rest_3', dayOfWeek: 0, serviceType: 'MIDI', isOpen: true, startTime: '11:30', endTime: '14:30' },
        { id: 'sched_28', restaurantId: 'rest_3', dayOfWeek: 0, serviceType: 'SOIR', isOpen: true, startTime: '18:30', endTime: '22:30' },
        { id: 'sched_29', restaurantId: 'rest_3', dayOfWeek: 1, serviceType: 'MIDI', isOpen: true, startTime: '11:30', endTime: '14:30' },
        { id: 'sched_30', restaurantId: 'rest_3', dayOfWeek: 1, serviceType: 'SOIR', isOpen: true, startTime: '18:30', endTime: '22:30' },
        { id: 'sched_31', restaurantId: 'rest_3', dayOfWeek: 2, serviceType: 'MIDI', isOpen: true, startTime: '11:30', endTime: '14:30' },
        { id: 'sched_32', restaurantId: 'rest_3', dayOfWeek: 2, serviceType: 'SOIR', isOpen: true, startTime: '18:30', endTime: '22:30' },
        { id: 'sched_33', restaurantId: 'rest_3', dayOfWeek: 3, serviceType: 'MIDI', isOpen: true, startTime: '11:30', endTime: '14:30' },
        { id: 'sched_34', restaurantId: 'rest_3', dayOfWeek: 3, serviceType: 'SOIR', isOpen: true, startTime: '18:30', endTime: '22:30' },
        { id: 'sched_35', restaurantId: 'rest_3', dayOfWeek: 4, serviceType: 'MIDI', isOpen: true, startTime: '11:30', endTime: '14:30' },
        { id: 'sched_36', restaurantId: 'rest_3', dayOfWeek: 4, serviceType: 'SOIR', isOpen: true, startTime: '18:30', endTime: '22:30' },
        { id: 'sched_37', restaurantId: 'rest_3', dayOfWeek: 5, serviceType: 'MIDI', isOpen: true, startTime: '11:30', endTime: '14:30' },
        { id: 'sched_38', restaurantId: 'rest_3', dayOfWeek: 5, serviceType: 'SOIR', isOpen: true, startTime: '18:30', endTime: '23:00' },
        { id: 'sched_39', restaurantId: 'rest_3', dayOfWeek: 6, serviceType: 'MIDI', isOpen: true, startTime: '11:30', endTime: '15:00' },
        { id: 'sched_40', restaurantId: 'rest_3', dayOfWeek: 6, serviceType: 'SOIR', isOpen: true, startTime: '18:30', endTime: '23:00' }
    ],

    Reservation: [
        {
            id: 'res_1',
            restaurantId: 'rest_1',
            tableIds: ['table_3'],
            firstName: 'Jean',
            lastName: 'Dupont',
            phone: '06 12 34 56 78',
            email: 'jean.dupont@email.fr',
            guestsCount: 4,
            serviceType: 'SOIR',
            dateTimeStart: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0] + 'T19:30:00',
            dateTimeEnd: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0] + 'T21:00:00',
            status: 'confirmed',
            reference: 'RES-ABC123',
            comment: 'Anniversaire',
            created_date: new Date().toISOString()
        },
        {
            id: 'res_2',
            restaurantId: 'rest_1',
            tableIds: ['table_1'],
            firstName: 'Marie',
            lastName: 'Martin',
            phone: '06 98 76 54 32',
            email: 'marie.m@email.fr',
            guestsCount: 2,
            serviceType: 'MIDI',
            dateTimeStart: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString().split('T')[0] + 'T12:30:00',
            dateTimeEnd: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString().split('T')[0] + 'T14:00:00',
            status: 'confirmed',
            reference: 'RES-DEF456',
            comment: '',
            created_date: new Date().toISOString()
        }
    ],

    Review: [
        { id: 'rev_1', restaurantId: 'rest_1', authorName: 'Sophie L.', rating: 5, comment: 'Excellent repas, service impeccable !', created_date: '2024-01-20T14:00:00Z' },
        { id: 'rev_2', restaurantId: 'rest_1', authorName: 'Pierre M.', rating: 4, comment: 'Très bon, ambiance agréable.', created_date: '2024-01-25T19:00:00Z' },
        { id: 'rev_3', restaurantId: 'rest_2', authorName: 'Lucie D.', rating: 5, comment: 'Les meilleurs sushis de Paris !', created_date: '2024-02-10T20:00:00Z' },
        { id: 'rev_4', restaurantId: 'rest_3', authorName: 'Marc B.', rating: 4, comment: 'Pizza authentique, comme en Italie.', created_date: '2024-03-05T13:00:00Z' }
    ],

    TableBlock: [],

    PlatformSettings: [
        {
            id: 'settings_1',
            settingKey: 'design',
            logoUrl: null,
            heroTitle: 'Réservez votre table',
            heroSubtitle: 'en quelques clics',
            heroDescription: 'Découvrez les meilleurs restaurants de votre ville et réservez facilement votre table.',
            bannerAdUrl: null,
            bannerAdLink: null
        }
    ],

    User: [
        { id: 'user_1', email: 'admin@restaurant.fr', full_name: 'Admin Système', role: 'admin', restaurantId: null },
        { id: 'user_2', email: 'manager@petitbistrot.fr', full_name: 'Pierre Manager', role: 'manager', restaurantId: 'rest_1' },
        { id: 'user_3', email: 'client@email.fr', full_name: 'Client Test', role: 'customer', restaurantId: null }
    ],

    Subscription: [],
    AuditLog: []
};
