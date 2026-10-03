// Persists a connected wallet address to the citizen's profile row via the
// server-side /api/save-wallet route. The API uses the service-role client to
// bypass RLS (the profiles table UPDATE policy blocks anon-key client writes).
// Called from every place a wallet can be connected (shell header, rewards page,
// profile page) so "connected" always means the same thing everywhere —
// including to /api/claim-rewards, which reads this saved address.
export async function saveWalletAddress(address) {
  const res = await fetch("/api/save-wallet", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ address }),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    const err = new Error(data.error || `save-wallet HTTP ${res.status}`)
    console.error("[saveWalletAddress] failed:", err.message)
    throw err
  }
}
