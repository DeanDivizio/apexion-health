-- Enable pgvector extension
create extension if not exists vector with schema extensions;

-- Create knowledge_chunks table
create table if not exists knowledge_chunks (
  id uuid primary key default gen_random_uuid(),
  source_id text not null,
  source_type text not null check (source_type in ('podcast', 'paper', 'manual')),
  chunk_index integer not null,
  content text not null,
  embedding extensions.vector(1536),
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

-- Indexes
create index if not exists idx_knowledge_chunks_source_id
  on knowledge_chunks (source_id);

create index if not exists idx_knowledge_chunks_source_type
  on knowledge_chunks (source_type);

create index if not exists idx_knowledge_chunks_metadata
  on knowledge_chunks using gin (metadata);

create index if not exists idx_knowledge_chunks_embedding
  on knowledge_chunks using hnsw (embedding extensions.vector_cosine_ops)
  with (m = 16, ef_construction = 64);

-- Similarity search RPC
-- Enable RLS (best practice, but service_role bypasses it)
alter table knowledge_chunks enable row level security;

-- Grant table permissions to Supabase API roles
grant usage on schema public to anon, authenticated, service_role;
grant all on table knowledge_chunks to service_role;
grant select on table knowledge_chunks to anon, authenticated;

-- RLS policy: allow service_role full access (implicit via bypass),
-- allow authenticated users read-only access
create policy "Authenticated users can read knowledge chunks"
  on knowledge_chunks for select
  to authenticated
  using (true);

create or replace function match_knowledge_chunks(
  query_embedding extensions.vector(1536),
  match_threshold float default 0.7,
  match_count int default 10,
  filter_source_type text default null,
  filter_source_id text default null
)
returns table (
  id uuid,
  source_id text,
  source_type text,
  chunk_index int,
  content text,
  metadata jsonb,
  similarity float
)
language plpgsql as $$
begin
  return query
  select
    kc.id, kc.source_id, kc.source_type, kc.chunk_index,
    kc.content, kc.metadata,
    (1 - (kc.embedding <=> query_embedding))::float as similarity
  from knowledge_chunks kc
  where (filter_source_type is null or kc.source_type = filter_source_type)
    and (filter_source_id is null or kc.source_id = filter_source_id)
    and 1 - (kc.embedding <=> query_embedding) > match_threshold
  order by kc.embedding <=> query_embedding
  limit match_count;
end;
$$;

-- Grant execute on the search function
grant execute on function match_knowledge_chunks to anon, authenticated, service_role;
