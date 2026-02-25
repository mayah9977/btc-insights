"use client";

import React, { useState } from "react";
import { getAuth, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);

    try {
      const auth = getAuth();
      await signInWithEmailAndPassword(auth, email, pw);

      // 🔥 서버 세션 생성 (쿠키 설정)
      await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      router.push("/ko/casino");

    } catch (e: any) {
      setErr(e?.message || "로그인 실패");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    try {
      const auth = getAuth();

      // 🔥 Firebase 로그아웃
      await signOut(auth);

      // 🔥 서버 쿠키 삭제
      await fetch("/api/logout", {
        method: "POST",
      });

      router.refresh();
      alert("로그아웃 완료");

    } catch (e: any) {
      alert("로그아웃 실패");
    }
  }

  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-semibold">Login</h1>

      <form onSubmit={onSubmit} className="mt-4 space-y-3">
        <input
          type="email"
          placeholder="이메일"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border rounded px-3 py-2"
          required
        />

        <input
          type="password"
          placeholder="비밀번호"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          className="w-full border rounded px-3 py-2"
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full border rounded px-3 py-2"
        >
          {loading ? "로그인 중…" : "로그인"}
        </button>

        {err && <p className="text-sm text-red-600">{err}</p>}
      </form>

      {/* 🔥 로그아웃 버튼 추가 */}
      <div className="mt-6">
        <button
          onClick={handleLogout}
          className="w-full border rounded px-3 py-2 bg-red-600 text-white"
        >
          로그아웃
        </button>
      </div>
    </main>
  );
}
