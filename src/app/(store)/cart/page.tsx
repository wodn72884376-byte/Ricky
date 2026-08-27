import { CartView } from './cart-view';

export const metadata = { title: '장바구니 — RICKY' };

/** 장바구니는 브라우저 저장소에 있으므로 클라이언트에서 렌더한다. */
export default function CartPage() {
  return <CartView />;
}
