import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    /*
      Next 16부터 quality 허용값을 명시해야 한다 — 안 그러면 75 외의 값이
      조용히 75로 깎인다(01-app/03-api-reference/02-components/image.md).
      90은 PDP 갤러리 전용이다. 원본이 이미 손실 압축된 webp라
      기본 75로 다시 구우면 이중 압축이 눈에 띈다.
    */
    qualities: [75, 90],
  },
};

export default nextConfig;
