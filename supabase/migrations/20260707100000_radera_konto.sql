-- Stega — kontoradering (krav från Google Play)
-- Raderar det inloggade kontot och all dess data. Kaskaderna i schemat
-- tar profil, steg, vänskaper, utmaningsdeltaganden, pushtokens och pepp.

create or replace function public.delete_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Inte inloggad';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function public.delete_account() from public;
grant execute on function public.delete_account() to authenticated;
