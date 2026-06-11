-- Storage policies for plant-photos bucket
create policy "Public can view plant photos"
on storage.objects for select
to public
using (bucket_id = 'plant-photos');

create policy "Users can upload their own plant photos"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'plant-photos'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "Users can update their own plant photos"
on storage.objects for update
to authenticated
using (
  bucket_id = 'plant-photos'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "Users can delete their own plant photos"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'plant-photos'
  and auth.uid()::text = (storage.foldername(name))[1]
);
