# 영상 출처

| 파일 | 출처 | 라이선스 |
|---|---|---|
| `hero-rocky-mountain.mp4` | Coverr — `coverr-edge-of-a-rocky-mountain-7100` | [Coverr License](https://coverr.co/license) — 상업적 사용 허용, 고지 의무 없음 |

**임시 자산이다.** 관문 사진(`public/images/gateways/ATTRIBUTION.md`)과 같은 처지로,
캘거리 현지 실촬영본으로 교체하는 것이 전제다. 그때 이 줄도 함께 지운다.

## 알아 둘 것

- **11MB다.** 홈 첫 화면에서 받는 용량이라 작지 않다. `preload="metadata"` 로 두어
  메타데이터만 먼저 받게 했지만, 교체할 때는 720p·6Mbps 이하로 다시 인코딩할 것.
- **포스터 이미지가 없다.** 이 환경에 `ffmpeg` 가 없어 첫 프레임을 뽑지 못했다.
  대신 섹션 배경을 `bg-ink` 로 두어 영상이 그려지기 전에도 "검은 지면 + 흰 글자"가
  의도한 모습 그대로 성립한다. 나중에 포스터를 넣으면 첫 페인트가 더 나아진다.
- **소리가 없어야 한다.** `muted` 없이는 브라우저가 자동재생을 막는다. 장식 영상이므로
  소리를 켤 이유도 없고, 그래서 자막도 필요 없다(`aria-hidden`).
