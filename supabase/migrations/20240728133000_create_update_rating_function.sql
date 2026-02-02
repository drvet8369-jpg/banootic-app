-- This function atomically updates a provider's rating and review count
-- based on the data in the reviews table. It's more efficient and safer
-- than calculating this in the application code.

create or replace function update_provider_rating(provider_profile_id uuid)
returns void as $$
begin
  with review_stats as (
    select
      avg(rating)::numeric(2,1) as avg_rating,
      count(id) as reviews_count
    from public.reviews
    where reviews.provider_id = provider_profile_id
  )
  update public.providers
  set
    rating = review_stats.avg_rating,
    reviews_count = review_stats.reviews_count
  from review_stats
  where providers.profile_id = provider_profile_id;
end;
$$ language plpgsql;
