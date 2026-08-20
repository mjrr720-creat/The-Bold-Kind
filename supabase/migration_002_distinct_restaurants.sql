-- ============================================================================
-- Migration 002: distinct_restaurants()
-- Run this in the Supabase SQL editor if you already applied schema.sql.
--
-- Why: the restaurant filter dropdown needs every distinct restaurant name
-- across the WHOLE table (not just the current date filter), independent
-- of how many orders exist. Paging through 120K+ rows in JS just to collect
-- ~195 distinct names is wasteful. A single indexed DISTINCT query is
-- effectively instant and, being far under PostgREST's row cap, needs no
-- pagination on the client at all.
-- ============================================================================

create or replace function public.distinct_restaurants()
returns table (restaurant_name text)
language sql
stable
as $$
  select distinct o.restaurant_name
  from public.orders o
  where o.restaurant_name is not null
  order by o.restaurant_name;
$$;

grant execute on function public.distinct_restaurants() to anon, authenticated, service_role;
