/**
 * 반자동 수집용 북마클릿.
 *
 * 봇 차단이 걸린 사이트(룰루레몬·캐나다구스·폴로)를 자동화로 뚫는 대신,
 * **운영자가 평소 쓰는 브라우저로 보고 있는 페이지**에서 데이터를 걷어 온다.
 * 진짜 사람이 진짜 브라우저로 보는 것이므로 탐지가 성립하지 않고 약관 문제도 없다.
 *
 * 두 가지를 만든다.
 *   단건  상품 상세 페이지에서 그 상품 하나. 화면 상태까지 읽어 가장 정확하다.
 *   목록  카테고리·검색결과·위시리스트에서 **여러 상품을 한 번에**.
 *         상품마다 북마크를 누르게 하면 결국 아무도 안 쓰기 때문이다.
 *
 * 북마클릿은 해석하지 않는다 — 원문을 그대로 담아 내려받고,
 * 해석은 `--import` 가 기존 추출기로 한다. 로직을 두 벌 두지 않기 위해서다.
 */

export const CAPTURE_VERSION = 2;

/** 화면에서 읽은 옵션 하나 (사이즈 버튼 등) */
export type DomOption = {
  /** 버튼에 적힌 값. "XS", "9.5" 등 */
  label: string;
  /** 고를 수 있는 상태인가. false 면 품절/미편성이다. */
  available: boolean;
  /** 지금 선택돼 있는가 */
  selected: boolean;
};

export type DomState = {
  /** 지금 선택된 색상 */
  selectedColour: string | null;
  /** 선택된 색상의 사이즈별 구매 가능 여부 */
  sizes: DomOption[];
  /**
   * 색상을 눌러 가며 읽은 결과.
   *
   * 랄프로렌은 색상이 6개 이상이면 JSON-LD 에서 사이즈를 빼 버린다.
   * 그때는 화면에서 색상을 하나씩 골라 보는 수밖에 없다.
   */
  byColour?: Array<{ colour: string | null; sizes: DomOption[] }>;
};

/**
 * 사이즈 후보 요소의 원본 속성.
 *
 * 품절 판정이 틀렸을 때 왜 틀렸는지 알려면 마크업이 필요하다.
 * 차단된 사이트는 개발자가 페이지를 직접 볼 수 없으므로 이걸로 대신한다.
 */
export type SizeProbe = {
  label: string;
  tag: string;
  cls: string;
  aria: string | null;
  dis: boolean;
  pTag: string | null;
  pCls: string | null;
  html: string;
};

/** 목록 수집에서 상품 1건 */
export type BatchItem = {
  url: string;
  title: string;
  jsonld: string[];
  dom?: DomState;
  /** 렌더에 실패한 경우 사유 */
  error?: string;
};

/** 북마클릿이 내려받는 파일의 모양 */
export type StockCapture = {
  v: number;
  url: string;
  title: string;
  capturedAt: string;
  /** <script type="application/ld+json"> 원문들 */
  jsonld: string[];
  /**
   * 화면에서 직접 읽은 상태.
   *
   * JSON-LD 를 못 믿는 사이트가 있다 — 랄프로렌은 사이즈를 일부만 싣고
   * 재고를 전부 InStock 으로 표기한다. 그때는 사람이 보고 있는 화면이 정답이다.
   */
  dom?: DomState;
  /** 사이즈 버튼 마크업 원본. 품절 판정을 고칠 때 쓴다. */
  probe?: SizeProbe[];
  /** 목록 수집분. 있으면 이 파일 하나에 상품 여러 건이 들어 있다. */
  batch?: BatchItem[];
};

export const CAPTURE_FILE_PREFIX = 'ricky-stock-';

// ---------------------------------------------------------------------------
// 브라우저에서 도는 조각들
// ---------------------------------------------------------------------------

/**
 * 문서 하나에서 JSON-LD 와 화면 상태를 읽는 함수.
 *
 * 사이트마다 마크업이 달라 하나의 셀렉터로는 안 된다. 그래서 "사이즈처럼 생긴 것"을
 * 넓게 훑는다 — 라벨이 사이즈 토큰(XS~XXXL, 숫자, 9.5)인 클릭 가능 요소.
 * 구매 불가 판정은 disabled / aria-disabled / 클래스명 / 취소선 중 하나라도 걸리면 불가로 본다.
 * 애매하면 "가능"이 아니라 "불가"로 기울여야 안전하다 — 없는 재고를 팔면 안 되기 때문이다.
 */
