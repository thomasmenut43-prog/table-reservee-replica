// Local Storage Service - Replaces Base44 entities
// Provides CRUD operations persisted to localStorage

import { mockData } from './mockData.js';
import { supabase, supabaseAuth, getUserRole } from '@/lib/supabaseClient';

const STORAGE_PREFIX = 'table_reservee_';

// Initialize with mock data if empty (SYNCHRONOUS)
const initializeStorage = () => {
  const initialized = localStorage.getItem(`${STORAGE_PREFIX}initialized`);
  if (!initialized) {
    Object.entries(mockData).forEach(([key, data]) => {
      localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(data));
    });
    localStorage.setItem(`${STORAGE_PREFIX}initialized`, 'true');
    console.log('LocalStorage initialized with mock data');
  }
};

// Initialize immediately
if (typeof window !== 'undefined') {
  initializeStorage();
}

// Generic CRUD operations
const createEntityService = (entityName) => {
  const storageKey = `${STORAGE_PREFIX}${entityName}`;

  const service = {
    // Subscribe to changes (mock - just calls callback once with current data)
    subscribe: (callback) => {
      // Get current data and call callback immediately
      const data = localStorage.getItem(storageKey);
      const items = data ? JSON.parse(data) : [];
      setTimeout(() => callback(items), 0);

      // Return unsubscribe function (no-op since we don't have real-time)
      return () => { };
    },

    // List all items with optional sorting and limit
    list: async (sortBy = null, limit = null) => {
      const data = localStorage.getItem(storageKey);
      let items = data ? JSON.parse(data) : [];

      // Apply sorting if provided
      if (sortBy && typeof sortBy === 'string') {
        const desc = sortBy.startsWith('-');
        const field = desc ? sortBy.slice(1) : sortBy;
        items.sort((a, b) => {
          const aVal = a[field] || '';
          const bVal = b[field] || '';
          if (desc) return bVal > aVal ? 1 : -1;
          return aVal > bVal ? 1 : -1;
        });
      }

      // Apply limit if provided
      if (limit && typeof limit === 'number') {
        items = items.slice(0, limit);
      }

      return items;
    },

    // Filter items by criteria
    filter: async (criteria = {}, sortBy = null, limit = null) => {
      const data = localStorage.getItem(storageKey);
      let items = data ? JSON.parse(data) : [];

      // Apply filters
      if (criteria && Object.keys(criteria).length > 0) {
        items = items.filter(item => {
          return Object.entries(criteria).every(([key, value]) => {
            if (value === undefined || value === null) return true;
            return item[key] === value;
          });
        });
      }

      // Apply sorting
      if (sortBy && typeof sortBy === 'string') {
        const desc = sortBy.startsWith('-');
        const field = desc ? sortBy.slice(1) : sortBy;
        items.sort((a, b) => {
          const aVal = a[field] || '';
          const bVal = b[field] || '';
          if (desc) return bVal > aVal ? 1 : -1;
          return aVal > bVal ? 1 : -1;
        });
      }

      // Apply limit
      if (limit && typeof limit === 'number') {
        items = items.slice(0, limit);
      }

      return items;
    },

    // Get single item by ID
    get: async (id) => {
      const items = await service.list();
      return items.find(item => item.id === id);
    },

    // Create new item
    create: async (data) => {
      const items = await service.list();
      const newItem = {
        ...data,
        id: data.id || `${entityName}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        created_date: new Date().toISOString(),
        updated_date: new Date().toISOString()
      };
      items.push(newItem);
      localStorage.setItem(storageKey, JSON.stringify(items));
      return newItem;
    },

    // Update item
    update: async (id, data) => {
      const items = await service.list();
      const index = items.findIndex(item => item.id === id);
      if (index !== -1) {
        items[index] = {
          ...items[index],
          ...data,
          updated_date: new Date().toISOString()
        };
        localStorage.setItem(storageKey, JSON.stringify(items));
        return items[index];
      }
      throw new Error(`Item ${id} not found`);
    },

    // Delete item
    delete: async (id) => {
      const items = await service.list();
      const filtered = items.filter(item => item.id !== id);
      localStorage.setItem(storageKey, JSON.stringify(filtered));
      return true;
    }
  };

  return service;
};

// Export entity services matching Base44 structure
export const entities = {
  Restaurant: createEntityService('Restaurant'),
  Reservation: createEntityService('Reservation'),
  Table: createEntityService('Table'),
  FloorPlan: createEntityService('FloorPlan'),
  MapObject: createEntityService('MapObject'),
  ServiceSchedule: createEntityService('ServiceSchedule'),
  TableBlock: createEntityService('TableBlock'),
  Review: createEntityService('Review'),
  PlatformSettings: createEntityService('PlatformSettings'),
  Subscription: createEntityService('Subscription'),
  AuditLog: createEntityService('AuditLog'),
  User: createEntityService('User'),
  WaitlistRequest: createEntityService('WaitlistRequest')
};

// Auth service - Using Supabase Auth with persistent sessions
export const auth = {
  currentUser: null,

  isAuthenticated: async () => {
    return await supabaseAuth.isAuthenticated();
  },

  me: async () => {
    try {
      const session = await supabaseAuth.getSession();
      if (session?.user) {
        const role = getUserRole(session.user.email);
        return {
          id: session.user.id,
          email: session.user.email,
          full_name: session.user.user_metadata?.full_name || session.user.email.split('@')[0],
          role: role,
          restaurantId: session.user.user_metadata?.restaurantId || null,
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
    const role = getUserRole(email);
    auth.currentUser = {
      id: user.id,
      email: user.email,
      full_name: user.user_metadata?.full_name || user.email.split('@')[0],
      role: role,
      restaurantId: user.user_metadata?.restaurantId || null,
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

// Functions service (replaces serverless functions)
export const functions = {
  invoke: async (functionName, params) => {
    // Handle PDF generation locally
    if (functionName === 'generateReservationPDF') {
      const { generateReservationPDF } = await import('./pdfGenerator.js');
      return generateReservationPDF(params);
    }
    console.warn(`Function ${functionName} not implemented locally`);
    return null;
  }
};

// Main export matching base44 client structure
export const db = {
  entities,
  auth,
  functions
};

export default db;
