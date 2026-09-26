-- Element 6 clan tier progression: increase the current XP thresholds by 75%.
-- This migration changes only the required-XP function; existing clan XP and
-- minimum-age gates remain untouched.
create or replace function public.element6_clan_required_xp(p_tier smallint)
returns bigint language sql immutable as $$
  select case p_tier
    when 0 then 1
    when 1 then 394
    when 2 then 1313
    when 3 then 2888
    when 4 then 5250
    when 5 then 8400
    when 6 then 12600
    when 7 then 17850
    when 8 then 24675
    when 9 then 34125
    else 0
  end;
$$;
