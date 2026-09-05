-- Dedicated student roster (linked to profiles when a matching auth user exists).

create table public.student (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid unique references public.profiles (id) on delete set null,
  name text not null,
  email text not null unique,
  grade text not null,
  school_name text,
  province text,
  municipality text,
  phone text,
  created_at timestamptz not null default now(),
  constraint student_grade_chk check (grade in ('10', '11', '12'))
);

create index student_grade_idx on public.student (grade);
create index student_profile_id_idx on public.student (profile_id);

alter table public.student enable row level security;

create policy "Students can select own row"
  on public.student
  for select
  to authenticated
  using (profile_id = auth.uid());

create policy "Admins and teachers can select students"
  on public.student
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role in ('admin', 'teacher')
    )
  );

grant select on table public.student to authenticated;
grant all on table public.student to service_role;

insert into public.student (
  name, email, grade, school_name, province, municipality, phone
)
values
  (
    'Lerato Molefe',
    'student@ember12.za',
    '12',
    'Ember Maths Academy',
    'Gauteng',
    'City of Johannesburg',
    '+27 82 555 0101'
  ),
  (
    'Sipho Dlamini',
    'sipho.dlamini@ember12.za',
    '12',
    'Ember Maths Academy',
    'KwaZulu-Natal',
    'eThekwini',
    '+27 83 555 0202'
  ),
  (
    'Aisha Patel',
    'aisha.patel@ember12.za',
    '11',
    'Ember Maths Academy',
    'Western Cape',
    'City of Cape Town',
    '+27 84 555 0303'
  ),
  (
    'Thabo Mokoena',
    'thabo.mokoena@ember12.za',
    '10',
    'Ember Maths Academy',
    'Free State',
    'Mangaung',
    '+27 72 555 0404'
  );
