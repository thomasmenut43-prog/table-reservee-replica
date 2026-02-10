// Supabase Database Service - Replaces localStorage with Supabase
// Provides CRUD operations persisted to Supabase database

import { supabase, supabaseAuth, getUserRole } from '@/lib/supabaseClient';

// Map entity names to Supabase table names (camelCase to snake_case)
const tableNameMap = {
  Restaurant: 'restaurants',
  Reservation: 'reservations',
  Table: 'tables',
  FloorPlan: 'floor_plans',
  MapObject: 'map_objects',
  ServiceSchedule: 'service_schedules',
  TableBlock: 'table_blocks',
  Review: 'reviews',
  PlatformSettings: 'platform_settings',
  Subscription: 'subscriptions',
  AuditLog: 'audit_logs',
  User: 'profiles', // Users are stored in profiles table
  WaitlistRequest: 'waitlist_requests'
};

// Map JS field names to Supabase column names
const fieldNameMap = {
  // Restaurant fields
  coverPhoto: 'cover_photo',
  cuisineTags: 'cuisine_tags',
  isActive: 'is_active',
  onlineBookingEnabled: 'online_booking_enabled',
  autoConfirmEnabled: 'auto_confirm_enabled',
  mealDurationMinutes: 'meal_duration_minutes',
  slotIntervalMinutes: 'slot_interval_minutes',
  minAdvanceMinutes: 'min_advance_minutes',
  bookingWindowDays: 'booking_window_days',
  groupPendingThreshold: 'group_pending_threshold',
  tableJoiningEnabled: 'table_joining_enabled',
  depositEnabled: 'deposit_enabled',
  ratingAvg: 'rating_avg',
  ratingCount: 'rating_count',
  postalCode: 'postal_code',
  ownerId: 'owner_id',
  created_date: 'created_at',
  updated_date: 'updated_at',
  // Table fields
  restaurantId: 'restaurant_id',
  isJoinable: 'is_joinable',
  position_x: 'position_x',
  position_y: 'position_y',
  // Schedule fields
  dayOfWeek: 'day_of_week',
  serviceType: 'service_type',
  isOpen: 'is_open',
  startTime: 'start_time',
  endTime: 'end_time',
  // Reservation fields
  tableIds: 'table_ids',
  firstName: 'first_name',
  lastName: 'last_name',
  guestsCount: 'guests_count',
  dateTimeStart: 'date_time_start',
  dateTimeEnd: 'date_time_end',
  // Review fields
  authorName: 'author_name',
  // Settings fields
  settingKey: 'setting_key',
  logoUrl: 'logo_url',
  heroTitle: 'hero_title',
  heroSubtitle: 'hero_subtitle',
  heroDescription: 'hero_description',
  bannerAdUrl: 'banner_ad_url',
  bannerAdLink: 'banner_ad_link',
  // Profile fields
  full_name: 'full_name',
  is_disabled: 'is_disabled'
};

// Convert JS object to Supabase format
const toSupabase = (data) => {
  const result = {};
  for (const [key, value] of Object.entries(data)) {
    const newKey = fieldNameMap[key] || key;
    result[newKey] = value;
  }
  return result;
};

// Convert Supabase object to JS format
const fromSupabase = (data) => {
  if (!data) return null;
  const result = {};
  const reverseMap = Object.fromEntries(
    Object.entries(fieldNameMap).map(([k, v]) => [v, k])
  );
  for (const [key, value] of Object.entries(data)) {
    const newKey = reverseMap[key] || key;
    result[newKey] = value;
  }
  return result;
};

