"use server"

import { FoodItem } from '@/utils/newtypes';
import { Pool } from 'pg';
import { unstable_cacheTag as cacheTag, unstable_cacheLife as cacheLife  } from 'next/cache';
const pool = new Pool({
  host: process.env.POSTGRES_URL,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DATABASE,
  ssl: false
});

async function USDAPostgresSearch_Foundation(query: string, limit: number = 10): Promise<FoodItem[]> {
  "use cache"
  try {
    const client = await pool.connect();
    try {
      const result = await client.query(
        `SELECT * FROM usdafoundation WHERE name ILIKE $1 LIMIT $2`,
        [`%${query}%`, limit]
      );
      return result.rows as FoodItem[];
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error executing query', err);
    throw err;
  }
}

async function USDAPostgresSearch_Branded(query: string, limit: number = 10): Promise<FoodItem[]> {
    "use cache"
    try {
      const client = await pool.connect();
      try {
        // Normalize the query by replacing 'and' with '&', removing apostrophes, and converting to uppercase
        const normalizedQuery = query.toUpperCase()
          .replace(/\s+AND\s+/g, ' & ')
          .replace(/'/g, '');
        
        // Split into search terms, handling both '&' and spaces
        const searchTerms = normalizedQuery.split(/[\s&]+/).filter(term => term.length > 0);
        
        const result = await client.query(
          `WITH scored_results AS (
            SELECT *,
              (
                ${searchTerms.map((_, i) => 
                  `CASE WHEN REPLACE(name, '''', '') ILIKE $${i + 1} THEN 1 ELSE 0 END + 
                   CASE WHEN REPLACE(brand, '''', '') ILIKE $${i + 1} THEN 1 ELSE 0 END`
                ).join(' + ')}
              ) as match_score,
              ${searchTerms.map((_, i) => 
                `CASE WHEN 
                  REPLACE(name, '''', '') ILIKE $${i + 1} OR 
                  REPLACE(brand, '''', '') ILIKE $${i + 1}
                THEN 1 ELSE 0 END as term${i + 1}_match`
              ).join(', ')}
            FROM usdabranded
            WHERE ${searchTerms.map((_, i) => 
              `REPLACE(name, '''', '') ILIKE $${i + 1} OR 
               REPLACE(brand, '''', '') ILIKE $${i + 1}`
            ).join(' OR ')}
          )
          SELECT * FROM scored_results
          WHERE ${searchTerms.map((_, i) => `term${i + 1}_match = 1`).join(' AND ')}
          ORDER BY match_score DESC, name
          LIMIT $${searchTerms.length + 1}`,
          [
            ...searchTerms.map(term => `%${term}%`),
            limit
          ]
        );
        
        return result.rows as FoodItem[];
      } finally {
        client.release();
      }
    } catch (err) {
      console.error('Error executing query', err);
      throw err;
    }
  }

async function USDAPostgresSearch_Restaurant(query: string, limit: number = 10): Promise<FoodItem[]> {
    
    try {
      const client = await pool.connect();
      try {
        // Normalize the query by replacing 'and' with '&', removing apostrophes, and converting to uppercase
        const normalizedQuery = query.toUpperCase()
          .replace(/\s+AND\s+/g, ' & ')
          .replace(/'/g, '');
        
        // Split into search terms, handling both '&' and spaces
        const searchTerms = normalizedQuery.split(/[\s&]+/).filter(term => term.length > 0);
        
        const result = await client.query(
          `WITH scored_results AS (
            SELECT *,
              (
                ${searchTerms.map((_, i) => 
                  `CASE WHEN REPLACE(name, '''', '') ILIKE $${i + 1} THEN 1 ELSE 0 END + 
                   CASE WHEN REPLACE(brand, '''', '') ILIKE $${i + 1} THEN 1 ELSE 0 END`
                ).join(' + ')}
              ) as match_score,
              ${searchTerms.map((_, i) => 
                `CASE WHEN 
                  REPLACE(name, '''', '') ILIKE $${i + 1} OR 
                  REPLACE(brand, '''', '') ILIKE $${i + 1}
                THEN 1 ELSE 0 END as term${i + 1}_match`
              ).join(', ')}
            FROM restaurantBranded
            WHERE ${searchTerms.map((_, i) => 
              `REPLACE(name, '''', '') ILIKE $${i + 1} OR 
               REPLACE(brand, '''', '') ILIKE $${i + 1}`
            ).join(' OR ')}
          )
          SELECT * FROM scored_results
          WHERE ${searchTerms.map((_, i) => `term${i + 1}_match = 1`).join(' AND ')}
          ORDER BY match_score DESC, name
          LIMIT $${searchTerms.length + 1}`,
          [
            ...searchTerms.map(term => `%${term}%`),
            limit
          ]
        );
        
        return result.rows as FoodItem[];
      } finally {
        client.release();
      }
    } catch (err) {
      console.error('Error executing query', err);
      throw err;
    }
  }

export async function USDAPostgresSearch(query: string, limit: number = 10) {
    const [foundationResults, brandedResults, restaurantResults] = await Promise.all([
      USDAPostgresSearch_Foundation(query, limit),
      USDAPostgresSearch_Branded(query, limit),
      USDAPostgresSearch_Restaurant(query, limit)
    ]);
    return { foundation: foundationResults, branded: brandedResults, restaurant: restaurantResults };
  }

export async function FoodItemSearch(query: string, limit: number = 10): Promise<FoodItem[]> {
  "use cache"
  cacheTag('food-item-search');
  cacheLife({ stale: 60 });
    try {
      const client = await pool.connect();
      try {
        // Normalize the query by replacing 'and' with '&', removing apostrophes, and converting to uppercase
        const normalizedQuery = query.toUpperCase()
          .replace(/\s+AND\s+/g, ' & ')
          .replace(/'/g, '');
        
        // Split into search terms, handling both '&' and spaces
        const searchTerms = normalizedQuery.split(/[\s&]+/).filter(term => term.length > 0);
        
        // Return empty array if no search terms
        if (searchTerms.length === 0) {
          return [];
        }
        
        const result = await client.query(
          `WITH search_terms AS (
            SELECT unnest($1::text[]) as term
          ),
          foundation_results AS (
            SELECT 
              id,
              apexionid,
              fdcid,
              name,
              COALESCE(variationlabels, ARRAY[]::text[]) as variationlabels,
              brand,
              nutrients,
              servinginfo,
              ingredients,
              created_at,
              'foundation' as source,
              (
                SELECT COUNT(*) 
                FROM search_terms 
                WHERE REPLACE(name, '''', '') ILIKE '%' || term || '%'
                OR EXISTS (
                  SELECT 1 
                  FROM unnest(COALESCE(variationlabels, ARRAY[]::text[])) v 
                  WHERE REPLACE(v, '''', '') ILIKE '%' || term || '%'
                )
              ) as match_score,
              (
                SELECT COUNT(*) = (SELECT COUNT(*) FROM search_terms)
                FROM search_terms 
                WHERE REPLACE(name, '''', '') ILIKE '%' || term || '%'
                OR EXISTS (
                  SELECT 1 
                  FROM unnest(COALESCE(variationlabels, ARRAY[]::text[])) v 
                  WHERE REPLACE(v, '''', '') ILIKE '%' || term || '%'
                )
              ) as all_terms_match
            FROM usdafoundation
            WHERE EXISTS (
              SELECT 1 FROM search_terms 
              WHERE REPLACE(name, '''', '') ILIKE '%' || term || '%'
              OR EXISTS (
                SELECT 1 
                FROM unnest(COALESCE(variationlabels, ARRAY[]::text[])) v 
                WHERE REPLACE(v, '''', '') ILIKE '%' || term || '%'
              )
            )
          ),
          branded_results AS (
            SELECT 
              id,
              apexionid,
              fdcid,
              name,
              COALESCE(variationlabels, ARRAY[]::text[]) as variationlabels,
              brand,
              nutrients,
              servinginfo,
              ingredients,
              created_at,
              'branded' as source,
              (
                SELECT COUNT(*) 
                FROM search_terms 
                WHERE REPLACE(name, '''', '') ILIKE '%' || term || '%'
                OR REPLACE(brand, '''', '') ILIKE '%' || term || '%'
                OR EXISTS (
                  SELECT 1 
                  FROM unnest(COALESCE(variationlabels, ARRAY[]::text[])) v 
                  WHERE REPLACE(v, '''', '') ILIKE '%' || term || '%'
                )
              ) as match_score,
              (
                SELECT COUNT(*) = (SELECT COUNT(*) FROM search_terms)
                FROM search_terms 
                WHERE REPLACE(name, '''', '') ILIKE '%' || term || '%'
                OR REPLACE(brand, '''', '') ILIKE '%' || term || '%'
                OR EXISTS (
                  SELECT 1 
                  FROM unnest(COALESCE(variationlabels, ARRAY[]::text[])) v 
                  WHERE REPLACE(v, '''', '') ILIKE '%' || term || '%'
                )
              ) as all_terms_match
            FROM usdabranded
            WHERE EXISTS (
              SELECT 1 FROM search_terms 
              WHERE REPLACE(name, '''', '') ILIKE '%' || term || '%'
              OR REPLACE(brand, '''', '') ILIKE '%' || term || '%'
              OR EXISTS (
                SELECT 1 
                FROM unnest(COALESCE(variationlabels, ARRAY[]::text[])) v 
                WHERE REPLACE(v, '''', '') ILIKE '%' || term || '%'
              )
            )
          ),
          restaurant_results AS (
            SELECT 
              id,
              apexionid,
              fdcid,
              name,
              COALESCE(variationlabels, ARRAY[]::text[]) as variationlabels,
              brand,
              nutrients,
              servinginfo,
              ingredients,
              created_at,
              'restaurant' as source,
              (
                SELECT COUNT(*) 
                FROM search_terms 
                WHERE REPLACE(name, '''', '') ILIKE '%' || term || '%'
                OR REPLACE(brand, '''', '') ILIKE '%' || term || '%'
                OR EXISTS (
                  SELECT 1 
                  FROM unnest(COALESCE(variationlabels, ARRAY[]::text[])) v 
                  WHERE REPLACE(v, '''', '') ILIKE '%' || term || '%'
                )
              ) as match_score,
              (
                SELECT COUNT(*) = (SELECT COUNT(*) FROM search_terms)
                FROM search_terms 
                WHERE REPLACE(name, '''', '') ILIKE '%' || term || '%'
                OR REPLACE(brand, '''', '') ILIKE '%' || term || '%'
                OR EXISTS (
                  SELECT 1 
                  FROM unnest(COALESCE(variationlabels, ARRAY[]::text[])) v 
                  WHERE REPLACE(v, '''', '') ILIKE '%' || term || '%'
                )
              ) as all_terms_match
            FROM restaurantBranded
            WHERE EXISTS (
              SELECT 1 FROM search_terms 
              WHERE REPLACE(name, '''', '') ILIKE '%' || term || '%'
              OR REPLACE(brand, '''', '') ILIKE '%' || term || '%'
              OR EXISTS (
                SELECT 1 
                FROM unnest(COALESCE(variationlabels, ARRAY[]::text[])) v 
                WHERE REPLACE(v, '''', '') ILIKE '%' || term || '%'
              )
            )
          ),
          combined_results AS (
            SELECT * FROM foundation_results
            UNION ALL
            SELECT * FROM branded_results
            UNION ALL
            SELECT * FROM restaurant_results
          )
          SELECT * FROM combined_results
          WHERE all_terms_match = true
          ORDER BY match_score DESC, name
          LIMIT $2`,
          [searchTerms, limit]
        );
        
        // Remove the source field from each result
        return result.rows.map(row => {
          const { source, ...rest } = row;
          return rest as FoodItem;
        });
      } finally {
        client.release();
      }
    } catch (err) {
      console.error('Error executing query', err);
      throw err;
    }
  }

// export const FoodItemSearch_Cached = unstable_cache(
//   async (query: string, limit: number = 10) => {
//     return await FoodItemSearch(query, limit);
//   },
//   ['food-item-search'],
//   { revalidate: 60 }
// );