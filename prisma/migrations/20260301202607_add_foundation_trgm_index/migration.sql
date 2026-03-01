-- Enable pg_trgm extension for trigram-based text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Fast trigram search on foundation food names
CREATE INDEX IF NOT EXISTS idx_foundation_food_name_trgm
  ON "NutritionFoundationFood" USING gin (name gin_trgm_ops);
