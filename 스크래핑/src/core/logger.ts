/** 최소 구조화 로거. 민감정보(개인통관고유부호 등)는 애초에 이 파이프라인에 들어오지 않는다. */

const t = () => new Date().toISOString().slice(11, 19);

let quiet = false;
export const setQuiet = (v: boolean) => {
  quiet = v;
};

export const log = {
  info: (msg: string, ...rest: unknown[]) => {
    if (!quiet) console.log(`${t()}   ${msg}`, ...rest);
  },
  step: (msg: string) => {
    if (!quiet) console.log(`${t()} > ${msg}`);
  },
  ok: (msg: string) => {
    if (!quiet) console.log(`${t()} + ${msg}`);
  },
  warn: (msg: string, ...rest: unknown[]) => {
    console.warn(`${t()} ! ${msg}`, ...rest);
  },
  error: (msg: string, ...rest: unknown[]) => {
    console.error(`${t()} x ${msg}`, ...rest);
  },
};
