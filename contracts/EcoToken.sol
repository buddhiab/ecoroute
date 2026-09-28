// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Burnable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title EcoRoute ECO token
/// @notice ERC-20 reward token for verified citizen waste reports on Sepolia.
/// @dev Matches the ABI used by the app in src/lib/contracts/ecoToken.js.
///      rewardCitizen is owner-only: the app calls it from the server route
///      /api/reward-citizen, signed with CONTRACT_OWNER_PRIVATE_KEY, after
///      checking the report belongs to the caller and has not been rewarded.
contract EcoToken is ERC20, ERC20Burnable, Ownable {
    /// @notice ECO minted per verified report (10 ECO, 18 decimals).
    uint256 public reportReward = 10 * 10 ** 18;

    event CitizenRewarded(address indexed citizen, uint256 amount);
    event ReportRewardUpdated(uint256 oldAmount, uint256 newAmount);

    constructor(address initialOwner) ERC20("EcoRoute Token", "ECO") Ownable(initialOwner) {}

    /// @notice Mint the report reward to a citizen's wallet.
    function rewardCitizen(address citizen) public onlyOwner {
        require(citizen != address(0), "EcoToken: zero address");
        _mint(citizen, reportReward);
        emit CitizenRewarded(citizen, reportReward);
    }

    /// @notice Change the amount minted per verified report.
    function setReportReward(uint256 newReward) external onlyOwner {
        emit ReportRewardUpdated(reportReward, newReward);
        reportReward = newReward;
    }
}
