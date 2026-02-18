
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://bictooxiosihmzijddyu.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJpY3Rvb3hpb3NpaG16aWpkZHl1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1Nzg4MDUsImV4cCI6MjA4NjE1NDgwNX0.6_AfuprwfOUBQ5bjXnaksRB8ChBAHcHnnYwBVZS74Ng';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function listBuckets() {
  const { data, error } = await supabase.storage.listBuckets();
  if (error) {
    console.error('Error listing buckets:', error);
  } else {
    console.log('Buckets found:');
    data.forEach(bucket => {
      console.log(`- ID: "${bucket.id}", Name: "${bucket.name}", Public: ${bucket.public}`);
    });
  }
}

listBuckets();
