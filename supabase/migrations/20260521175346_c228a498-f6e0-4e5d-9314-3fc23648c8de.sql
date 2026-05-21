
-- Fix set_updated_at search_path
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Restrict execute on helper functions
revoke execute on function public.set_updated_at() from anon, authenticated, public;
revoke execute on function public.handle_new_user() from anon, authenticated, public;

-- Tighten storage SELECT policy: only owner can list their own plant photos
drop policy if exists "Public can view plant photos" on storage.objects;
create policy "Owners can list their plant photos" on storage.objects for select to authenticated using (
  bucket_id = 'plant-photos' and auth.uid()::text = (storage.foldername(name))[1]
);