const READ_DOC = `
function readDoc(doc,win){
  /*
   * 사이즈처럼 생긴 라벨.
   * 숫자는 신발 치수 범위(5~15)로 좁힌다 — 넓게 잡으면 수량 선택의 "1" 을
   * 사이즈로 오인한다(실측: 랄프로렌에서 "1" 이 매번 첫 사이즈로 잡혔다).
   * 룰루레몬처럼 "M/L", "XXS/XS" 로 묶어 파는 경우도 사이즈다.
   */
  var SZ=/^(XXXS|XXS|XS|S|M|L|XL|XXL|XXXL|(XXS|XS|S|M|L|XL|XXL)\\/(XS|S|M|L|XL|XXL)|([5-9]|1[0-5])(\\.5)?)$/i;
  function txt(e){return (e.textContent||'').replace(/\\s+/g,' ').trim()}
  function flagged(e){
    if(!e||!e.getAttribute)return false;
    if(e.disabled===true)return true;
    if(e.getAttribute('aria-disabled')==='true')return true;
    if(e.getAttribute('data-available')==='false')return true;
    if(e.getAttribute('data-instock')==='false')return true;
    var c=(e.className||'')+' '+(e.getAttribute('data-state')||'')+' '+(e.getAttribute('data-status')||'');
    if(typeof c!=='string')c=String(c);
    return /disabled|unavailable|sold-?out|\\boos\\b|out-of-stock|notify-me/i.test(c);
  }
  function unavail(e){
    /*
     * 품절 표시가 버튼 자신에 붙어 있지 않은 경우가 많다.
     * <li class="unavailable"><input disabled><label>M</label></li> 처럼
     * 라벨을 후보로 잡으면 정작 표시는 부모나 형제 input 에 있다.
     * 그래서 자신 · 부모 1단계 · 내부 input · label[for] 이 가리키는 input 을 함께 본다.
     */
    if(flagged(e))return true;
    if(flagged(e.parentElement))return true;
    try{
      var inner=e.querySelector&&e.querySelector('input,button');
      if(flagged(inner))return true;
      var f=e.getAttribute('for');
      if(f&&flagged(doc.getElementById(f)))return true;
    }catch(err){}
    try{
      var st=win.getComputedStyle(e);
      if(st.textDecorationLine&&st.textDecorationLine.indexOf('line-through')>=0)return true;
      if(parseFloat(st.opacity)<0.5)return true;
    }catch(err){}
    return false;
  }
  function selected(e){
    if(e.getAttribute('aria-pressed')==='true')return true;
    if(e.getAttribute('aria-checked')==='true')return true;
    if(e.getAttribute('aria-selected')==='true')return true;
    if(e.checked)return true;
    return /selected|active|is-current/i.test(e.className||'');
  }
  var seen={},sizes=[],probe=[];
  var cand=doc.querySelectorAll('button,[role=radio],[role=button],label,li,a,option');
  for(var i=0;i<cand.length&&sizes.length<60;i++){
    var e=cand[i],t=txt(e);
    if(!t||t.length>5||!SZ.test(t))continue;
    if(seen[t.toUpperCase()])continue;
    seen[t.toUpperCase()]=1;
    sizes.push({label:t.toUpperCase(),available:!unavail(e),selected:selected(e)});
    /*
     * 품절 판정이 틀렸을 때 원인을 알 수 있도록 후보 요소의 속성을 그대로 담는다.
     * 사이트 마크업을 직접 볼 수 없는 상태에서 규칙을 고치려면 이 원본이 필요하다.
     */
    if(probe.length<12){
      var pe=e.parentElement;
      probe.push({label:t.toUpperCase(),tag:e.tagName,
        cls:String(e.className||'').slice(0,90),
        aria:e.getAttribute('aria-disabled'),dis:!!e.disabled,
        pTag:pe?pe.tagName:null,pCls:pe?String(pe.className||'').slice(0,90):null,
        html:(e.outerHTML||'').slice(0,220)});
    }
  }
  var col=null;
  var cs=doc.querySelectorAll('[data-testid*=colour],[data-testid*=color],[class*=swatch],[class*=colour],[class*=color]');
  for(var j=0;j<cs.length;j++){
    if(!selected(cs[j]))continue;
    var lbl=cs[j].getAttribute('aria-label')||cs[j].getAttribute('title')||txt(cs[j]);
    if(lbl){col=lbl.replace(/^(colou?r:?\\s*)/i,'').trim();break;}
  }
  var n=doc.querySelectorAll('script[type="application/ld+json"]');
  return {jsonld:[].map.call(n,function(s){return s.textContent}),
          dom:{selectedColour:col,sizes:sizes},
          probe:probe};
}`;

