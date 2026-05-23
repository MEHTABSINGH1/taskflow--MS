
create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end;
$$;

create or replace function public.task_set_completed()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.status = 'done' and (old.status is distinct from 'done') then new.completed_at = now();
  elsif new.status <> 'done' then new.completed_at = null;
  end if;
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;
