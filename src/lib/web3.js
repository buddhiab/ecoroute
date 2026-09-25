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

// Fetch the ECO token balance for a specific wallet address
export async function getEcoBalance(walletAddress) {
    const { provider, contract } = await getContractSigner()

    // Verify the network is Sepolia (chainId is BigInt in ethers v6)
    const network = await provider.getNetwork()
    if (network.chainId !== 11155111n) {
        throw new Error("Wrong network. Please switch MetaMask to Sepolia.")
    }

    // Verify a smart contract exists at the configured address
    const code = await provider.getCode(ECO_TOKEN_ADDRESS)
    if (code === "0x") {
        throw new Error("No contract found at the configured ECO token address.")
    }

    // Fetch and return the formatted balance
    const balanceWei = await contract.balanceOf(walletAddress)
    return ethers.formatUnits(balanceWei, 18)
}

// Burn ECO tokens for fiat withdrawal
export async function burnEcoTokens(amount) {
    const { contract } = await getContractSigner();

    // Convert the human-readable amount (e.g., 500) to Wei (18 decimals)
    const amountInWei = ethers.parseUnits(amount.toString(), 18);

    // Trigger the MetaMask transaction to send tokens to the municipal treasury
    // REMINDER: Replace "0xYOUR_ADMIN_WALLET_ADDRESS" with your actual admin/treasury MetaMask public address
    const TREASURY = process.env.NEXT_PUBLIC_TREASURY_WALLET_ADDRESS;
    const tx = await contract.transfer(TREASURY, amountInWei);

    // Wait for the block to be confirmed on Sepolia
    const receipt = await tx.wait();
    return receipt;
}