/**
 * 색상을 하나씩 눌러 가며 사이즈를 읽는다.
 *
 * 랄프로렌은 색상이 6개 이상이면 JSON-LD 에서 사이즈를 통째로 뺀다(실측).
 * 그러면 화면에 떠 있는 색상 하나만 알 수 있어서, 나머지는 눌러서 확인해야 한다.
 * 색상이 5개 이하인 상품은 JSON-LD 로 충분하므로 순회하지 않는다 — 시간 낭비다.
 *
 * **경로가 바뀌면 즉시 멈춘다.** 코치는 색상 클릭이 다른 상품 URL 로 이동한다(실측:
 * reagan-penny-loafer/CAP31 → reagan-loafer/CCN27-CBD). 그대로 읽으면 다른 상품의
 * 사이즈를 이 색상 것으로 기록하게 된다 — 없는 재고를 만들어 내는 셈이다.
 *
 * 그래서 이 함수는 iframe 안에서만 쓴다. 사용자가 보고 있는 탭에서 클릭하면
 * 페이지가 넘어가 수집이 통째로 날아간다.
 */
const READ_COLOURS = `
function swatchesOf(doc){
  var out=[],seen={};
  var sel='[data-testid*=colour],[data-testid*=color],[class*=swatch],[class*=colour],[class*=color]';
  var all=doc.querySelectorAll(sel);
  for(var i=0;i<all.length;i++){
    var e=all[i];
    if(e.tagName!=='BUTTON'&&e.tagName!=='A'&&e.tagName!=='LABEL'&&e.getAttribute('role')!=='radio')continue;
    var lbl=e.getAttribute('aria-label')||e.getAttribute('title')||(e.textContent||'').trim();
    if(!lbl)continue;
    lbl=lbl.replace(/^(colou?r:?\\s*)/i,'').trim();
    if(!lbl||lbl.length>40||seen[lbl])continue;
    seen[lbl]=1; out.push({el:e,label:lbl});
  }
  return out;
}
function readColours(getDoc,getWin,budget,done){
  var d0=getDoc(), w0=getWin();
  if(!d0||!w0){ done([]); return; }
  var basePath=w0.location?w0.location.pathname:'';
  var sw=swatchesOf(d0), labels=[];
  for(var i=0;i<sw.length&&labels.length<budget;i++)labels.push(sw[i].label);
  if(labels.length<2){ done([]); return; }

  var got=[], n=0;
  function step(){
    if(n>=labels.length){ done(got); return; }
    var label=labels[n++];
    var d=getDoc(), w=getWin();
    if(!d||!w){ done(got); return; }
    var list=swatchesOf(d), el=null;
    for(var k=0;k<list.length;k++)if(list[k].label===label){ el=list[k].el; break; }
    if(!el){ step(); return; }
    try{ el.click(); }catch(e){}
    setTimeout(function(){
      var dd=getDoc(), ww=getWin();
      if(!dd||!ww){ done(got); return; }
      if(ww.location&&ww.location.pathname!==basePath){ done(got); return; }
      var r=readDoc(dd,ww);
      if(r.dom.sizes.length)got.push({colour:r.dom.selectedColour||label,sizes:r.dom.sizes});
      step();
    },1400);
  }
  step();
}`;

/** 수집 결과를 파일로 내려받는다. */
const DOWNLOAD = `
function download(d){
  var u=URL.createObjectURL(new Blob([JSON.stringify(d)],{type:'application/json'}));
  var a=document.createElement('a');
  a.href=u;a.download='${CAPTURE_FILE_PREFIX}'+Date.now()+'.json';
  document.body.appendChild(a);a.click();a.remove();
  setTimeout(function(){URL.revokeObjectURL(u)},1000);
}`;