// Create entity service for a specific table
const createSupabaseEntityService = (entityName) => {
  const tableName = tableNameMap[entityName];

  if (!tableName) {
    console.warn(`No table mapping for entity: ${entityName}`);
    return createLocalStorageEntityService(entityName);
  }

  const service = {
    // Subscribe to real-time changes
    subscribe: (callback) => {
      const channel = supabase
        .channel(`${tableName}-changes`)
        .on('postgres_changes',
          { event: '*', schema: 'public', table: tableName },
          (payload) => {
            service.list().then(callback);
          }
        )
        .subscribe();

      // Return initial data
      service.list().then(callback);

      // Return unsubscribe function
      return () => {
        supabase.removeChannel(channel);
      };
    },

    // List all items
    list: async (sortBy = null, limit = null) => {
      let query = supabase.from(tableName).select('*');

      if (sortBy) {
        const desc = sortBy.startsWith('-');
        const field = desc ? sortBy.slice(1) : sortBy;
        const mappedField = fieldNameMap[field] || field;
        query = query.order(mappedField, { ascending: !desc });
      }

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;
      if (error) {
        console.error(`Error listing ${tableName}:`, error);
        return [];
      }
      return (data || []).map(fromSupabase);
    },

    // Filter items by criteria
    filter: async (criteria = {}, sortBy = null, limit = null) => {
      let query = supabase.from(tableName).select('*');

      // Apply filters
      for (const [key, value] of Object.entries(criteria)) {
        if (value !== undefined && value !== null) {
          const mappedKey = fieldNameMap[key] || key;
          query = query.eq(mappedKey, value);
        }
      }

      if (sortBy) {
        const desc = sortBy.startsWith('-');
        const field = desc ? sortBy.slice(1) : sortBy;
        const mappedField = fieldNameMap[field] || field;
        query = query.order(mappedField, { ascending: !desc });
      }

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;
      if (error) {
        console.error(`Error filtering ${tableName}:`, error);
        return [];
      }
      return (data || []).map(fromSupabase);
    },

    // Get single item by ID
    get: async (id) => {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error(`Error getting ${tableName}:`, error);
        return null;
      }
      return fromSupabase(data);
    },

    // Create new item
    create: async (data) => {
      const supabaseData = toSupabase(data);
      // Remove id if not provided (let Supabase generate it)
      if (!supabaseData.id) {
        delete supabaseData.id;
      }

      const { data: created, error } = await supabase
        .from(tableName)
        .insert(supabaseData)
        .select()
        .single();

      if (error) {
        console.error(`Error creating ${tableName}:`, error);
        throw error;
      }
      return fromSupabase(created);
    },

    // Update item
    update: async (id, data) => {
      const supabaseData = toSupabase(data);
      supabaseData.updated_at = new Date().toISOString();

      const { data: updated, error } = await supabase
        .from(tableName)
        .update(supabaseData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error(`Error updating ${tableName}:`, error);
        throw error;
      }
      return fromSupabase(updated);
    },

    // Delete item
    delete: async (id) => {
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', id);

      if (error) {
        console.error(`Error deleting ${tableName}:`, error);
        throw error;
      }
      return true;
    }
  };

  return service;
};

// Fallback localStorage service for unmapped entities
const createLocalStorageEntityService = (entityName) => {
  const STORAGE_PREFIX = 'table_reservee_';
  const storageKey = `${STORAGE_PREFIX}${entityName}`;

  return {
    subscribe: (callback) => {
      const data = localStorage.getItem(storageKey);
      const items = data ? JSON.parse(data) : [];
      setTimeout(() => callback(items), 0);
      return () => { };
    },
    list: async () => {
      const data = localStorage.getItem(storageKey);
      return data ? JSON.parse(data) : [];
    },
    filter: async (criteria = {}) => {
      const items = await this.list();
      return items.filter(item =>
        Object.entries(criteria).every(([k, v]) => item[k] === v)
      );
    },
    get: async (id) => {
      const items = await this.list();
      return items.find(item => item.id === id);
    },
    create: async (data) => {
      const items = await this.list();
      const newItem = { ...data, id: data.id || `${entityName}_${Date.now()}` };
      items.push(newItem);
      localStorage.setItem(storageKey, JSON.stringify(items));
      return newItem;
    },
    update: async (id, data) => {
      const items = await this.list();
      const index = items.findIndex(item => item.id === id);
      if (index !== -1) {
        items[index] = { ...items[index], ...data };
        localStorage.setItem(storageKey, JSON.stringify(items));
        return items[index];
      }
      throw new Error(`Item ${id} not found`);
    },
    delete: async (id) => {
      const items = await this.list();
      const filtered = items.filter(item => item.id !== id);
      localStorage.setItem(storageKey, JSON.stringify(filtered));
      return true;
    }
  };
};

