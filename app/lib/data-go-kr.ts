// 공공데이터포털(data.go.kr) 인증키 — bokjiro.ts · gov24.ts 가 같이 쓴다.
//
// 포털은 같은 키를 Encoding(%2B 등으로 바뀐 것)과 Decoding(원래 문자열) 두 모양으로 보여준다.
// 어느 쪽을 넣어도 동작하게 원래 문자열로 되돌린다. Encoding 키를 그대로 쓰면 주소에 넣을 때
// 한 번 더 인코딩되어 「등록되지 않은 서비스키」가 난다.

export function dataGoKrKey(): string | null {
  const raw = process.env.DATA_GO_KR_KEY?.trim().replace(/^["']|["']$/g, "");
  if (!raw) return null;
  if (!/%[0-9A-Fa-f]{2}/.test(raw)) return raw;
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}
