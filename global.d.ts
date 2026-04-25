// 🔥 CSS import 타입 해결 (핵심)
declare module '*.css' {
  const content: Record<string, string>
  export default content
}
