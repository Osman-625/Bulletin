-- Re-enable admin roster reads for privileged roles now that
-- current_user_role() is SECURITY DEFINER and bypasses row security.

drop policy if exists "users: admins read all" on public.users;

create policy "users: admins read all" on public.users
  for select using (
    public.current_user_role() in ('admin', 'super_admin', 'owner')
  );
