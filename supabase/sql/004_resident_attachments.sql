-- 住民附件（照片/病例）儲存桶與存取政策
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'resident-attachments',
  'resident-attachments',
  false,
  20971520,
  array['application/pdf', 'image/jpeg', 'image/png']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "resident_attachments_authenticated_select" on storage.objects;
create policy "resident_attachments_authenticated_select"
on storage.objects
for select
to authenticated
using (bucket_id = 'resident-attachments');

drop policy if exists "resident_attachments_authenticated_insert" on storage.objects;
create policy "resident_attachments_authenticated_insert"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'resident-attachments');

drop policy if exists "resident_attachments_authenticated_update" on storage.objects;
create policy "resident_attachments_authenticated_update"
on storage.objects
for update
to authenticated
using (bucket_id = 'resident-attachments')
with check (bucket_id = 'resident-attachments');

drop policy if exists "resident_attachments_authenticated_delete" on storage.objects;
create policy "resident_attachments_authenticated_delete"
on storage.objects
for delete
to authenticated
using (bucket_id = 'resident-attachments');
