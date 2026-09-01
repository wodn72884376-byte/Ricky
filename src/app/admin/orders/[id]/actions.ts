'use server';

import { revalidatePath } from 'next/cache';
import { getSessionUser } from '@/lib/supabase/auth';
import { createClient } from '@/lib/supabase/server';
import { ORDER_STATUS_KO } from '@/lib/orders';
import type { OrderStatus } from '@/lib/supabase/types';
import type { OrderActionState } from './state';

/**
 * 주문 상태 전이와 송장 입력.
 *
 * **관리자 여부를 액션 안에서 다시 본다.** 레이아웃 가드는 화면 렌더를 막을 뿐
 * 서버 액션 호출을 막지 않는다. RLS `orders_admin_all` 이 최종 방어선이지만,
 * 그건 정책이고 이건 라우트다.
 */
async function isAdmin() {
  return (await getSessionUser())?.isAdmin === true;
}

const STATUSES = Object.keys(ORDER_STATUS_KO) as OrderStatus[];

export async function setOrderStatus(
  _prev: OrderActionState,
  formData: FormData,
): Promise<OrderActionState> {
  if (!(await isAdmin())) return { status: 'error', message: '권한이 없어요.' };

  const id = String(formData.get('id') ?? '');
  const next = String(formData.get('status') ?? '') as OrderStatus;
  if (!id || !STATUSES.includes(next)) return { status: 'error', message: '알 수 없는 상태예요.' };

  const supabase = await createClient();

  /*
    `paid_at` 은 처음 `paid` 로 갈 때만 찍는다. 상태를 되돌렸다가 다시 올릴 때 덮어쓰면
    결제 시각이 실제와 달라진다 — 정산의 기준 시각이라 흔들리면 안 된다.
  */
  const patch: { status: OrderStatus; paid_at?: string } = { status: next };
  if (next === 'paid') {
    const { data } = await supabase.from('orders').select('paid_at').eq('id', id).maybeSingle();
    if (!data?.paid_at) patch.paid_at = new Date().toISOString();
  }

  const { error } = await supabase.from('orders').update(patch).eq('id', id);
  if (error) return { status: 'error', message: '상태를 바꾸지 못했어요. 잠시 후 다시 시도해 주세요.' };

  revalidatePath(`/admin/orders/${id}`);
  revalidatePath('/admin/orders');
  return { status: 'ok', message: `${ORDER_STATUS_KO[next]}(으)로 바꿨어요.` };
}

/**
 * 송장 입력.
 *
 * 배송 행이 없으면 만들고, 있으면 고친다 — 운영자는 "이 주문의 송장"을 다루지
 * "몇 번째 배송 행"을 다루지 않는다.
 *
 * `shipping_cost_cad_cents`(실제 운임)는 **건드리지 않는다.** 컬럼 grant 로
 * `authenticated` 에서 빠져 있고(20260830000011), 원가는 이 화면의 일이 아니다.
 */
export async function saveTracking(
  _prev: OrderActionState,
  formData: FormData,
): Promise<OrderActionState> {
  if (!(await isAdmin())) return { status: 'error', message: '권한이 없어요.' };

  const id = String(formData.get('id') ?? '');
  const carrier = String(formData.get('carrier') ?? '').trim();
  const trackingNo = String(formData.get('trackingNo') ?? '').trim();
  if (!id) return { status: 'error', message: '주문을 찾을 수 없어요.' };
  if (!carrier && !trackingNo) return { status: 'error', message: '배송사나 송장번호를 적어 주세요.' };

  const supabase = await createClient();

  const { data: existing } = await supabase
    .from('shipments')
    .select('id')
    .eq('order_id', id)
    .order('created_at', { ascending: false })
    .limit(1);

  const row = { carrier: carrier || null, tracking_no: trackingNo || null };
  const { error } = existing?.[0]
    ? await supabase.from('shipments').update(row).eq('id', existing[0].id)
    : await supabase.from('shipments').insert({ order_id: id, ...row });

  if (error) return { status: 'error', message: '송장을 저장하지 못했어요. 잠시 후 다시 시도해 주세요.' };

  revalidatePath(`/admin/orders/${id}`);
  return { status: 'ok', message: '송장을 저장했어요.' };
}
