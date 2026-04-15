const { createClient } = require("@supabase/supabase-js");
const { PrismaClient } = require("@prisma/client");

require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY;

const prisma = new PrismaClient();

async function fixAndTest() {
  // Step 1: Add RLS policies for university-files bucket (pre-existing, may lack policies)
  console.log("=== Step 1: Adding RLS policies for university-files bucket ===");
  const policies = [
    `CREATE POLICY "Allow public uploads for university-files" ON storage.objects FOR INSERT TO public WITH CHECK ( bucket_id = 'university-files' );`,
    `CREATE POLICY "Allow public updates for university-files" ON storage.objects FOR UPDATE TO public USING ( bucket_id = 'university-files' );`,
    `CREATE POLICY "Allow public deletes for university-files" ON storage.objects FOR DELETE TO public USING ( bucket_id = 'university-files' );`,
    `CREATE POLICY "Allow public views for university-files" ON storage.objects FOR SELECT TO public USING ( bucket_id = 'university-files' );`,
  ];

  for (const policy of policies) {
    try {
      await prisma.$executeRawUnsafe(policy);
      console.log("  ✅ Policy created");
    } catch (e) {
      if (e.message.includes("already exists")) {
        console.log("  ⏭️  Policy already exists");
      } else {
        console.error("  ❌ Error:", e.message);
      }
    }
  }

  // Step 2: Test upload with ANON key (same as browser) to ALL university buckets
  console.log("\n=== Step 2: Testing image upload with ANON key (browser simulation) ===");
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  // Create a minimal valid PNG (1x1 red pixel)
  const pngBuffer = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
    'base64'
  );

  const buckets = ['events-media', 'universities', 'university-media', 'university', 'university-files'];

  for (const bucketName of buckets) {
    const testPath = `test/test_${Date.now()}.png`;
    console.log(`\n  Testing bucket: ${bucketName}`);
    
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(testPath, pngBuffer, {
        contentType: 'image/png'
      });

    if (error) {
      console.error(`  ❌ FAILED (${bucketName}):`, error.message, `| status: ${error.statusCode || error.status}`);
    } else {
      console.log(`  ✅ SUCCESS (${bucketName}):`, data.path);
      
      const { data: urlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(testPath);
      console.log(`  🔗 URL: ${urlData.publicUrl}`);

      // Cleanup
      await supabase.storage.from(bucketName).remove([testPath]);
    }
  }

  await prisma.$disconnect();
}

fixAndTest().catch(console.error);
