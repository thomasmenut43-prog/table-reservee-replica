-- =============================================
-- Données de test - Restaurants sample
-- Exécute ce script pour avoir des restaurants de démo
-- =============================================

INSERT INTO public.restaurants (id, name, description, address, city, phone, email, cover_photo, cuisine_tags, is_active, online_booking_enabled, rating_avg, rating_count)
VALUES 
  ('rest_1', 'Le Petit Bistrot', 'Un charmant bistrot français au cœur de la ville, proposant une cuisine traditionnelle revisitée.', '15 Rue de la Paix', 'Paris', '01 42 65 78 90', 'contact@petitbistrot.fr', 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800', '["Français", "Bistrot", "Traditionnel"]', true, true, 4.5, 127),
  ('rest_2', 'Sakura Sushi', 'Restaurant japonais authentique avec sushis frais préparés par nos chefs experts.', '28 Avenue des Champs-Élysées', 'Paris', '01 45 62 34 56', 'reservation@sakura-sushi.fr', 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800', '["Japonais", "Sushi", "Asiatique"]', true, true, 4.8, 89),
  ('rest_3', 'La Pizzeria Napoli', 'Pizzas napolitaines cuites au feu de bois, dans la pure tradition italienne.', '42 Rue de Rivoli', 'Paris', '01 40 28 15 73', 'bonjour@pizzeria-napoli.fr', 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800', '["Italien", "Pizza"]', true, true, 4.2, 203);

-- Ajouter des tables pour chaque restaurant
INSERT INTO public.tables (id, restaurant_id, name, seats, zone, is_joinable)
VALUES
  ('table_1', 'rest_1', 'Table 1', 2, 'main', true),
  ('table_2', 'rest_1', 'Table 2', 2, 'main', true),
  ('table_3', 'rest_1', 'Table 3', 4, 'main', true),
  ('table_4', 'rest_1', 'Table 4', 4, 'main', false),
  ('table_5', 'rest_1', 'Table 5', 6, 'main', false),
  ('table_6', 'rest_2', 'Comptoir 1', 2, 'main', false),
  ('table_7', 'rest_2', 'Comptoir 2', 2, 'main', false),
  ('table_8', 'rest_2', 'Table Tatami', 4, 'private', false),
  ('table_9', 'rest_3', 'Table 1', 4, 'main', true),
  ('table_10', 'rest_3', 'Table 2', 4, 'main', true),
  ('table_11', 'rest_3', 'Terrasse', 8, 'terrace', false);

-- Ajouter des horaires
INSERT INTO public.service_schedules (restaurant_id, day_of_week, service_type, is_open, start_time, end_time)
VALUES
  -- Le Petit Bistrot (fermé dimanche)
  ('rest_1', 1, 'MIDI', true, '12:00', '14:30'),
  ('rest_1', 1, 'SOIR', true, '19:00', '22:30'),
  ('rest_1', 2, 'MIDI', true, '12:00', '14:30'),
  ('rest_1', 2, 'SOIR', true, '19:00', '22:30'),
  ('rest_1', 3, 'MIDI', true, '12:00', '14:30'),
  ('rest_1', 3, 'SOIR', true, '19:00', '22:30'),
  ('rest_1', 4, 'MIDI', true, '12:00', '14:30'),
  ('rest_1', 4, 'SOIR', true, '19:00', '22:30'),
  ('rest_1', 5, 'MIDI', true, '12:00', '14:30'),
  ('rest_1', 5, 'SOIR', true, '19:00', '23:00'),
  ('rest_1', 6, 'MIDI', true, '12:00', '15:00'),
  ('rest_1', 6, 'SOIR', true, '19:00', '23:00');

-- Vérification
SELECT * FROM public.restaurants;
