"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AuthPage() {
  const router = useRouter();
  const [passphrase, setPassphrase] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ passphrase }),
    });

    if (res.ok) {
      router.push("/");
    } else {
      setError("合言葉が違います");
    }
    setLoading(false);
  };

  return (
    <main>
      <h1>合言葉を入力してください</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="password"
          value={passphrase}
          onChange={(e) => setPassphrase(e.target.value)}
          placeholder="合言葉"
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? "確認中..." : "入力"}
        </button>
      </form>
      {error && <p>{error}</p>}
    </main>
  );
}
