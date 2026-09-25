"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { getContractSigner, getEcoBalance, burnEcoTokens } from "@/lib/web3"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

// Conversion rate: 1 ECO = 10 LKR
const EXCHANGE_RATE = 10

export default function TokenStore() {
    const [userAddress, setUserAddress] = useState(null)
    const [ecoBalance, setEcoBalance] = useState("0")
    const [statusMessage, setStatusMessage] = useState(null)
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Bank form state
    const [tokensToCash, setTokensToCash] = useState("")
    const [accountName, setAccountName] = useState("")
    const [accountNumber, setAccountNumber] = useState("")
    const [bankName, setBankName] = useState("Commercial Bank")

    useEffect(() => {
        const initWallet = async () => {
            try {
                const { signer } = await getContractSigner()
                const address = await signer.getAddress()
                setUserAddress(address)
                const balance = await getEcoBalance(address)
                setEcoBalance(balance)
            } catch (err) {
                // Wallet not connected
            }
        }
        initWallet()
    }, [])

    const connectWallet = async () => {
        try {
            const { signer } = await getContractSigner()
            const address = await signer.getAddress()
            setUserAddress(address)
            const balance = await getEcoBalance(address)
            setEcoBalance(balance)
        } catch (error) {
            console.error("Wallet connection failed:", error)
            alert("Failed to connect wallet.")
        }
    }

    // Calculate LKR amount dynamically
    const calculatedLKR = tokensToCash && !isNaN(tokensToCash) ? Number(tokensToCash) * EXCHANGE_RATE : 0

    const handleBankWithdrawal = async (e) => {
        e.preventDefault()
        if (!userAddress) {
            alert("Please connect your MetaMask wallet first.")
            return
        }

        const tokensNum = Number(tokensToCash)
        const currentBal = Number(ecoBalance)

        if (tokensNum <= 0) {
            alert("Please enter a valid amount of ECO tokens to convert.")
            return
        }

        if (tokensNum > currentBal) {
            alert(`Insufficient balance! You want to cash out ${tokensNum} ECO, but you only have ${ecoBalance} ECO.`)
            return
        }

        setIsSubmitting(true)
        setStatusMessage("⏳ Processing payout request...")

        try {
            // 1. Log payout request to Supabase
            const { error } = await supabase.from("BankPayouts").insert([
                {
                    wallet_address: userAddress,
                    eco_burned: tokensNum,
                    lkr_amount: calculatedLKR,
                    account_name: accountName,
                    account_number: accountNumber,
                    bank_name: bankName,
                    status: "Pending Transfer"
                }
            ])

            if (error) throw error

            // 2. Trigger Smart Contract (MetaMask Popup)
            setStatusMessage("⏳ Please confirm the transaction in MetaMask...")
            await burnEcoTokens(tokensNum)

            setStatusMessage(`🎉 Success! ${tokensNum} ECO converted to LKR ${calculatedLKR.toLocaleString()}. Direct bank transfer initiated.`);

            // Clear form
            setTokensToCash("")
            setAccountName("")
            setAccountNumber("")

            // Refresh balance
            const updatedBalance = await getEcoBalance(userAddress)
            setEcoBalance(updatedBalance)

        } catch (err) {
            console.error("Withdrawal error:", err)
            setStatusMessage(`❌ Payout request failed: ${err.message}`)
        } finally {
            setIsSubmitting(false)
            setTimeout(() => setStatusMessage(null), 8000)
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans">
            <div className="max-w-5xl mx-auto space-y-8">

                {/* Header & Wallet Widget */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <h1 className="text-4xl font-black text-slate-800 tracking-tight">ECO Payout Gateway</h1>
                        <p className="text-lg text-slate-600 mt-1">Convert your municipal ECO tokens directly into Sri Lankan Rupees (LKR).</p>
                    </div>

                    <Card className="w-full md:w-auto shadow-sm border-t-4 border-t-blue-500 shrink-0 bg-white">
                        <CardContent className="p-4">
                            {userAddress ? (
                                <div className="flex flex-col gap-1">
                                    <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">WALLET CONNECTED</p>
                                    <p className="text-sm font-mono text-slate-700 bg-slate-100 px-2 py-1 rounded">
                                        {`${userAddress.slice(0, 6)}...${userAddress.slice(-4)}`}
                                    </p>
                                    <div className="mt-2 flex items-center gap-1.5 font-black text-blue-600 text-lg">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                                        </svg>
                                        {ecoBalance} ECO
                                    </div>
                                </div>
                            ) : (
                                <Button
                                    onClick={connectWallet}
                                    variant="outline"
                                    className="w-full border-blue-500 text-blue-600 hover:bg-blue-50 font-bold"
                                >
                                    Connect Wallet
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Live Exchange Rate Card */}
                <div className="bg-gradient-to-r from-green-600 to-emerald-700 p-6 rounded-2xl text-white shadow-md flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-green-200">Current Municipality Conversion Rate</p>
                        <p className="text-3xl font-black mt-1">1 ECO = Rs. {EXCHANGE_RATE}.00 LKR</p>
                        <p className="text-sm text-green-100 mt-1">Direct deposit available for all major Sri Lankan banking networks.</p>
                    </div>
                    <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm text-center min-w-[140px]">
                        <p className="text-xs uppercase font-semibold text-green-200">Your Fiat Value</p>
                        <p className="text-2xl font-black mt-1">Rs. {(Number(ecoBalance) * EXCHANGE_RATE).toLocaleString()}</p>
                    </div>
                </div>

                {/* Global Status Banner */}
                {statusMessage && (
                    <div className={`p-4 rounded-xl font-bold text-center border shadow-sm ${statusMessage.includes("❌") ? "bg-red-50 text-red-700 border-red-200" :
                            statusMessage.includes("🎉") ? "bg-green-50 text-green-700 border-green-200" :
                                "bg-blue-50 text-blue-700 border-blue-200"
                        }`}>
                        {statusMessage}
                    </div>
                )}

                {/* Withdrawal Form Card */}
                <Card className="shadow-sm border-t-4 border-t-green-500 bg-white">
                    <CardHeader>
                        <CardTitle className="text-2xl font-bold text-slate-800">🏦 Request Direct Bank Payout</CardTitle>
                        <CardDescription>Enter your bank account details and the number of ECO tokens you want to convert to cash.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleBankWithdrawal} className="space-y-6">

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Token Input */}
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700">ECO Tokens to Cash Out</label>
                                    <input
                                        type="number"
                                        placeholder="e.g. 50"
                                        min="1"
                                        max={ecoBalance}
                                        value={tokensToCash}
                                        onChange={(e) => setTokensToCash(e.target.value)}
                                        className="w-full p-3 rounded-md border border-slate-300 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-green-500"
                                        required
                                    />
                                    <p className="text-xs text-slate-500 font-medium">
                                        You will receive: <span className="font-bold text-green-600">Rs. {calculatedLKR.toLocaleString()}.00 LKR</span>
                                    </p>
                                </div>

                                {/* Bank Selection */}
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700">Select Bank</label>
                                    <select
                                        value={bankName}
                                        onChange={(e) => setBankName(e.target.value)}
                                        className="w-full p-3 rounded-md border border-slate-300 bg-white font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-green-500"
                                    >
                                        <option value="Commercial Bank">Commercial Bank</option>
                                        <option value="Hatton National Bank (HNB)">Hatton National Bank (HNB)</option>
                                        <option value="Sampath Bank">Sampath Bank</option>
                                        <option value="Bank of Ceylon (BOC)">Bank of Ceylon (BOC)</option>
                                        <option value="People's Bank">People&apos;s Bank</option>
                                        <option value="DFCC Bank">DFCC Bank</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Account Holder Name */}
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700">Account Holder Name</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. A.B. Perera"
                                        value={accountName}
                                        onChange={(e) => setAccountName(e.target.value)}
                                        className="w-full p-3 rounded-md border border-slate-300 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-green-500"
                                        required
                                    />
                                </div>

                                {/* Account Number */}
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700">Bank Account Number</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. 8012345678"
                                        value={accountNumber}
                                        onChange={(e) => setAccountNumber(e.target.value)}
                                        className="w-full p-3 rounded-md border border-slate-300 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-green-500"
                                        required
                                    />
                                </div>
                            </div>

                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-bold text-base shadow-sm transition-all"
                            >
                                {isSubmitting ? "Submitting Payout Request..." : `Convert to Rs. ${calculatedLKR.toLocaleString()} LKR & Withdraw`}
                            </Button>

                        </form>
                    </CardContent>
                </Card>

            </div>
        </div>
    )
}