/**
 * 상품 URL 판별.
 *
 * 사이트마다 규칙이 달라 origin 별로 둔다. 모르는 사이트는 넓은 기본 규칙을 쓰되,
 * 카테고리·정책 페이지가 섞이지 않도록 최소한의 형태는 요구한다.
 */
const IS_PRODUCT = `
function isProduct(u){
  var h=location.hostname;
  if(h.indexOf('coach.com')>=0) return /\\/products\\/.+\\.html$/.test(u);
  if(h.indexOf('ralphlauren')>=0) return /[-\\/]\\d{3,12}\\.html/.test(u);
  if(h.indexOf('lululemon')>=0) return u.indexOf('/p/')>=0;
  if(h.indexOf('arcteryx')>=0) return u.indexOf('/shop/')>=0 && /-\\d{4}(\\?|#|$)/.test(u);
  if(h.indexOf('canadagoose')>=0) return /-\\d{4}[A-Z]?\\.html/.test(u);
  if(h.indexOf('tumi')>=0) return u.indexOf('/p/')>=0 || /-\\d{9,}\\.html/.test(u);
  return /\\/(products?|p)\\//.test(u) || /-\\d{3,12}\\.html/.test(u);
}`;

/**
 * URL 이 이 상품코드의 것인가.
 *
 * 코드가 URL 에 박히는 방식이 브랜드마다 다르다.
 *   코치·랄프로렌  URL 끝에 그대로      /CDZ42.html · /100066198.html
 *   아크테릭스     뒤 4자리만 남는다     X000010932 → …-0932
 */
const CODE_IN_URL = `
function codeInUrl(u,code){
  var U=u.toUpperCase(), C=String(code).toUpperCase();
  if(U.indexOf('/'+C+'.HTML')>=0)return true;
  if(/^X[0-9]{6,}$/.test(C)&&U.indexOf('-'+C.slice(-4))>=0)return true;
  return false;
}`;

/**
 * 여러 줄 JS 를 북마클릿용 한 줄로 만든다.
 *
 * `//` 주석 줄을 반드시 먼저 걷어내야 한다. 줄바꿈이 사라지면 주석이
 * 뒤따르는 코드를 통째로 삼켜 버린다(실제로 목록수집이 이걸로 깨졌다).
 * 문자열·정규식 안의 `//` 는 건드리면 안 되므로, 줄 전체가 주석인 것만 지운다.
 */
const minify = (s: string) =>
  s
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith('//'))
    .join('');

// ---------------------------------------------------------------------------

/** 단건 수집 — 상품 상세 페이지에서 그 상품 하나. */
export function bookmarkletSource(): string {
  const body = `
    ${READ_DOC}
    ${DOWNLOAD}
    var r=readDoc(document,window);
    if(!r.jsonld.length&&!r.dom.sizes.length){
      alert('이 페이지에서 상품 데이터를 찾지 못했습니다.\\n상품 상세 페이지에서 눌렀는지 확인해 주세요.');
    } else {
      download({v:${CAPTURE_VERSION},url:location.href,title:document.title,
        capturedAt:new Date().toISOString(),jsonld:r.jsonld,dom:r.dom,probe:r.probe});
    }
  `;
  return `javascript:(function(){${minify(body)}})()`;
}

/**
 * 목록 수집 — 지금 보고 있는 페이지의 상품을 전부.
 *
 * 카테고리·검색결과·위시리스트 어디서든 동작한다. 상품마다 북마크를 누르게 하면
 * 하루 30번을 눌러야 하고, 그러면 결국 아무도 안 쓴다.
 *
 * 상품 URL 은 `<a href>` 뿐 아니라 **페이지 HTML 본문에서도** 훑는다.
 * 요즘 목록 페이지는 앵커 없이 JS 로 그리는 경우가 많다 — 실측에서 코치 카테고리는
 * 앵커 상품 링크가 0건인데 HTML 안에는 상품 URL 32건이 들어 있었다.
 * 다국어 사이트는 같은 상품의 /fr/ 판이 섞이므로 현재 페이지 언어와 다르면 버린다.
 * 언어 접두어가 아예 없는 URL 도 버린다 — 코치는 /en/products/… 와 /products/… 를
 * 둘 다 내보내서, 안 거르면 같은 상품이 두 건으로 잡힌다.
 *
 * 각 상품을 **같은 출처 iframe** 으로 띄워 실제로 렌더링한 뒤 읽는다.
 * fetch 로 HTML 만 받으면 화면 상태(품절 버튼)를 알 수 없기 때문이다.
 * iframe 이 막히면(X-Frame-Options: DENY) fetch 로 물러난다 — JSON-LD 만이라도 건진다.
 */
