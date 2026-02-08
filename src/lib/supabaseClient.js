import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://bictooxiosihmzijddyu.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJpY3Rvb3hpb3NpaG16aWpkZHl1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1Nzg4MDUsImV4cCI6MjA4NjE1NDgwNX0.6_AfuprwfOUBQ5bjXnaksRB8ChBAHcHnnYwBVZS74Ng'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Auth helper functions
export const supabaseAuth = {
    // Get current user
    getUser: async () => {
        const { data: { user }, error } = await supabase.auth.getUser()
        if (error) throw error
        return user
    },

    // Get current session
    getSession: async () => {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) throw error
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
                data: metadata
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
