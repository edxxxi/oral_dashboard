-- Pataka 聲音資料儲存桶與存取政策
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'pataka-audio',
  'pataka-audio',
  false,
  52428800,
  array['audio/wav', 'audio/x-wav', 'audio/mpeg', 'audio/mp4', 'audio/webm', 'audio/ogg']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "pataka_audio_authenticated_select" on storage.objects;
create policy "pataka_audio_authenticated_select"
on storage.objects
for select
to authenticated
using (bucket_id = 'pataka-audio');

drop policy if exists "pataka_audio_authenticated_insert" on storage.objects;
create policy "pataka_audio_authenticated_insert"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'pataka-audio');

drop policy if exists "pataka_audio_authenticated_update" on storage.objects;
create policy "pataka_audio_authenticated_update"
on storage.objects
for update
to authenticated
using (bucket_id = 'pataka-audio')
with check (bucket_id = 'pataka-audio');

drop policy if exists "pataka_audio_authenticated_delete" on storage.objects;
create policy "pataka_audio_authenticated_delete"
on storage.objects
for delete
to authenticated
using (bucket_id = 'pataka-audio');
