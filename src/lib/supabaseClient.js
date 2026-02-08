import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://bictooxiosihmzijddyu.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJpY3Rvb3hpb3NpaG16aWpkZHl1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1Nzg4MDUsImV4cCI6MjA4NjE1NDgwNX0.6_AfuprwfOUBQ5bjXnaksRB8ChBAHcHnnYwBVZS74Ng'

// Admin email - the only admin for now
export const ADMIN_EMAIL = 'thomas.menut43@gmail.com'

// Create Supabase client with persistent session
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'restoponot-auth'
    }
})

// Helper function to get user role based on email
export const getUserRole = (email) => {
    if (email === ADMIN_EMAIL) {
        return 'admin'
    }
    return 'restaurateur'
}

// Auth helper functions
export const supabaseAuth = {
    // Get current user
    getUser: async () => {
        const { data: { user }, error } = await supabase.auth.getUser()
        if (error) return null
        return user
    },

    // Get current session
    getSession: async () => {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) return null
        return session
    },

    // Sign in with email/password
    signIn: async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        })
        if (error) throw error
        return data.user
    },

    // Sign up with email/password
    signUp: async (email, password, metadata = {}) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    ...metadata,
                    role: getUserRole(email)
                }
            }
        })
        if (error) throw error
        return data.user
    },

    // Sign out
    signOut: async () => {
        const { error } = await supabase.auth.signOut()
        if (error) throw error
    },

    // Listen to auth state changes
    onAuthStateChange: (callback) => {
        return supabase.auth.onAuthStateChange((event, session) => {
            callback(event, session)
        })
    },

    // Check if authenticated
    isAuthenticated: async () => {
        const { data: { session } } = await supabase.auth.getSession()
        return !!session
    }
}

// ========================================
// User Management Functions (for Backoffice)
// ========================================

export const userManagement = {
    // Create a new user with profile (uses signUp - user will receive confirmation email)
    createUserWithProfile: async (email, password, userData = {}) => {
        // 1. Create auth user via signUp
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: userData.full_name || email.split('@')[0],
                    role: userData.role || 'restaurateur',
                    restaurant_id: userData.restaurantId || null
                },
                emailRedirectTo: window.location.origin
            }
        })

        if (authError) throw authError

        // Note: Profile will be created automatically by the database trigger
        // But we return user info for immediate UI feedback
        return {
            id: authData.user?.id,
            email: email,
            full_name: userData.full_name || email.split('@')[0],
            role: userData.role || 'restaurateur',
            restaurantId: userData.restaurantId || null,
            needsEmailConfirmation: !authData.session // If no session, email confirmation needed
        }
    },

    // Get all profiles (for admin listing)
    getProfiles: async () => {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false })

        if (error) throw error
        return data || []
    },

    // Get profile by user ID
    getProfileById: async (userId) => {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single()

        if (error) throw error
        return data
    },

    // Get profile by email
    getProfileByEmail: async (email) => {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('email', email)
            .single()

        if (error && error.code !== 'PGRST116') throw error // PGRST116 = not found
        return data
    },

    // Update profile
    updateProfile: async (userId, updates) => {
        const { data, error } = await supabase
            .from('profiles')
            .update({
                ...updates,
                updated_at: new Date().toISOString()
            })
            .eq('id', userId)
            .select()
            .single()

        if (error) throw error
        return data
    },

    // Disable/Enable user
    toggleUserDisabled: async (userId, isDisabled) => {
        const { data, error } = await supabase
            .from('profiles')
            .update({
                is_disabled: isDisabled,
                updated_at: new Date().toISOString()
            })
            .eq('id', userId)
            .select()
            .single()

        if (error) throw error
        return data
    },

    // Assign restaurant to user
    assignRestaurant: async (userId, restaurantId) => {
        const { data, error } = await supabase
            .from('profiles')
            .update({
                restaurant_id: restaurantId,
                updated_at: new Date().toISOString()
            })
            .eq('id', userId)
            .select()
            .single()

        if (error) throw error
        return data
    }
}