/**
 * 사이트별 카탈로그 상품코드.
 *
 * 브랜드마다 사정이 다르다 — 코치·아크테릭스는 코드가 다 있고, 룰루레몬은 하나도 없다.
 * 코드가 없는 브랜드에 코드 필터를 걸면 전부 걸러져 0건이 된다.
 * 그래서 "코드 목록이 비어 있다"는 "거르지 말라"는 뜻으로 다룬다.
 */
export type CodesByHost = Record<string, string[]>;

/**
 * 호스트별 등록 상품명. 알림에만 쓴다.
 *
 * "겹치는 게 없다"는 알림만으로는 목록을 잘못 열었는지, 애초에 등록이 안 된 상품인지
 * 구분할 수 없다. 등록된 이름을 그대로 보여 주면 사용자가 바로 판단할 수 있다.
 */
export type NamesByHost = Record<string, string[]>;

export function batchBookmarkletSource(
  codesByHost: CodesByHost = {},
  namesByHost: NamesByHost = {},
): string {
  const body = `
    ${READ_DOC}
    ${READ_COLOURS}
    ${DOWNLOAD}
    ${IS_PRODUCT}
    ${CODE_IN_URL}
    var BY_HOST=${JSON.stringify(codesByHost)};
    var NAME_HOST=${JSON.stringify(namesByHost)};
    var WANT=[],WANT_NAMES=[];
    for(var hk in BY_HOST){ if(location.hostname.indexOf(hk)>=0){ WANT=BY_HOST[hk]; WANT_NAMES=NAME_HOST[hk]||[]; break; } }
    var MAX=60, GAP=1200, RENDER=6000;
    var langM=location.pathname.match(/^\\/([a-z]{2})\\//);
    var lang=langM?langM[1]:null;
    function sameLang(u){
      if(!lang)return true;
      var m=u.replace(location.origin,'').match(/^\\/([a-z]{2})\\//);
      return !!m&&m[1]===lang;
    }
    var cands=[].map.call(document.querySelectorAll('a[href]'),function(a){return a.href});
    var ABS=/https?:\\/\\/[^"'\\s<>\\\\)]+/g;
    cands=cands.concat(document.documentElement.outerHTML.match(ABS)||[]);
    var urls=[];
    for(var i=0;i<cands.length;i++){
      var u=(cands[i]||'').split('#')[0].split('?')[0];
      if(u.indexOf(location.origin)!==0)continue;
      if(!sameLang(u))continue;
      if(!isProduct(u))continue;
      if(urls.indexOf(u)<0)urls.push(u);
    }
    if(!urls.length){
      alert('이 페이지에서 상품 링크를 찾지 못했습니다.\\n카테고리·검색결과·전체보기 페이지에서 눌러 주세요.');
      return;
    }
    /*
     * 카탈로그에 등록된 상품만 남긴다.
     * 전체 목록에는 수백 건이 있지만 우리가 파는 건 그중 일부다.
     * 다 받으면 시간만 걸리고 어차피 대조 단계에서 버려진다.
     */
    var found=urls.length, hitCodes={};
    if(WANT.length){
      var keep=[];
      for(var k=0;k<urls.length;k++){
        for(var c=0;c<WANT.length;c++){
          if(codeInUrl(urls[k],WANT[c])){ keep.push(urls[k]); hitCodes[WANT[c]]=1; break; }
        }
      }
      urls=keep;
      if(!urls.length){
        alert('이 페이지에서 카탈로그 상품을 찾지 못했습니다.\\n'+
          '상품 링크는 '+found+'건 보이는데 등록된 상품과 겹치는 게 없습니다.\\n\\n'+
          '이 브랜드에 등록된 상품 '+WANT_NAMES.length+'건:\\n'+
          (WANT_NAMES.length?'  '+WANT_NAMES.join('\\n  '):'  (없음)')+'\\n\\n'+
          '찾는 상품이 이 목록에 없으면 카탈로그에 등록되지 않은 것입니다.\\n'+
          '있는데도 안 걸렸다면 전체보기 목록에서 끝까지 스크롤했는지 확인해 주세요.');
        return;
      }
    }
    var n=Math.min(urls.length,MAX);
    var msg=WANT.length
      ? '상품 '+found+'건 중 카탈로그 상품 '+urls.length+'건을 찾았습니다.\\n'
      : '상품 '+urls.length+'건을 찾았습니다.\\n';
    if(!confirm(msg+n+'건을 수집합니다. 약 '+Math.ceil(n*(RENDER+GAP)/60000)+'분 걸립니다.\\n\\n창을 닫지 말고 기다려 주세요.'))return;
    urls=urls.slice(0,n);

    var box=document.createElement('div');
    box.style.cssText='position:fixed;z-index:2147483647;right:20px;bottom:20px;background:#111;color:#fff;padding:14px 18px;border-radius:10px;font:13px sans-serif;box-shadow:0 4px 20px rgba(0,0,0,.3)';
    document.body.appendChild(box);
    var out=[],idx=0;

    function one(url,cb){
      var f=document.createElement('iframe');
      f.style.cssText='position:fixed;left:-9999px;top:0;width:1280px;height:900px;border:0';
      var done=false;
      function finish(item){
        if(done)return; done=true;
        try{f.remove()}catch(e){}
        cb(item);
      }
      f.onload=function(){
        setTimeout(function(){
          try{
            var d=f.contentDocument;
            if(!d)throw new Error('문서 접근 불가');
            var r=readDoc(d,f.contentWindow);

            /*
             * JSON-LD 에 색상별 사이즈가 들어 있으면 그걸 쓴다.
             * 없을 때만 색상을 눌러 가며 읽는다 — 색상 수만큼 시간이 늘어나므로
             * 필요할 때만 한다. (랄프로렌은 색상 6개 이상이면 사이즈를 빼 버린다)
             */
            var needsCycle=true;
            for(var q=0;q<r.jsonld.length&&needsCycle;q++){
              try{
                var o=JSON.parse(r.jsonld[q]);
                var ns=(o&&o['@graph'])?o['@graph']:[o];
                for(var z=0;z<ns.length;z++){
                  var hv=ns[z]&&ns[z].hasVariant;
                  if(hv&&hv.length){
                    var withSize=0;
                    for(var w=0;w<hv.length;w++)if(hv[w].size&&hv[w].color)withSize++;
                    if(withSize>0)needsCycle=false;
                  }
                }
              }catch(err){}
            }

            if(!needsCycle){
              finish({url:url,title:d.title||'',jsonld:r.jsonld,dom:r.dom});
              return;
            }
            box.textContent='수집 중 '+(idx+1)+' / '+urls.length+' — 색상별 확인';
            readColours(
              function(){ try{ return f.contentDocument; }catch(e){ return null; } },
              function(){ try{ return f.contentWindow; }catch(e){ return null; } },
              14,
              function(byColour){
                r.dom.byColour=byColour;
                finish({url:url,title:d.title||'',jsonld:r.jsonld,dom:r.dom});
              });
            return;
          }catch(e){
            // iframe 이 막혔다 — JSON-LD 만이라도 건진다
            fetch(url,{credentials:'include'}).then(function(res){return res.text()}).then(function(h){
              var m=h.match(/<script[^>]*application\\/ld\\+json[^>]*>[\\s\\S]*?<\\/script>/gi)||[];
              finish({url:url,title:'',jsonld:m.map(function(b){
                return b.replace(/^<script[^>]*>/i,'').replace(/<\\/script>$/i,'')})});
            }).catch(function(err){ finish({url:url,title:'',jsonld:[],error:String(err).slice(0,80)}); });
          }
        },RENDER);
      };
      f.onerror=function(){ finish({url:url,title:'',jsonld:[],error:'iframe 로드 실패'}); };
      f.src=url;
      document.body.appendChild(f);
      // 색상 순회는 색상당 약 1.1초가 든다. 넉넉히 잡지 않으면 멀쩡한 수집이 잘린다.
      setTimeout(function(){ finish({url:url,title:'',jsonld:[],error:'시간 초과'}) },RENDER+40000);
    }

    function step(){
      if(idx>=urls.length){
        box.textContent='완료 — 파일을 저장합니다';
        if(WANT.length){
          var missed=[];
          for(var c=0;c<WANT.length;c++)if(!hitCodes[WANT[c]])missed.push(WANT[c]);
          if(missed.length)setTimeout(function(){
            alert('수집 완료 '+urls.length+'건.\\n\\n이 페이지에서 못 찾은 카탈로그 상품 '+missed.length+'건:\\n'+
              missed.slice(0,15).join(', ')+(missed.length>15?' …':'')+
              '\\n\\n다른 카테고리에 있거나 판매 종료된 상품입니다.');
          },1500);
        }
        download({v:${CAPTURE_VERSION},url:location.href,title:document.title,
          capturedAt:new Date().toISOString(),jsonld:[],batch:out});
        setTimeout(function(){box.remove()},3000);
        return;
      }
      box.textContent='수집 중 '+(idx+1)+' / '+urls.length;
      one(urls[idx],function(item){
        out.push(item); idx++;
        setTimeout(step,GAP);
      });
    }
    step();
  `;
  return `javascript:(function(){${minify(body)}})()`;
}

