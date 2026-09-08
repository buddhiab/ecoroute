"use client";

import { useState } from "react";
import { rewardCitizenTokens, getContractSigner } from "@/lib/web3"; // Adjust path if needed

export default function RewardCard() {
    const [walletAddress, setWalletAddress] = useState("");
    const [status, setStatus] = useState("Idle");
    const [isLoading, setIsLoading] = useState(false);

    // 1. Connect the wallet
    const connectWallet = async () => {
        try {
            setIsLoading(true);
            const { signer } = await getContractSigner();
            const address = await signer.getAddress();
            setWalletAddress(address);
            setStatus("Wallet connected successfully!");
        } catch (error) {
            console.error(error);
            setStatus(`Connection failed: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    // 2. Trigger the reward function
    const handleReward = async () => {
        if (!walletAddress) {
            setStatus("Please connect your wallet first.");
            return;
        }

        try {
            setIsLoading(true);
            setStatus("Sending transaction... please confirm in MetaMask.");

            const receipt = await rewardCitizenTokens(walletAddress);

            setStatus(`Success! Tokens rewarded. Block Hash: ${receipt.blockHash}`);
        } catch (error) {
            console.error(error);
            setStatus(`Transaction failed: ${error.reason || error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-xl shadow-md border border-gray-100 flex flex-col gap-4">
            <div className="border-b pb-4">
                <h2 className="text-xl font-bold text-gray-800">Citizen Eco-Rewards</h2>
                <p className="text-sm text-gray-500 mt-1">Claim your ECO tokens for verified reports.</p>
            </div>

            <div className="flex flex-col gap-3 py-2">
                <button
                    onClick={connectWallet}
                    disabled={isLoading || !!walletAddress}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                >
                    {walletAddress ? `Connected: ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : "Connect Wallet"}
                </button>

                <button
                    onClick={handleReward}
                    disabled={isLoading || !walletAddress}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors flex items-center justify-center gap-2"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                    </svg>
                    Claim 10 ECO Reward
                </button>
            </div>

            <div className="pt-2">
                <p className={`text-sm ${status.includes("failed") ? "text-red-500" : "text-gray-600"}`}>
                    <strong>Status:</strong> {status}
                </p>
            </div>
        </div>
    );
}