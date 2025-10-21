-- Ensure owner_id is a UUID referencing auth.users(id)
alter table public.projects
  alter column owner_id type uuid using owner_id::uuid;

alter table public.projects
  add constraint if not exists projects_owner_fkey
  foreign key (owner_id) references auth.users(id) on delete set null;

-- Ensure projects expose the is_public flag
alter table public.projects
  add column if not exists is_public boolean default false not null;
