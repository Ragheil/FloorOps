truncate table public.stations, public.bays restart identity cascade;

insert into public.bays (id, name, description, sort_order)
values
  ('11111111-1111-1111-1111-111111111111', 'Bay 1', 'Left-side vertical rail, PCs 01 to 07', 1),
  ('22222222-2222-2222-2222-222222222222', 'Bay 2', 'Left-center front column, PCs 08 to 13', 2),
  ('33333333-3333-3333-3333-333333333333', 'Bay 3', 'Left-center rear column, PCs 14 to 19', 3),
  ('44444444-4444-4444-4444-444444444444', 'Bay 4', 'Top horizontal run, PCs 20 to 29', 4),
  ('55555555-5555-5555-5555-555555555555', 'Bay 5', 'Upper middle row, PCs 30 to 38', 5),
  ('66666666-6666-6666-6666-666666666666', 'Bay 6', 'Lower middle row, PCs 39 to 47', 6),
  ('77777777-7777-7777-7777-777777777777', 'Bay 7', 'Upper bottom row, PCs 48 to 56', 7),
  ('88888888-8888-8888-8888-888888888888', 'Bay 8', 'Lower bottom row, PCs 57 to 65', 8);

with seat_map as (
  select
    pc_number,
    lpad(pc_number::text, 2, '0') as padded,
    case
      when pc_number between 1 and 7 then '11111111-1111-1111-1111-111111111111'
      when pc_number between 8 and 13 then '22222222-2222-2222-2222-222222222222'
      when pc_number between 14 and 19 then '33333333-3333-3333-3333-333333333333'
      when pc_number between 20 and 29 then '44444444-4444-4444-4444-444444444444'
      when pc_number between 30 and 38 then '55555555-5555-5555-5555-555555555555'
      when pc_number between 39 and 47 then '66666666-6666-6666-6666-666666666666'
      when pc_number between 48 and 56 then '77777777-7777-7777-7777-777777777777'
      else '88888888-8888-8888-8888-888888888888'
    end::uuid as bay_id,
    case
      when pc_number between 1 and 7 then 1
      when pc_number between 8 and 13 then 2
      when pc_number between 14 and 19 then 3
      when pc_number between 20 and 29 then 4
      when pc_number between 30 and 38 then 5
      when pc_number between 39 and 47 then 6
      when pc_number between 48 and 56 then 7
      else 8
    end as bay_number,
    case
      when pc_number between 1 and 7 then pc_number
      when pc_number between 8 and 13 then pc_number - 7
      when pc_number between 14 and 19 then pc_number - 13
      when pc_number between 20 and 29 then pc_number - 19
      when pc_number between 30 and 38 then pc_number - 29
      when pc_number between 39 and 47 then pc_number - 38
      when pc_number between 48 and 56 then pc_number - 47
      else pc_number - 56
    end as position_in_bay,
    case
      when pc_number in (11, 24, 37, 43, 61) then 'Issue'
      when pc_number in (7, 19, 30, 45, 57, 65) then 'Reserved'
      when mod(pc_number, 2) = 0 then 'Active'
      else 'Vacant'
    end as status
  from generate_series(1, 65) as pc_number
)
insert into public.stations (
  bay_id,
  seat_label,
  pc_name,
  ip_address,
  agent_name,
  agent_id,
  status,
  notes,
  sort_order
)
select
  bay_id,
  format('PC-%s', padded),
  format('FOPS-PC-%s', padded),
  format('10.10.%s.%s', bay_number, position_in_bay),
  null,
  null,
  status,
  case
    when status = 'Issue' and mod(pc_number, 2) = 0 then 'PC needs checking'
    when status = 'Issue' then 'Headset issue'
    when status = 'Reserved' then 'Reserved for trainee'
    else null
  end,
  position_in_bay
from seat_map
order by pc_number;
