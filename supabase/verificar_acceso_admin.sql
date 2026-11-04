-- Revisar y ejecutar en el SQL Editor del proyecto. No modifica tablas, RLS ni sus políticas.
-- Expone únicamente un BOOLEAN a usuarios autenticados; nunca expone admin_users.
begin;
create or replace function public.verificar_acceso_admin()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select coalesce(app_private.es_admin(), false);
$$;
revoke all on function public.verificar_acceso_admin() from public, anon;
grant execute on function public.verificar_acceso_admin() to authenticated;
commit;
