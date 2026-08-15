-- Fix infinite RLS recursion on public.profiles SELECT.
-- The previous policy subqueried profiles from within a profiles policy,
-- so PostgREST reads after signup/login failed with 42P17.

create or replace function public.current_parent_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select parent_id from public.profiles where id = auth.uid();
$$;

revoke all on function public.current_parent_id() from public;
grant execute on function public.current_parent_id() to authenticated;

drop policy if exists "Authenticated can select classmates and teachers" on public.profiles;
create policy "Authenticated can select classmates and teachers"
  on public.profiles
  for select
  to authenticated
  using (
    role in ('admin'::public.role, 'teacher'::public.role)
    or id = auth.uid()
    or parent_id = auth.uid()
    or id = public.current_parent_id()
  );
