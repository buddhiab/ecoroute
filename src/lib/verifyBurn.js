import { ethers } from "ethers"
import { ECO_TOKEN_ADDRESS } from "./contracts/ecoToken"

const TRANSFER_IFACE = new ethers.Interface([
  "event Transfer(address indexed from, address indexed to, uint256 value)",
])

// Proves a "burn" (ECO sent to the municipal treasury) really happened on-chain,
// from the receipt alone — the amount comes from the chain, never from the client.
// Succeeds only if the tx confirmed, and emitted ECO Transfer event(s) from
// `from` (the citizen's wallet) to `treasury`. Multiple matching events are summed.
export async function verifyBurnTx(provider, hash, { from, treasury }) {
  const receipt = await provider.getTransactionReceipt(hash)
  if (!receipt) return { ok: false, reason: "Transaction not found or not confirmed yet." }
  if (receipt.status !== 1) return { ok: false, reason: "That transaction failed on-chain." }

  let total = 0n
  for (const log of receipt.logs) {
    if (log.address.toLowerCase() !== ECO_TOKEN_ADDRESS.toLowerCase()) continue
    let parsed
    try {
      parsed = TRANSFER_IFACE.parseLog(log)
    } catch {
      continue
    }
    if (!parsed || parsed.name !== "Transfer") continue
    if (
      parsed.args.from.toLowerCase() === from.toLowerCase() &&
      parsed.args.to.toLowerCase() === treasury.toLowerCase()
    ) {
      total += parsed.args.value
    }
  }

  if (total === 0n) {
    return { ok: false, reason: "No ECO transfer from your wallet to the treasury was found in that transaction." }
  }
  return {
    ok: true,
    ecoAmount: Number(ethers.formatUnits(total, 18)),
    blockNumber: receipt.blockNumber,
  }
}
