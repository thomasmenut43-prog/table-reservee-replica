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
  floorPlanId: 'floor_plan_id',
  isJoinable: 'is_joinable',
  isActive: 'is_active',
  // FloorPlan fields
  isDefault: 'is_default',
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
  is_disabled: 'is_disabled',
  subscriptionStatus: 'subscription_status',
  subscriptionEndDate: 'subscription_end_date',
  // TableBlock fields
  tableId: 'table_id',
  startDateTime: 'start_datetime',
  endDateTime: 'end_datetime',
  // MapObject fields
  positionX: 'position_x',
  positionY: 'position_y'
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
const fromSupabase = (data, tableName = null) => {
  if (!data) return null;
  const result = {};
  const reverseMap = Object.fromEntries(
    Object.entries(fieldNameMap).map(([k, v]) => [v, k])
  );
  for (const [key, value] of Object.entries(data)) {
    const newKey = reverseMap[key] || key;
    result[newKey] = value;
  }
  if (tableName === 'table_blocks') {
    if (result.start_date && !result.startDateTime) result.startDateTime = `${result.start_date}T00:00:00.000Z`;
    if (result.end_date && !result.endDateTime) result.endDateTime = `${result.end_date}T23:59:59.999Z`;
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
      return (data || []).map(d => fromSupabase(d, tableName));
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
      return (data || []).map(d => fromSupabase(d, tableName));
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
      return fromSupabase(data, tableName);
    },

    // Create new item
    create: async (data) => {
      let supabaseData = toSupabase(data);
      // Remove id if not provided (let Supabase generate it)
      if (!supabaseData.id) {
        delete supabaseData.id;
      }
      // floor_plans: n'envoyer que les colonnes de base (compatibilité si is_default absent)
      if (tableName === 'floor_plans') {
        supabaseData = {
          restaurant_id: supabaseData.restaurant_id,
          name: supabaseData.name ?? 'Plan'
        };
      }

      let result = await supabase
        .from(tableName)
        .insert(supabaseData)
        .select()
        .single();

      // tables: si erreur schema (ex. colonne floor_plan_id absente), réessayer avec colonnes de base uniquement
      if (tableName === 'tables' && result.error && (result.error.message?.includes('floor_plan_id') || result.error.message?.includes('schema cache'))) {
        const minimal = {
          restaurant_id: supabaseData.restaurant_id,
          name: supabaseData.name ?? 'Table',
          seats: supabaseData.seats ?? 2,
          zone: supabaseData.zone ?? 'main',
          is_joinable: supabaseData.is_joinable ?? false,
          position_x: supabaseData.position_x ?? 0,
          position_y: supabaseData.position_y ?? 0
        };
        result = await supabase.from(tableName).insert(minimal).select().single();
      }

      // table_blocks: si start_datetime/end_datetime absents, envoyer start_date/end_date (date seule)
      if (tableName === 'table_blocks' && result.error && (result.error.message?.includes('start_datetime') || result.error.message?.includes('schema cache'))) {
        const legacy = {
          restaurant_id: supabaseData.restaurant_id,
          table_id: supabaseData.table_id,
          start_date: data.startDateTime ? String(data.startDateTime).slice(0, 10) : null,
          end_date: data.endDateTime ? String(data.endDateTime).slice(0, 10) : null,
          reason: supabaseData.reason ?? null
        };
        result = await supabase.from(tableName).insert(legacy).select().single();
      }

      if (result.error) {
        console.error(`Error creating ${tableName}:`, result.error);
        throw result.error;
      }
      return fromSupabase(result.data, tableName);
    },

    // Update item
    update: async (id, data) => {
      const supabaseData = toSupabase(data);
      const noUpdatedAt = ['tables', 'map_objects', 'table_blocks', 'floor_plans', 'service_schedules', 'reviews'];
      if (!noUpdatedAt.includes(tableName)) {
        supabaseData.updated_at = new Date().toISOString();
      }

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
      return fromSupabase(updated, tableName);
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

// MapObject: fallback localStorage si la table Supabase map_objects n'existe pas
const MAP_OBJECTS_STORAGE_KEY = 'table_reservee_MapObject';
const isMapObjectsTableError = (err) =>
  err?.message?.includes('schema cache') || err?.message?.includes('map_objects');

const getMapObjectsFromStorage = () => {
  try {
    const raw = localStorage.getItem(MAP_OBJECTS_STORAGE_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
};

const setMapObjectsInStorage = (items) => {
  localStorage.setItem(MAP_OBJECTS_STORAGE_KEY, JSON.stringify(items));
};

const createMapObjectEntityService = () => {
  const tableName = 'map_objects';
  const base = createSupabaseEntityService('MapObject');

  return {
    subscribe: base.subscribe,
    list: async (sortBy, limit) => {
      const { data, error } = await supabase.from(tableName).select('*');
      if (error && isMapObjectsTableError(error)) return getMapObjectsFromStorage();
      if (error) {
        console.error(`Error listing ${tableName}:`, error);
        return [];
      }
      return (data || []).map(d => fromSupabase(d, tableName));
    },
    filter: async (criteria = {}, sortBy, limit) => {
      let query = supabase.from(tableName).select('*');
      for (const [key, value] of Object.entries(criteria)) {
        if (value !== undefined && value !== null) {
          const mappedKey = fieldNameMap[key] || key;
          query = query.eq(mappedKey, value);
        }
      }
      const { data, error } = await query;
      if (error && isMapObjectsTableError(error)) {
        let items = getMapObjectsFromStorage();
        for (const [key, value] of Object.entries(criteria)) {
          if (value !== undefined && value !== null) {
            items = items.filter(item => item[fieldNameMap[key] || key] === value || item[key] === value);
          }
        }
        return items;
      }
      if (error) {
        console.error(`Error filtering ${tableName}:`, error);
        return [];
      }
      return (data || []).map(d => fromSupabase(d, tableName));
    },
    get: async (id) => {
      try {
        return await base.get(id);
      } catch (err) {
        if (isMapObjectsTableError(err)) {
          const items = getMapObjectsFromStorage();
          return items.find(item => item.id === id) || null;
        }
        throw err;
      }
    },
    create: async (data) => {
      const supabaseData = toSupabase(data);
      if (!supabaseData.id) delete supabaseData.id;
      // map_objects attend des INTEGER pour position_x, position_y, width, height, rotation
      ['position_x', 'position_y', 'width', 'height', 'rotation'].forEach((k) => {
        if (supabaseData[k] != null && typeof supabaseData[k] === 'number') {
          supabaseData[k] = Math.round(supabaseData[k]);
        }
      });
      let result = await supabase.from(tableName).insert(supabaseData).select().single();
      if (result.error && isMapObjectsTableError(result.error)) {
        const items = getMapObjectsFromStorage();
        const newItem = {
          ...data,
          id: data.id || `obj_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
        };
        items.push(newItem);
        setMapObjectsInStorage(items);
        return fromSupabase(newItem, tableName);
      }
      if (result.error) throw result.error;
      return fromSupabase(result.data, tableName);
    },
    update: async (id, data) => {
      const toUpdate = { ...data };
      ['position_x', 'position_y', 'positionX', 'positionY', 'width', 'height', 'rotation'].forEach((k) => {
        if (toUpdate[k] != null && typeof toUpdate[k] === 'number') {
          toUpdate[k] = Math.round(toUpdate[k]);
        }
      });
      try {
        return await base.update(id, toUpdate);
      } catch (err) {
        if (isMapObjectsTableError(err)) {
          const items = getMapObjectsFromStorage();
          const idx = items.findIndex(item => item.id === id);
          if (idx === -1) throw new Error(`Item ${id} not found`);
          const updated = { ...items[idx], ...toSupabase(data) };
          items[idx] = updated;
          setMapObjectsInStorage(items);
          return fromSupabase(updated, tableName);
        }
        throw err;
      }
    },
    delete: async (id) => {
      try {
        return await base.delete(id);
      } catch (err) {
        if (isMapObjectsTableError(err)) {
          const items = getMapObjectsFromStorage().filter(item => item.id !== id);
          setMapObjectsInStorage(items);
          return true;
        }
        throw err;
      }
    }
  };
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
  MapObject: createMapObjectEntityService(),
  ServiceSchedule: createSupabaseEntityService('ServiceSchedule'),
  TableBlock: createSupabaseEntityService('TableBlock'),
  Review: createSupabaseEntityService('Review'),
  PlatformSettings: createSupabaseEntityService('PlatformSettings'),
  Subscription: createLocalStorageEntityService('Subscription'),
  AuditLog: createLocalStorageEntityService('AuditLog'),
  User: createSupabaseEntityService('User'),
  WaitlistRequest: createLocalStorageEntityService('WaitlistRequest'),
  LegalContent: createLocalStorageEntityService('LegalContent')
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
        // Get role and subscription from profiles table (source de vérité pour l'abonnement)
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, restaurant_id, full_name, subscription_status, subscription_end_date, subscription_plan')
          .eq('id', session.user.id)
          .single();

        return {
          id: session.user.id,
          email: session.user.email,
          full_name: profile?.full_name || session.user.email.split('@')[0],
          role: profile?.role || getUserRole(session.user.email),
          restaurantId: profile?.restaurant_id || null,
          subscriptionStatus: profile?.subscription_status ?? session.user.user_metadata?.subscriptionStatus ?? null,
          subscriptionEndDate: profile?.subscription_end_date ?? session.user.user_metadata?.subscriptionEndDate ?? null,
          subscriptionPlan: profile?.subscription_plan ?? session.user.user_metadata?.subscriptionPlan ?? null
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

    // Get role and subscription from profiles table (source de vérité)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, restaurant_id, full_name, subscription_status, subscription_end_date, subscription_plan')
      .eq('id', user.id)
      .single();

    auth.currentUser = {
      id: user.id,
      email: user.email,
      full_name: profile?.full_name || user.email.split('@')[0],
      role: profile?.role || getUserRole(email),
      restaurantId: profile?.restaurant_id || null,
      subscriptionStatus: profile?.subscription_status ?? user.user_metadata?.subscriptionStatus ?? null,
      subscriptionEndDate: profile?.subscription_end_date ?? user.user_metadata?.subscriptionEndDate ?? null,
      subscriptionPlan: profile?.subscription_plan ?? user.user_metadata?.subscriptionPlan ?? null
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

  /** Inscription : crée un utilisateur auth + profil (via trigger DB) */
  signUp: async (email, password, metadata = {}) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          ...metadata,
          full_name: metadata.full_name || email.split('@')[0],
          role: metadata.role || 'restaurateur'
        }
      }
    });
    if (error) throw error;
    return data.user;
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
