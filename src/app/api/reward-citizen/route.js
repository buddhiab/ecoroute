import { NextResponse } from "next/server"
import { ethers } from "ethers"
import { ECO_TOKEN_ADDRESS, ECO_TOKEN_ABI } from "@/lib/contracts/ecoToken"

// This route runs SERVER-SIDE using the contract owner private key.
// The citizen's wallet NEVER needs to be the contract owner.
export async function POST(request) {
  try {
    const { citizenAddress } = await request.json()

    if (!citizenAddress || !ethers.isAddress(citizenAddress)) {
      return NextResponse.json({ error: "Invalid citizen address." }, { status: 400 })
    }

    const privateKey = process.env.CONTRACT_OWNER_PRIVATE_KEY
    if (!privateKey) {
      return NextResponse.json(
        { error: "Server is not configured for token rewards. Add CONTRACT_OWNER_PRIVATE_KEY to .env.local." },
        { status: 500 }
      )
    }

    // Connect to Sepolia with the owner wallet
    const provider = new ethers.JsonRpcProvider(
      process.env.SEPOLIA_RPC_URL || "https://ethereum-sepolia-rpc.publicnode.com"
    )
    const ownerWallet = new ethers.Wallet(privateKey, provider)
    const contract = new ethers.Contract(ECO_TOKEN_ADDRESS, ECO_TOKEN_ABI, ownerWallet)

    // Call rewardCitizen as the contract owner
    const tx = await contract.rewardCitizen(citizenAddress)
    const receipt = await tx.wait()

    return NextResponse.json({
      success: true,
      txHash: receipt.hash,
    })
  } catch (err) {
    console.error("[reward-citizen]", err)
    const msg = err?.shortMessage || err?.message || "Transaction failed"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
