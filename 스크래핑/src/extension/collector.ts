/**
 * 페이지 안에서 도는 수집 코드.
 *
 * 추출 규칙은 **북마클릿과 한 벌**이다(`collectorSource()`). 여기서는 그 위에
 * "색상을 돌아야 하는가"만 판단해 붙인다 — 목록수집 북마클릿과 같은 판단이다.
 *
 * 랄프로렌은 색상이 6개 이상이면 JSON-LD 에서 사이즈를 통째로 뺀다(실측).
 * 그때만 색상을 눌러 가며 읽는다. 5개 이하면 JSON-LD 로 충분하고, 순회는 색상 수만큼
 * 시간이 늘어난다.
 *
 * **경로가 바뀌면 순회를 멈춘다.** 코치는 색상 클릭이 다른 상품 URL 로 이동한다
 * (실측: reagan-penny-loafer/CAP31 → reagan-loafer/CCN27-CBD). 그대로 읽으면
 * 다른 상품의 사이즈를 이 색상 것으로 기록한다 — 없는 재고를 만드는 셈이다.
 * 그 판단은 `readColours` 안에 이미 들어 있다.
 */
export const COLLECTOR_TAIL = String.raw`
/**
 * @param want 고시 항목(소재·취급주의·원산지)도 걷을지. 카탈로그에 아직 빈 항목이
 *   있는 상품만 true 다 — 소재는 안 바뀌므로 매 회차 걷을 이유가 없다.
 */
window.__rickyCollect = function (want) {
  var r = readDoc(document, window);

  // JSON-LD 에 색상×사이즈가 이미 있으면 순회하지 않는다.
  var needsCycle = true;
  for (var q = 0; q < r.jsonld.length && needsCycle; q++) {
    try {
      var o = JSON.parse(r.jsonld[q]);
      var ns = (o && o['@graph']) ? o['@graph'] : [o];
      for (var z = 0; z < ns.length; z++) {
        var hv = ns[z] && ns[z].hasVariant;
        if (hv && hv.length) {
          var withSize = 0;
          for (var w = 0; w < hv.length; w++) if (hv[w].size && hv[w].color) withSize++;
          if (withSize > 0) needsCycle = false;
        }
      }
    } catch (err) {}
  }

  /*
   * 고시 항목(소재·취급주의·원산지)도 같은 방문에서 걷는다. 추가 요청이 없다 —
   * 이걸 따로 받으러 가면 같은 페이지를 두 번 여는 셈이다.
   */
  var base = {
    title: document.title,
    jsonld: r.jsonld,
    dom: r.dom,
    probe: r.probe,
    sections: (want && typeof readSections === 'function' ? readSections(document) : undefined),
  };
  if (!needsCycle) return Promise.resolve(base);

  return new Promise(function (resolve) {
    var settled = false;
    var finish = function (byColour) {
      if (settled) return;
      settled = true;
      if (byColour) base.dom.byColour = byColour;
      resolve(base);
    };
    // 색상당 약 1.4초. 넉넉히 잡지 않으면 멀쩡한 수집이 잘린다.
    setTimeout(function () { finish(null); }, 45000);
    readColours(
      function () { return document; },
      function () { return window; },
      14,
      finish
    );
  });
};
`;
