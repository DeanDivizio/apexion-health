"use server"

import { USDAFoundationFood } from '@/utils/types';
import { USDABrandedFood } from '@/utils/types';
import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.POSTGRES_URL,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DATABASE,
  ssl: false
});

async function USDAPostgresSearch_Foundation(query: string, limit: number = 10): Promise<USDAFoundationFood[]> {
  "use cache"
  try {
    const client = await pool.connect();
    try {
      const result = await client.query(
        `SELECT * FROM foundation_foods WHERE description ILIKE $1 LIMIT $2`,
        [`%${query}%`, limit]
      );
      return result.rows as USDAFoundationFood[];
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error executing query', err);
    throw err;
  }
}

async function USDAPostgresSearch_Branded(query: string, limit: number = 10): Promise<USDABrandedFood[]> {
    "use cache"
    try {
      const client = await pool.connect();
      try {
        // Normalize the query by replacing 'and' with '&' and convert to uppercase
        const normalizedQuery = query.toUpperCase().replace(/\s+AND\s+/g, ' & ');
        
        // Split into search terms, handling both '&' and spaces
        const searchTerms = normalizedQuery.split(/[\s&]+/).filter(term => term.length > 0);
        
        const result = await client.query(
          `SELECT * FROM branded_foods 
           WHERE (
             description ILIKE $1
             OR brand_owner ILIKE $1
             OR (${searchTerms.map((_, i) => `description ILIKE $${i + 2}`).join(' AND ')})
           )
           ORDER BY
             CASE 
               WHEN description ILIKE $1 THEN 1
               WHEN brand_owner ILIKE $1 THEN 2
               ELSE 3
             END
           LIMIT $${searchTerms.length + 2}`,
          [
            `%${normalizedQuery}%`,
            ...searchTerms.map(term => `%${term}%`),
            limit
          ]
        );
        
        return result.rows as USDABrandedFood[];
      } finally {
        client.release();
      }
    } catch (err) {
      console.error('Error executing query', err);
      throw err;
    }
  }

  export async function USDAPostgresSearch(query: string, limit: number = 10) {
    const [foundationResults, brandedResults] = await Promise.all([
      USDAPostgresSearch_Foundation(query, limit),
      USDAPostgresSearch_Branded(query, limit)
    ]);
    return { foundation: foundationResults, branded: brandedResults };
  }