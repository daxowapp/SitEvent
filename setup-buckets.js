const { createClient } = require("@supabase/supabase-js");

require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing supabaseUrl or supabaseKey");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupBuckets() {
  const bucketsToCreate = ['events-media', 'universities', 'university-media', 'university'];
  
  for (const bucketName of bucketsToCreate) {
    console.log(`Checking bucket: ${bucketName}`);
    const { data: getBucket, error: getError } = await supabase.storage.getBucket(bucketName);
    
    if (getError) {
      console.log(`Creating bucket: ${bucketName}`);
      const { data, error } = await supabase.storage.createBucket(bucketName, {
        public: true,
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/svg+xml', 'application/pdf'],
        fileSizeLimit: 52428800 // 50MB
      });
      
      if (error) {
        console.error(`Error creating bucket ${bucketName}:`, error);
      } else {
        console.log(`Successfully created bucket ${bucketName}`);
        
        // Also ensure public policies if possible, though setting public:true should make GET public.
      }
    } else {
      console.log(`Bucket ${bucketName} already exists`);
    }
  }
}

setupBuckets();
