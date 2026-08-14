// blog/layout.tsx 와 같은 이유 — 루트 <main> 의 폭 제한이 사라져서 여기서 되돌린다.
export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-3xl px-6 py-12">{children}</div>;
}