// ---------------------------------------------------------------------------

/**
 * 설치용 HTML 페이지.
 *
 * 긴 `javascript:` 한 줄을 손으로 복사·붙여넣기 하는 건 실수하기 쉽다.
 * 브라우저에서 이 페이지를 열고 링크를 북마크바로 **끌어다 놓기만** 하면 설치가 끝난다.
 */
export function bookmarkletPage(
  codesByHost: CodesByHost = {},
  namesByHost: NamesByHost = {},
): string {
  const attr = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

  return `<!doctype html>
<html lang="ko"><head><meta charset="utf-8">
<title>RICKY 재고수집 북마클릿 설치</title>
<style>
  body{font:16px/1.7 -apple-system,"Segoe UI","Malgun Gothic",sans-serif;
       max-width:760px;margin:48px auto;padding:0 24px;color:#1a1a1a}
  h1{font-size:22px;margin:0 0 8px}
  h2{font-size:17px;margin:36px 0 10px}
  .lead{color:#666;margin:0 0 32px}
  .drag{display:inline-block;padding:14px 28px;background:#111;color:#fff;
        border-radius:8px;text-decoration:none;font-weight:600;cursor:grab}
  .drag.alt{background:#1d4ed8}
  .drag:active{cursor:grabbing}
  .box{background:#f6f6f6;border-radius:10px;padding:20px 24px;margin:16px 0}
  .box p{margin:0 0 12px}
  ol{padding-left:20px} li{margin:8px 0}
  code{background:#eee;padding:2px 6px;border-radius:4px;font-size:14px}
  table{border-collapse:collapse;width:100%;font-size:14px;margin:12px 0}
  th,td{border-bottom:1px solid #ddd;padding:9px 8px;text-align:left;vertical-align:top}
  th{font-size:13px;color:#666}
  .warn{border-left:3px solid #d97706;background:#fffbeb;color:#7c4a03;
        padding:14px;border-radius:0 8px 8px 0;margin:24px 0}
</style></head><body>

<h1>RICKY 재고수집 북마클릿</h1>
<p class="lead">브랜드 공식몰에서 색상·사이즈별 재고를 파일로 저장합니다.
북마클릿은 주소 대신 코드가 든 즐겨찾기라, 클릭하면 <b>지금 보고 있는 페이지에서</b> 실행됩니다.</p>

<div class="box">
  <p><strong>아래 두 버튼을 북마크바로 끌어다 놓으세요.</strong>
     북마크바가 안 보이면 <code>Ctrl+Shift+B</code>.</p>
  <p style="margin:20px 0">
    <a class="drag alt" href="${attr(batchBookmarkletSource(codesByHost, namesByHost))}">RICKY 목록수집</a>
    &nbsp;&nbsp;
    <a class="drag" href="${attr(bookmarkletSource())}">RICKY 재고수집</a>
  </p>
</div>

<h2>둘의 차이</h2>
<table>
  <tr><th>　</th><th>목록수집 (파랑)</th><th>재고수집 (검정)</th></tr>
  <tr><td><b>어디서</b></td>
      <td>카테고리 · 검색결과 · 위시리스트</td>
      <td>상품 상세 페이지</td></tr>
  <tr><td><b>한 번에</b></td>
      <td>${Object.values(codesByHost).some((c) => c.length)
        ? '그 목록에서 <b>카탈로그에 등록된 상품만</b>'
        : '그 목록의 상품 전부 (최대 60건)'}</td>
      <td>상품 1건</td></tr>
  <tr><td><b>걸리는 시간</b></td>
      <td>상품당 약 7초 (20건이면 2~3분)</td>
      <td>즉시</td></tr>
  <tr><td><b>쓰는 때</b></td>
      <td><b>평소 점검.</b> 한 번 눌러 두고 기다리면 된다</td>
      <td>매입 직전 한 상품을 정확히 확인할 때</td></tr>
</table>

<h2>쓰는 법</h2>
<ol>
  <li><b>목록수집</b> — 브랜드 공식몰의 <b>전체보기 목록</b>을 연다 →
      <b>끝까지 스크롤</b>해서 상품을 다 띄운다 → 북마크 클릭 → 확인 →
      <b>창을 닫지 말고</b> 기다린다 → 파일 하나가 저장된다.
      카탈로그에 등록된 상품만 골라 담으므로 브랜드당 한 번이면 된다.
      (상품코드가 없는 브랜드는 목록 전체를 담고 나중에 이름으로 대조한다)</li>
  <li><b>재고수집</b> — 상품 상세 페이지에서 북마크 클릭 → 파일 저장.
      색상마다 사이즈가 다르면 색상을 바꿔 가며 여러 번 눌러도 된다(합쳐진다)</li>
  <li>마지막에 터미널에서 한 번만: <code>npm run stock:all</code></li>
</ol>

<div class="warn">
  <b>목록수집 전에 목록을 끝까지 스크롤하세요.</b> 화면에 뜬 상품만 읽습니다 —
  더보기·무한스크롤로 아직 안 뜬 상품은 페이지 HTML 에 없습니다.<br>
  <b>상품을 화면에 띄워 읽으므로 시간이 걸립니다.</b> 도는 동안 탭을 닫으면 중단되지만,
  다른 탭에서 작업하셔도 됩니다.<br>
  "카탈로그 상품을 찾지 못했습니다" 가 뜨면 그 목록에 등록 상품이 없다는 뜻이니
  다른 카테고리에서 시도해 주세요.
</div>

</body></html>`;
}

