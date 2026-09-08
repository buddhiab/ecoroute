import { ethers } from "ethers";
import { ECO_TOKEN_ADDRESS, ECO_TOKEN_ABI } from "./contracts/ecoToken";

// Connect to MetaMask and get the active signer
export async function getContractSigner() {
    if (typeof window === "undefined" || !window.ethereum) {
        throw new Error("MetaMask is not installed");
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(ECO_TOKEN_ADDRESS, ECO_TOKEN_ABI, signer);

    return { provider, signer, contract };
}

// Reward a citizen with ECO tokens upon verified action
export async function rewardCitizenTokens(citizenAddress) {
    const { contract } = await getContractSigner();
    const tx = await contract.rewardCitizen(citizenAddress);
    const receipt = await tx.wait(); // Wait for block confirmation
    return receipt;
}

// Fetch the ECO token balance for a specific address (Diagnostic Version)
export async function getEcoBalance(walletAddress) {
    const { provider, contract } = await getContractSigner();

    console.log("1. Checking balance for wallet:", walletAddress);
    console.log("2. Using Token Contract Address:", ECO_TOKEN_ADDRESS);

    // 1. Verify the network is actually Sepolia
    const network = await provider.getNetwork();
    console.log("3. Connected to Network Chain ID:", network.chainId);

    // In ethers v6, chainId is a BigInt, so we check against 11155111n
    if (network.chainId !== 11155111n) {
        console.error("Wrong network detected. Expected Sepolia (11155111).");
        alert("Wrong network detected in browser! Please switch MetaMask to Sepolia.");
        return "0";
    }

    // 2. Verify that a smart contract actually exists at that address
    const code = await provider.getCode(ECO_TOKEN_ADDRESS);
    if (code === "0x") {
        console.error("🚨 NO CONTRACT FOUND AT:", ECO_TOKEN_ADDRESS);
        alert("No contract found at this address. Did you accidentally paste your wallet address into lib/contracts/ecoToken.js?");
        return "0";
    }

    // 3. If both pass, fetch the balance
    try {
        const balanceWei = await contract.balanceOf(walletAddress);
        return ethers.formatUnits(balanceWei, 18);
    } catch (error) {
        console.error("Failed to fetch balance:", error);
        return "0";
    }
}

// Burn ECO tokens for fiat withdrawal
export async function burnEcoTokens(amount) {
    const { contract } = await getContractSigner();

    // Convert the human-readable amount (e.g., 500) to Wei (18 decimals)
    const amountInWei = ethers.parseUnits(amount.toString(), 18);

    // Trigger the MetaMask transaction to send tokens to the municipal treasury
    // REMINDER: Replace "0xYOUR_ADMIN_WALLET_ADDRESS" with your actual admin/treasury MetaMask public address
    const tx = await contract.transfer("0x11bB14f887c8113E2f20963c0a447aF2f8D6DE65", amountInWei);

    // Wait for the block to be confirmed on Sepolia
    const receipt = await tx.wait();
    return receipt;
}