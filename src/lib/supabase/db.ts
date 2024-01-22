import { migrate } from "drizzle-orm/postgres-js/migrator"
import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import * as schema from '../../../migrations/schema';

if (!process.env.DATABASE_URL) {
    console.log("No database URL")
}

const client = postgres(process.env.DATABASE_URL as string, { max: 1 })
const db = drizzle(client, { schema })

const migrateDB = async () => {
    try {
      console.log('Migrating client')
      await migrate(db, { migrationsFolder: 'migrations' })
      console.log('Succesfully Migrated!')
    } catch (error) {
      console.log('Error Migrating client')
    }
}

// migrateDB()

export default db