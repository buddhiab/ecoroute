export const ECO_TOKEN_ADDRESS = "0x502Bd8d0be1607666Cce013D8BC39246F0733148";

export const ECO_TOKEN_ABI = [
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function decimals() view returns (uint8)",
    "function balanceOf(address owner) view returns (uint256)",
    "function rewardCitizen(address citizen) public",
    "function reportReward() view returns (uint256)",
    "function transfer(address to, uint256 amount) public returns (bool)"
];