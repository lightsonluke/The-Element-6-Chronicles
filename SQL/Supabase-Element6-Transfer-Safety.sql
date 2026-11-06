-- Run after Supabase-element6-online-social-room-clan-fixes.sql.
-- Gifts and trades remain pending until the recipient accepts. Both account
-- progress rows are changed in one database transaction on acceptance.
begin;

alter table public.element6_trade_gifts
  add column if not exists expires_at timestamptz not null default (now() + interval '30 days');
alter table public.element6_trade_gifts
  add column if not exists idempotency_key uuid;
create unique index if not exists element6_trade_gifts_sender_request_uidx
  on public.element6_trade_gifts(from_user_id,idempotency_key)
  where idempotency_key is not null;
alter table public.element6_trade_gifts
  drop constraint if exists element6_trade_gifts_status_check;
alter table public.element6_trade_gifts
  add constraint element6_trade_gifts_status_check check (status in ('pending','completed','declined','cancelled','expired'));
update public.element6_trade_gifts set status='expired'
where status='pending' and expires_at <= now();

create or replace function public.element6_apply_transfer(
  p_progress jsonb,
  p_payload jsonb,
  p_add boolean
) returns jsonb
language plpgsql
security definer
set search_path = public
as $E6TRANSFER$
declare
  v_progress jsonb := coalesce(p_progress, '{}'::jsonb);
  v_payload jsonb := coalesce(p_payload, '{}'::jsonb);
  v_category text;
  v_progress_key text;
  v_items jsonb;
  v_tokens numeric := coalesce((v_payload->>'tokens')::numeric, 0);
  v_balance numeric := coalesce((v_progress->>'coins')::numeric, 0);
begin
  if v_tokens < 0 or trunc(v_tokens) <> v_tokens then
    raise exception 'Token amount must be a non-negative whole number';
  end if;
  if not p_add and v_tokens > v_balance then raise exception 'Not enough Tokens'; end if;
  if p_add and v_tokens > 0 then
    v_progress := jsonb_set(v_progress, '{coins}', to_jsonb(v_balance + v_tokens), true);
  elsif not p_add then
    v_progress := jsonb_set(v_progress, '{coins}', to_jsonb(v_balance - v_tokens), true);
  end if;

  foreach v_category in array array['skins','accessories','killFX','chars'] loop
    v_progress_key := case v_category
      when 'skins' then 'ownedSkins'
      when 'accessories' then 'ownedAccessories'
      when 'killFX' then 'ownedKillFX'
      else 'unlockedIds'
    end;
    v_items := coalesce(v_payload->v_category, '[]'::jsonb);
    if jsonb_typeof(v_items) <> 'array' then raise exception 'Invalid transfer item list'; end if;
    if (select count(*) from jsonb_array_elements_text(v_items)) <>
       (select count(distinct value) from jsonb_array_elements_text(v_items)) then
      raise exception 'Duplicate items are not allowed';
    end if;
    if not p_add and exists (
      select 1 from jsonb_array_elements_text(v_items) offered(item_id)
      where not exists (
        select 1 from jsonb_array_elements_text(coalesce(v_progress->v_progress_key, '[]'::jsonb)) owned(item_id)
        where owned.item_id = offered.item_id
      )
    ) then raise exception 'An offered item is no longer owned'; end if;
    if p_add and exists (
      select 1 from jsonb_array_elements_text(v_items) offered(item_id)
      where exists (
        select 1 from jsonb_array_elements_text(coalesce(v_progress->v_progress_key, '[]'::jsonb)) owned(item_id)
        where owned.item_id = offered.item_id
      )
    ) then raise exception 'Recipient already owns an offered item'; end if;
    v_progress := jsonb_set(v_progress, array[v_progress_key], coalesce((
      select jsonb_agg(item_id order by item_id) from (
        select distinct owned.item_id
        from jsonb_array_elements_text(coalesce(v_progress->v_progress_key, '[]'::jsonb)) owned(item_id)
        where (p_add or not exists (
          select 1 from jsonb_array_elements_text(v_items) transferred(item_id)
          where transferred.item_id = owned.item_id
        ))
        union
        select distinct transferred.item_id
        from jsonb_array_elements_text(v_items) transferred(item_id)
        where p_add
      ) merged
    ), '[]'::jsonb), true);
  end loop;
  return v_progress;
