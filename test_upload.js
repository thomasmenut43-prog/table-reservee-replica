
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Constants from src/lib/supabaseClient.js
const supabaseUrl = 'https://bictooxiosihmzijddyu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJpY3Rvb3hpb3NpaG16aWpkZHl1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1Nzg4MDUsImV4cCI6MjA4NjE1NDgwNX0.6_AfuprwfOUBQ5bjXnaksRB8ChBAHcHnnYwBVZS74Ng';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testUpload() {
    const bucketId = 'images-restaurant'; // Trying the main bucket
    const fileName = `test_upload_${Date.now()}.txt`;
    const fileContent = 'This is a test file to verify Supabase Storage upload.';

    console.log(`Attempting to upload to bucket: "${bucketId}"...`);

    const { data, error } = await supabase.storage
        .from(bucketId)
        .upload(fileName, fileContent, {
            contentType: 'text/plain',
            upsert: false
        });

    if (error) {
        console.error('❌ Upload Failed!');
        console.error('Error Message:', error.message);
        console.error('Error Details:', JSON.stringify(error, null, 2));

        // Check if bucket exists
        console.log('\nChecking if bucket exists...');
        const { data: buckets, error: listError } = await supabase.storage.listBuckets();
        if (listError) {
            console.error('Failed to list buckets:', listError.message);
        } else {
            const bucketExists = buckets.find(b => b.id === bucketId || b.name === bucketId);
            if (bucketExists) {
                console.log(`✅ Bucket "${bucketId}" exists in the list.`);
            } else {
                console.log(`❌ Bucket "${bucketId}" was NOT found in the list.`);
                console.log('Available buckets:', buckets.map(b => b.name));
            }
        }
    } else {
        console.log('✅ Upload Successful!');
        console.log('Path:', data.path);

        // Cleanup
        const { error: removeError } = await supabase.storage.from(bucketId).remove([fileName]);
        if (removeError) console.error('Warning: Failed to cleanup test file:', removeError.message);
        else console.log('Cleanup successful.');
    }
}

testUpload();
