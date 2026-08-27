/**
 * 조건부 className 결합. clsx를 들이지 않는 이유는 이 시스템의 변형이 작아서다.
 * falsy 값은 버리고 공백으로 잇는다.
 */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}