end;
$E6TRANSFER$;

create or replace function public.element6_trade_inventory(p_peer uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $E6INVENTORY$
declare
  v_me uuid := auth.uid();
  v_progress jsonb;
begin
  if v_me is null then raise exception 'Sign in first'; end if;
  if not exists (
    select 1 from public.player_friend_requests f
    where f.status = 'accepted'
      and ((f.sender_id = v_me and f.recipient_id = p_peer) or (f.sender_id = p_peer and f.recipient_id = v_me))
  ) then raise exception 'Trade offers are available to accepted friends'; end if;
  select progress_json into v_progress from public.user_progress where user_id = p_peer;
  v_progress := coalesce(v_progress, '{}'::jsonb);
  return jsonb_build_object(
    'coins', coalesce((v_progress->>'coins')::numeric, 0),
    'ownedSkins', coalesce(v_progress->'ownedSkins', '[]'::jsonb),
    'ownedAccessories', coalesce(v_progress->'ownedAccessories', '[]'::jsonb),
    'ownedKillFX', coalesce(v_progress->'ownedKillFX', '[]'::jsonb),
    'unlockedIds', coalesce(v_progress->'unlockedIds', '[]'::jsonb)
  );
end;
$E6INVENTORY$;

create or replace function public.element6_create_gift(
  p_to_user uuid,
  p_give jsonb
) returns jsonb
language plpgsql
security definer
set search_path = public
as $E6CREATEGIFT$
declare
  v_me uuid := auth.uid();
  v_from_name text;
  v_to_name text;
  v_sender jsonb;
  v_id uuid;
  v_request_id uuid := coalesce((p_give->>'requestId')::uuid,gen_random_uuid());
begin
  if v_me is null then raise exception 'Sign in first'; end if;
  if p_to_user is null or p_to_user = v_me then raise exception 'Choose another player'; end if;
  if not exists (
    select 1 from public.player_friend_requests f
    where f.status = 'accepted'
      and ((f.sender_id = v_me and f.recipient_id = p_to_user) or (f.sender_id = p_to_user and f.recipient_id = v_me))
  ) then raise exception 'Gifts are available to accepted friends'; end if;
  select progress_json into v_sender from public.user_progress where user_id = v_me for update;
  if v_sender is null then raise exception 'Account inventory is not available'; end if;
  perform public.element6_apply_transfer(v_sender, p_give, false); -- validates availability without removing anything
  select coalesce(username, 'Player') into v_from_name from public.player_profiles where user_id = v_me;
  select coalesce(username, 'Player') into v_to_name from public.player_profiles where user_id = p_to_user;
  insert into public.element6_trade_gifts(type,from_user_id,to_user_id,from_username,to_username,status,give,idempotency_key)
  values ('gift',v_me,p_to_user,coalesce(v_from_name,'Player'),coalesce(v_to_name,'Player'),'pending',coalesce(p_give,'{}'::jsonb),v_request_id)
  on conflict (from_user_id,idempotency_key) where idempotency_key is not null do nothing
  returning id into v_id;
  if v_id is null then
    select id into v_id from public.element6_trade_gifts
    where from_user_id=v_me and idempotency_key=v_request_id and to_user_id=p_to_user and type='gift' and give=coalesce(p_give,'{}'::jsonb);
    if v_id is null then raise exception 'This request key was already used for a different offer'; end if;
    return jsonb_build_object('transaction_id',v_id,'status','pending','replayed',true);
  end if;
  insert into public.player_direct_messages(sender_id,recipient_id,sender_username,body)
  values (v_me,p_to_user,coalesce(v_from_name,'Player'),'Sent you a gift offer. [E6GIFT:'||v_id::text||']');
  return jsonb_build_object('transaction_id',v_id,'status','pending');
end;
$E6CREATEGIFT$;

create or replace function public.element6_create_trade(
  p_to_user uuid,
  p_give jsonb,
  p_request jsonb
) returns jsonb
language plpgsql
security definer
set search_path = public
as $E6CREATETRADE$
declare
  v_me uuid := auth.uid();
  v_from_name text;
  v_to_name text;
  v_sender jsonb;
  v_receiver jsonb;
  v_id uuid;
  v_request_id uuid := coalesce((p_give->>'requestId')::uuid,gen_random_uuid());
begin
  if v_me is null then raise exception 'Sign in first'; end if;
  if p_to_user is null or p_to_user = v_me then raise exception 'Choose another player'; end if;
  if not exists (
    select 1 from public.player_friend_requests f
    where f.status = 'accepted'
      and ((f.sender_id = v_me and f.recipient_id = p_to_user) or (f.sender_id = p_to_user and f.recipient_id = v_me))
  ) then raise exception 'Trade offers are available to accepted friends'; end if;
  select progress_json into v_sender from public.user_progress where user_id = v_me for update;
  select progress_json into v_receiver from public.user_progress where user_id = p_to_user;
  if v_sender is null then raise exception 'Your account inventory is not available'; end if;
  if v_receiver is null then raise exception 'The other account inventory is not available'; end if;
  perform public.element6_apply_transfer(v_sender, p_give, false);
  perform public.element6_apply_transfer(v_receiver, p_request, false);
  select coalesce(username, 'Player') into v_from_name from public.player_profiles where user_id = v_me;
  select coalesce(username, 'Player') into v_to_name from public.player_profiles where user_id = p_to_user;
  insert into public.element6_trade_gifts(type,from_user_id,to_user_id,from_username,to_username,status,give,request,idempotency_key)
  values ('trade_request',v_me,p_to_user,coalesce(v_from_name,'Player'),coalesce(v_to_name,'Player'),'pending',coalesce(p_give,'{}'::jsonb),coalesce(p_request,'{}'::jsonb),v_request_id)
  on conflict (from_user_id,idempotency_key) where idempotency_key is not null do nothing
  returning id into v_id;
  if v_id is null then
    select id into v_id from public.element6_trade_gifts
    where from_user_id=v_me and idempotency_key=v_request_id and to_user_id=p_to_user and type='trade_request'
      and give=coalesce(p_give,'{}'::jsonb) and request=coalesce(p_request,'{}'::jsonb);
    if v_id is null then raise exception 'This request key was already used for a different offer'; end if;
    return jsonb_build_object('transaction_id',v_id,'status','pending','replayed',true);
  end if;
  insert into public.player_direct_messages(sender_id,recipient_id,sender_username,body)
  values (v_me,p_to_user,coalesce(v_from_name,'Player'),'Sent you a trade offer. [E6TRADE:'||v_id::text||']');
  return jsonb_build_object('transaction_id',v_id,'status','pending');
end;
$E6CREATETRADE$;

create or replace function public.element6_accept_trade(p_trade_id uuid,p_accept boolean default true)
returns jsonb
language plpgsql
security definer
set search_path = public
as $E6ACCEPTTRADE$
declare
  v_trade public.element6_trade_gifts%rowtype;
  v_me uuid := auth.uid();
  v_sender jsonb;
  v_receiver jsonb;
  v_name text;
begin
  if v_me is null then raise exception 'Sign in first'; end if;
  select * into v_trade from public.element6_trade_gifts where id=p_trade_id for update;
  if v_trade.id is null or v_trade.to_user_id<>v_me or v_trade.type<>'trade_request' then raise exception 'Trade offer was not found'; end if;
  if v_trade.status='pending' and v_trade.expires_at <= now() then
    update public.element6_trade_gifts set status='expired' where id=v_trade.id;
    return jsonb_build_object('accepted',false,'status','expired','transaction_id',v_trade.id);
  end if;
  if v_trade.status <> 'pending' then return jsonb_build_object('accepted',v_trade.status='completed','status',v_trade.status,'transaction_id',v_trade.id); end if;
  if not p_accept then
    update public.element6_trade_gifts set status='declined' where id=v_trade.id;
    select coalesce(username,'Player') into v_name from public.player_profiles where user_id=v_me;
    insert into public.player_direct_messages(sender_id,recipient_id,sender_username,body)
    values (v_me,v_trade.from_user_id,coalesce(v_name,'Player'),'Your trade offer was declined. [E6TRADE:'||v_trade.id::text||']');
    return jsonb_build_object('accepted',false,'status','declined','transaction_id',v_trade.id);
  end if;
  perform user_id from public.user_progress where user_id in (v_trade.from_user_id,v_trade.to_user_id) order by user_id for update;
  select progress_json into v_sender from public.user_progress where user_id=v_trade.from_user_id;
  select progress_json into v_receiver from public.user_progress where user_id=v_trade.to_user_id;
  v_sender := public.element6_apply_transfer(v_sender,v_trade.give,false);
  v_receiver := public.element6_apply_transfer(v_receiver,v_trade.request,false);
  v_receiver := public.element6_apply_transfer(v_receiver,v_trade.give,true);
  v_sender := public.element6_apply_transfer(v_sender,v_trade.request,true);
  update public.user_progress set progress_json=v_sender,updated_at=now() where user_id=v_trade.from_user_id;
  update public.user_progress set progress_json=v_receiver,updated_at=now() where user_id=v_trade.to_user_id;
  update public.element6_trade_gifts set status='completed' where id=v_trade.id;
  select coalesce(username,'Player') into v_name from public.player_profiles where user_id=v_me;
  insert into public.player_direct_messages(sender_id,recipient_id,sender_username,body)
  values (v_me,v_trade.from_user_id,coalesce(v_name,'Player'),'Your trade offer was accepted. [E6TRADE:'||v_trade.id::text||']');
  return jsonb_build_object('accepted',true,'status','completed','transaction_id',v_trade.id);
end;
$E6ACCEPTTRADE$;

create or replace function public.element6_accept_gift(p_gift_id uuid,p_accept boolean default true)
returns jsonb
language plpgsql
security definer
set search_path = public
as $E6ACCEPTGIFT$
declare
  v_gift public.element6_trade_gifts%rowtype;
  v_me uuid := auth.uid();
  v_sender jsonb;
  v_receiver jsonb;
  v_name text;
begin
  if v_me is null then raise exception 'Sign in first'; end if;
  select * into v_gift from public.element6_trade_gifts where id=p_gift_id for update;
  if v_gift.id is null or v_gift.to_user_id<>v_me or v_gift.type<>'gift' then raise exception 'Gift offer was not found'; end if;
  if v_gift.status='pending' and v_gift.expires_at <= now() then
    update public.element6_trade_gifts set status='expired' where id=v_gift.id;
    return jsonb_build_object('accepted',false,'status','expired','transaction_id',v_gift.id);
  end if;
  if v_gift.status <> 'pending' then return jsonb_build_object('accepted',v_gift.status='completed','status',v_gift.status,'transaction_id',v_gift.id); end if;
  if not p_accept then
    update public.element6_trade_gifts set status='declined' where id=v_gift.id;
    select coalesce(username,'Player') into v_name from public.player_profiles where user_id=v_me;
    insert into public.player_direct_messages(sender_id,recipient_id,sender_username,body)
    values (v_me,v_gift.from_user_id,coalesce(v_name,'Player'),'Your gift offer was declined. [E6GIFT:'||v_gift.id::text||']');
    return jsonb_build_object('accepted',false,'status','declined','transaction_id',v_gift.id);
  end if;
  perform user_id from public.user_progress where user_id in (v_gift.from_user_id,v_gift.to_user_id) order by user_id for update;
  select progress_json into v_sender from public.user_progress where user_id=v_gift.from_user_id;
  select progress_json into v_receiver from public.user_progress where user_id=v_gift.to_user_id;
  v_sender := public.element6_apply_transfer(v_sender,v_gift.give,false);
  v_receiver := public.element6_apply_transfer(v_receiver,v_gift.give,true);
  update public.user_progress set progress_json=v_sender,updated_at=now() where user_id=v_gift.from_user_id;
  update public.user_progress set progress_json=v_receiver,updated_at=now() where user_id=v_gift.to_user_id;
  update public.element6_trade_gifts set status='completed' where id=v_gift.id;
  select coalesce(username,'Player') into v_name from public.player_profiles where user_id=v_me;
  insert into public.player_direct_messages(sender_id,recipient_id,sender_username,body)
  values (v_me,v_gift.from_user_id,coalesce(v_name,'Player'),'Your gift was accepted and delivered. [E6GIFT:'||v_gift.id::text||']');
  return jsonb_build_object('accepted',true,'status','completed','transaction_id',v_gift.id);
end;
$E6ACCEPTGIFT$;

-- Keep older clients safe: the legacy send endpoint now creates a pending
-- offer and never removes inventory until element6_accept_gift succeeds.
create or replace function public.element6_send_gift(
  p_to_user uuid,
  p_to_username text,
  p_from_username text,
  p_give jsonb
) returns jsonb
language plpgsql
security definer
set search_path = public
as $E6LEGACYGIFT$
begin
  return public.element6_create_gift(p_to_user, p_give);
end;
$E6LEGACYGIFT$;

create or replace function public.element6_cancel_transfer(p_transaction_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $E6CANCELTRANSFER$
declare
  v_me uuid := auth.uid();
  v_tx public.element6_trade_gifts%rowtype;
  v_name text;
begin
  if v_me is null then raise exception 'Sign in first'; end if;
  select * into v_tx from public.element6_trade_gifts where id=p_transaction_id for update;
  if v_tx.id is null or v_tx.from_user_id<>v_me then raise exception 'Transaction not found'; end if;
  if v_tx.status <> 'pending' then return jsonb_build_object('cancelled',v_tx.status='cancelled','status',v_tx.status,'transaction_id',v_tx.id); end if;
  update public.element6_trade_gifts set status='cancelled' where id=v_tx.id;
  select coalesce(username,'Player') into v_name from public.player_profiles where user_id=v_me;
  insert into public.player_direct_messages(sender_id,recipient_id,sender_username,body)
  values (v_me,v_tx.to_user_id,coalesce(v_name,'Player'),'This offer was cancelled by the sender. ['||case when v_tx.type='gift' then 'E6GIFT:' else 'E6TRADE:' end||v_tx.id::text||']');
  return jsonb_build_object('cancelled',true,'status','cancelled','transaction_id',v_tx.id);
end;
$E6CANCELTRANSFER$;

-- Offers can only be created or resolved through the validated functions above.
drop policy if exists element6_trade_gifts_insert on public.element6_trade_gifts;
drop policy if exists element6_trade_gifts_update on public.element6_trade_gifts;
revoke insert, update, delete on public.element6_trade_gifts from anon, authenticated;
revoke all on function public.element6_apply_transfer(jsonb,jsonb,boolean) from public, anon, authenticated;
revoke all on function public.element6_trade_inventory(uuid) from public, anon;
revoke all on function public.element6_create_gift(uuid,jsonb) from public, anon;
revoke all on function public.element6_create_trade(uuid,jsonb,jsonb) from public, anon;
revoke all on function public.element6_accept_gift(uuid,boolean) from public, anon;
grant execute on function public.element6_trade_inventory(uuid) to authenticated;
grant execute on function public.element6_create_gift(uuid,jsonb) to authenticated;
grant execute on function public.element6_create_trade(uuid,jsonb,jsonb) to authenticated;
grant execute on function public.element6_accept_gift(uuid,boolean) to authenticated;
grant execute on function public.element6_accept_trade(uuid,boolean) to authenticated;
revoke all on function public.element6_send_gift(uuid,text,text,jsonb) from public, anon;
grant execute on function public.element6_send_gift(uuid,text,text,jsonb) to authenticated;
revoke all on function public.element6_cancel_transfer(uuid) from public, anon;
grant execute on function public.element6_cancel_transfer(uuid) to authenticated;

commit;
