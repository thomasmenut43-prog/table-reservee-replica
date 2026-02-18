
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bictooxiosihmzijddyu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJpY3Rvb3hpb3NpaG16aWpkZHl1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1Nzg4MDUsImV4cCI6MjA4NjE1NDgwNX0.6_AfuprwfOUBQ5bjXnaksRB8ChBAHcHnnYwBVZS74Ng';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkRatings() {
    const { data: restaurants, error } = await supabase
        .from('restaurants')
        .select('id, name, rating_avg, rating_count');

    if (error) {
        console.error('Error fetching restaurants:', error);
        return;
    }

    console.log(`Total restaurants: ${restaurants.length}`);
    const rated = restaurants.filter(r => r.rating_avg > 0);
    console.log(`Rated restaurants (rating > 0): ${rated.length}`);

    if (rated.length === 0) {
        console.log('No rated restaurants found. The "Top Rated" section will be hidden.');
    } else {
        console.log('Rated restaurants:', rated.map(r => `${r.name} (${r.rating_avg}/5)`));
    }
}

checkRatings();
