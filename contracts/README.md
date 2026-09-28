# ECO token contract

`EcoToken.sol` is the ERC-20 reward token the app talks to on Sepolia. It is a
reconstruction written to match the ABI in `src/lib/contracts/ecoToken.js`; the
original `.sol` for the deployed address was not in this repo.

## How the app uses it

| Call | Where | Signed by |
|---|---|---|
| `rewardCitizen(address)` | `src/app/api/reward-citizen/route.js` | Owner wallet (`CONTRACT_OWNER_PRIVATE_KEY`), server side |
| `balanceOf`, `name`, `symbol`, `decimals` | `getEcoBalance` in `src/lib/web3.js` | Read only, citizen's MetaMask |
| `transfer(treasury, amount)` | `burnEcoTokens` in `src/lib/web3.js` | Citizen's MetaMask |

`rewardCitizen` mints `reportReward` (10 ECO) and is `onlyOwner`, so only the
server route can reward, after it checks the report is the caller's and unrewarded.
Payouts send tokens to `NEXT_PUBLIC_TREASURY_WALLET_ADDRESS` with a plain
`transfer`; the treasury can call `burn(amount)` (from `ERC20Burnable`) to
destroy them for good.

## Is this the deployed contract?

Check before quoting it in the thesis as the deployed source:

1. Open `https://sepolia.etherscan.io/address/0x502Bd8d0be1607666Cce013D8BC39246F0733148#code`.
2. If Etherscan shows verified source, use that file for Appendix D instead of this one.
3. If it shows only bytecode, look in Remix (File explorer, browser workspace) for the
   original file. If it's gone, either verify this file against the address
   (it only matches if name, symbol, constructor and compiler settings are identical)
   or redeploy this file and update the address, as below.

## Deploy with Remix

1. Open https://remix.ethereum.org and create `EcoToken.sol` with this file's contents.
   The OpenZeppelin imports resolve automatically.
2. Compiler: `0.8.24`, optimisation on, 200 runs. Compile.
3. Deploy & Run: environment "Injected Provider - MetaMask", MetaMask on Sepolia.
4. Constructor `initialOwner`: the address whose private key is in
   `CONTRACT_OWNER_PRIVATE_KEY` on the server. Deploy and confirm in MetaMask.
5. Copy the new address into `ECO_TOKEN_ADDRESS` in `src/lib/contracts/ecoToken.js`.
6. Verify on Etherscan ("Verify and Publish", Solidity single file, or the Remix
   Etherscan plugin) with the same compiler version, optimisation settings and
   constructor argument, so examiners can read the source on-chain.

## Test it end to end

1. Submit a citizen report; the server route mints 10 ECO to the connected wallet.
2. `/citizen/rewards` shows the new balance.
3. Request a payout; tokens move to the treasury wallet.
4. Record the tx hashes, block numbers and gas used from Etherscan for Section 6.5.
