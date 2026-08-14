// 루트 레이아웃의 <main> 이 랜딩을 위해 폭 제한을 놓았으므로, 읽기용 화면은
// 여기서 원래 폭을 되돌린다. 기존 blog 화면의 외형을 그대로 유지하기 위한 것이다.
export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-3xl px-6 py-12">{children}</div>;
}
