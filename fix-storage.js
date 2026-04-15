const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  console.log("Setting up Supabase Storage policies...");

  const policies = [
    // Create policies for the buckets
    `
    CREATE POLICY "Allow public uploads for events-media" 
    ON storage.objects FOR INSERT 
    TO public 
    WITH CHECK ( bucket_id = 'events-media' );
    `,
    `
    CREATE POLICY "Allow public updates for events-media" 
    ON storage.objects FOR UPDATE 
    TO public 
    USING ( bucket_id = 'events-media' );
    `,
    `
    CREATE POLICY "Allow public deletes for events-media" 
    ON storage.objects FOR DELETE 
    TO public 
    USING ( bucket_id = 'events-media' );
    `,
    `
    CREATE POLICY "Allow public views for events-media" 
    ON storage.objects FOR SELECT 
    TO public 
    USING ( bucket_id = 'events-media' );
    `,

    // university media buckets
    `
    CREATE POLICY "Allow public uploads for universities" 
    ON storage.objects FOR INSERT TO public WITH CHECK ( bucket_id = 'universities' );
    `,
    `
    CREATE POLICY "Allow public updates for universities" 
    ON storage.objects FOR UPDATE TO public USING ( bucket_id = 'universities' );
    `,
    `
    CREATE POLICY "Allow public deletes for universities" 
    ON storage.objects FOR DELETE TO public USING ( bucket_id = 'universities' );
    `,
    `
    CREATE POLICY "Allow public views for universities" 
    ON storage.objects FOR SELECT TO public USING ( bucket_id = 'universities' );
    `,

    `
    CREATE POLICY "Allow public uploads for university-media" 
    ON storage.objects FOR INSERT TO public WITH CHECK ( bucket_id = 'university-media' );
    `,
    `
    CREATE POLICY "Allow public updates for university-media" 
    ON storage.objects FOR UPDATE TO public USING ( bucket_id = 'university-media' );
    `,
    `
    CREATE POLICY "Allow public deletes for university-media" 
    ON storage.objects FOR DELETE TO public USING ( bucket_id = 'university-media' );
    `,
    `
    CREATE POLICY "Allow public views for university-media" 
    ON storage.objects FOR SELECT TO public USING ( bucket_id = 'university-media' );
    `,
    
    `
    CREATE POLICY "Allow public uploads for university" 
    ON storage.objects FOR INSERT TO public WITH CHECK ( bucket_id = 'university' );
    `,
    `
    CREATE POLICY "Allow public updates for university" 
    ON storage.objects FOR UPDATE TO public USING ( bucket_id = 'university' );
    `,
    `
    CREATE POLICY "Allow public deletes for university" 
    ON storage.objects FOR DELETE TO public USING ( bucket_id = 'university' );
    `,
    `
    CREATE POLICY "Allow public views for university" 
    ON storage.objects FOR SELECT TO public USING ( bucket_id = 'university' );
    `
  ];

  for (const policy of policies) {
    try {
      await prisma.$executeRawUnsafe(policy);
      console.log("Successfully executed policy.");
    } catch (e) {
      if (e.message.includes("already exists")) {
        console.log("Policy already exists, skipping...");
      } else {
        console.error("Error executing policy:", e.message);
      }
    }
  }

  console.log("Done configuring storage policies.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