/** 터미널에 출력할 설치 안내 */
export function bookmarkletHelp(pagePath: string, downloadsHint: string): string {
  return [
    '반자동 재고 수집 — 북마클릿',
    '',
    '북마클릿은 "주소 대신 코드가 든 즐겨찾기"다. 클릭하면 페이지 이동 없이',
    '지금 보고 있는 페이지에서 코드가 실행된다.',
    '',
    '두 개를 설치한다.',
    '  목록수집  카테고리·검색결과에서 상품 전부를 한 번에 (평소 점검용)',
    '  재고수집  상품 상세 1건을 정확히 (매입 직전 확인용)',
    '',
    '── 설치 (한 번만) ──────────────────────────────────────────',
    '아래 파일을 크롬에서 열고, 두 버튼을 북마크바로 끌어다 놓으면 끝이다.',
    '',
    `   ${pagePath}`,
    '',
    '── 사용 ────────────────────────────────────────────────────',
    '1. 브랜드 공식몰의 전체보기 목록을 열고 끝까지 스크롤한다',
    '2. "RICKY 목록수집" 클릭 → 확인 → 기다리면 파일 하나가 저장된다',
    '   (카탈로그에 등록된 상품만 골라 담는다 — 브랜드당 한 번이면 된다)',
    '3. 마지막에 한 번만 아래를 실행한다',
    '',
    `   npm run stock:all`,
    '',
    `   (수집 파일은 ${downloadsHint} 에서 읽는다)`,
    '',
  ].join('\n');
}
