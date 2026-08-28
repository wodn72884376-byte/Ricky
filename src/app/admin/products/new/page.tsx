import { BRAND_COLUMNS } from '@/lib/nav';
import { ProductForm } from '../product-form';
import { createProduct } from './actions';

export const metadata = { title: '상품 등록 — RICKY 운영' };

/**
 * 상품 등록.
 *
 * 브랜드 목록은 nav.ts를 그대로 쓴다 — 스토어 내비게이션에 없는 브랜드로
 * 상품을 등록하면 등록되자마자 갈 곳이 없는 상품이 된다.
 * (DB 연결 후에는 brands 테이블 조회로 바꾸되 slug 집합은 같아야 한다.)
 */
export default function NewProductPage() {
  const brands = BRAND_COLUMNS.map((b) => ({ value: b.slug, label: b.label }));
  return <ProductForm mode="create" brands={brands} action={createProduct} />;
}
