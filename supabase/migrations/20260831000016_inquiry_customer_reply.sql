-- ---------------------------------------------------------------------------
-- 20260831000016  고객이 자기 문의에 답을 이어 쓸 수 있게 한다
--
-- 배경: `/support/inquiry/[ticket_no]` (고객용 문의 상세)가 생겼다. 지금까지 답변은
-- 이메일로만 나갔고, `inquiry_replies` 에는 운영자만 쓸 수 있었다
-- (20260826000003 은 `_admin_all` 과 `_self_read` 만 만들었다).
--
-- 읽을 수 있는데 되물을 수 없으면 고객은 같은 건으로 **새 문의**를 접수한다 —
-- 한 대화가 티켓 두 개로 갈라지고, 운영자는 둘을 손으로 잇는다.
--
-- 세 가지를 건다:
--   1. `author = 'customer'` 로만 쓸 수 있다. 고객이 운영자 이름으로 줄을 남기면
--      상세 화면의 "운영자 · 2026-08-31" 이 거짓말이 된다.
--   2. 본인 문의여야 한다. `inquiries_self_read` 와 같은 조건이다.
--   3. `closed` 인 건에는 못 쓴다. 종료된 대화를 되살리는 경로는 새 문의다 —
--      화면도 종료 건에는 입력 상자를 그리지 않는다.
--
-- 고객이 답을 달면 `answered` 를 `open` 으로 되돌린다. 운영자 목록(`/admin/inquiries`)이
-- `open` 을 위로 올리므로, 이것이 없으면 되물음이 목록 아래에 조용히 묻힌다.
-- 고객에게는 `inquiries` update 권한이 없으므로 **트리거(security definer)** 로 한다 —
-- 정책을 열어 주면 제목·본문까지 고칠 수 있게 된다.
-- ---------------------------------------------------------------------------

create policy inquiry_replies_self_insert on public.inquiry_replies
  for insert to authenticated
  with check (
    author = 'customer'
    and exists (
      select 1 from public.inquiries i
      where i.id = inquiry_id
        and i.customer_id = auth.uid()
        and i.status <> 'closed'
    )
  );

create or replace function public.reopen_inquiry_on_customer_reply()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.author = 'customer' then
    -- `closed` 는 건드리지 않는다. 위 정책이 막지만, 운영자 경로로 들어온 줄도 있을 수 있다.
    update public.inquiries
       set status = 'open'
     where id = new.inquiry_id
       and status = 'answered';
  end if;
  return new;
end $$;

drop trigger if exists inquiry_replies_reopen on public.inquiry_replies;
create trigger inquiry_replies_reopen
  after insert on public.inquiry_replies
  for each row execute function public.reopen_inquiry_on_customer_reply();
