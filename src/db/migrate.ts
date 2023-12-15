import { migrate } from 'drizzle-orm/vercel-postgres/migrator';
import { db } from '@/db/client';

(async () => {
    try {
        console.info('Migrations started...');
        await migrate(db, { migrationsFolder: 'drizzle' });
        console.log('✅ Migrations completed successfully!');
    } catch (error) {
        console.error('❌', error);
        process.exit(1);
    }
})();
