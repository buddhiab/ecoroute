import { supabase } from "@/lib/supabase"

// Persists a connected wallet address to the citizen's profile row. Called
// from every place a wallet can be connected (shell header, rewards page,
// profile page) so "connected" always means the same thing everywhere —
// including to /api/claim-rewards, which reads this saved address, not
// whatever MetaMask happens to be connected to in the current tab.
export async function saveWalletAddress(address) {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return
  await supabase
    .from("profiles")
    .update({ wallet_address: address })
    .eq("email", session.user.email)
    .eq("role", "citizen")
}
