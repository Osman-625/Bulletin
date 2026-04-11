-- ============================================================
-- Bulletin — Supabase Storage Bucket + Policies
-- ============================================================

-- Create the banner-images bucket (public read, authenticated write)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'banner-images',
  'banner-images',
  true,                            -- publicly readable via URL
  5242880,                         -- 5 MB limit per file
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do nothing;

-- ─── Storage RLS Policies ───────────────────────────────────

-- Public: anyone can view banner images
create policy "banners: public read" on storage.objects
  for select using (bucket_id = 'banner-images');

-- Authenticated publishers can upload banners
-- Path convention: {org_id}/{filename}
create policy "banners: publisher upload" on storage.objects
  for insert with check (
    bucket_id = 'banner-images'
    and auth.role() = 'authenticated'
  );

-- Authors can update/delete their own uploads
create policy "banners: owner manage" on storage.objects
  for update using (
    bucket_id = 'banner-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "banners: owner delete" on storage.objects
  for delete using (
    bucket_id = 'banner-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Admins can delete any banner
create policy "banners: admin delete" on storage.objects
  for delete using (
    bucket_id = 'banner-images'
    and exists (
      select 1 from public.users
      where id = auth.uid() and role in ('admin', 'super_admin')
    )
  );