// Export entity services
export const entities = {
  Restaurant: createSupabaseEntityService('Restaurant'),
  Reservation: createSupabaseEntityService('Reservation'),
  Table: createSupabaseEntityService('Table'),
  FloorPlan: createSupabaseEntityService('FloorPlan'),
  MapObject: createLocalStorageEntityService('MapObject'), // Keep in localStorage
  ServiceSchedule: createSupabaseEntityService('ServiceSchedule'),
  TableBlock: createSupabaseEntityService('TableBlock'),
  Review: createSupabaseEntityService('Review'),
  PlatformSettings: createSupabaseEntityService('PlatformSettings'),
  Subscription: createLocalStorageEntityService('Subscription'),
  AuditLog: createLocalStorageEntityService('AuditLog'),
  User: createSupabaseEntityService('User'),
  WaitlistRequest: createLocalStorageEntityService('WaitlistRequest')
};

// Auth service - Using Supabase Auth
export const auth = {
  currentUser: null,

  isAuthenticated: async () => {
    return await supabaseAuth.isAuthenticated();
  },

  me: async () => {
    try {
      const session = await supabaseAuth.getSession();
      if (session?.user) {
        // Get role from profiles table
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, restaurant_id, full_name')
          .eq('id', session.user.id)
          .single();

        return {
          id: session.user.id,
          email: session.user.email,
          full_name: profile?.full_name || session.user.email.split('@')[0],
          role: profile?.role || getUserRole(session.user.email),
          restaurantId: profile?.restaurant_id || null,
          subscriptionStatus: session.user.user_metadata?.subscriptionStatus || null,
          subscriptionEndDate: session.user.user_metadata?.subscriptionEndDate || null
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting user:', error);
      return null;
    }
  },

  login: async (email, password) => {
    const user = await supabaseAuth.signIn(email, password);

    // Get role from profiles table
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, restaurant_id, full_name')
      .eq('id', user.id)
      .single();

    auth.currentUser = {
      id: user.id,
      email: user.email,
      full_name: profile?.full_name || user.email.split('@')[0],
      role: profile?.role || getUserRole(email),
      restaurantId: profile?.restaurant_id || null,
      subscriptionStatus: user.user_metadata?.subscriptionStatus || null,
      subscriptionEndDate: user.user_metadata?.subscriptionEndDate || null
    };
    return auth.currentUser;
  },

  logout: async () => {
    await supabaseAuth.signOut();
    auth.currentUser = null;
    window.location.href = '/';
  },

  /** Connexion via Google (OAuth). Redirige vers Google puis revient sur l'app. */
  loginWithGoogle: async () => {
    await supabaseAuth.signInWithOAuth('google');
  },

  /** Connexion via Apple (OAuth). Redirige vers Apple puis revient sur l'app. */
  loginWithApple: async () => {
    await supabaseAuth.signInWithOAuth('apple');
  },

  redirectToLogin: (returnUrl) => {
    window.location.href = '/';
  },

  updateMe: async (data) => {
    const { data: updatedUser, error } = await supabase.auth.updateUser({
      data: data
    });
    if (error) throw error;
    return updatedUser;
  }
};

// Functions service
export const functions = {
  invoke: async (functionName, params) => {
    if (functionName === 'generateReservationPDF') {
      const { generateReservationPDF } = await import('./pdfGenerator.js');
      return generateReservationPDF(params);
    }
    console.warn(`Function ${functionName} not implemented locally`);
    return null;
  }
};

// Main export
export const db = {
  entities,
  auth,
  functions
};

export default db;
