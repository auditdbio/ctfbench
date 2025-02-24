As a senior smart contract auditor tasked with identifying critical and major vulnerabilities in the provided OracleFlashToken smart contract, I have conducted a thorough analysis of the code. Below is the detailed audit report outlining the findings, including one critical vulnerability, along with recommendations for mitigation.
solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";

interface Uniswap {
    function getEthToTokenInputPrice(uint256 ethSold) external view returns (uint256 tokensBought);
}

contract OracleFlashToken is ERC20Burnable {
    Uniswap public uniswapOracle;

    constructor(address _oracle) ERC20("OracleFlashToken", "OFT") {
        uniswapOracle = Uniswap(_oracle);
    }

    function mint() external payable {
        require(msg.value > 0, "Must send ETH to mint tokens");
        uint256 tokenAmount = uniswapOracle.getEthToTokenInputPrice(msg.value);
        require(tokenAmount > 0, "Oracle returned zero tokens");
        _mint(msg.sender, tokenAmount);
    }

    function flashLoan(uint256 amount, address target, bytes calldata data) external {
        uint256 balanceBefore = balanceOf(address(this));
        _mint(target, amount);
        (bool success, ) = target.call(data);
        require(success, "Flashloan callback failed");
        uint256 balanceAfter = balanceOf(address(this));
        require(balanceAfter >= balanceBefore + amount, "Flashloan not repaid");
        _burn(address(this), amount);
    }
}
Vulnerability Report
Critical Vulnerability
1. Oracle Manipulation via Flash Loan
Description:
The mint function relies on an external Uniswap oracle (uniswapOracle.getEthToTokenInputPrice) to determine the number of tokens to mint based on the amount of ETH sent (msg.value). This oracle returns the number of tokens that would be received for selling a given amount of ETH to a Uniswap pool, based on the pool’s current reserves. Simultaneously, the flashLoan function allows any user to borrow a specified amount of tokens without collateral, minting them directly to a target address, executing a callback to the target with arbitrary data, and then requiring that the contract’s balance increases by at least the loaned amount before burning that amount from its own balance.
This design introduces a critical vulnerability because an attacker can use the flashLoan function to borrow a large quantity of tokens and manipulate the Uniswap pool’s reserves. By selling these borrowed tokens to the pool, the attacker increases the token reserve (reserveToken) and decreases the ETH reserve (reserveEth), thereby lowering the token price (since price ≈ reserveEth / reserveToken in Uniswap). This manipulation causes getEthToTokenInputPrice to return a higher number of tokens for the same amount of ETH. The attacker can then call mint with ETH—potentially obtained from the earlier token sale—to mint tokens at this artificially favorable rate, repay the flash loan, and retain a profit in the form of excess tokens.
Attack Scenario:
Flash Loan Acquisition: The attacker calls flashLoan to borrow a large amount of tokens (e.g., amount tokens), which are minted to their controlled target address.
Pool Manipulation: During the callback, the attacker sells the borrowed amount tokens to the Uniswap pool, receiving ETH in return. This increases reserveToken and decreases reserveEth, skewing the price such that more tokens are returned per ETH.
Token Minting: Using the ETH obtained (or other funds), the attacker calls mint with a specific msg.value. Due to the manipulated pool state, uniswapOracle.getEthToTokenInputPrice(msg.value) returns a tokenAmount that is significantly higher than it would be under normal conditions.
Loan Repayment and Profit: The attacker transfers amount tokens back to the contract to satisfy the flash loan’s repayment condition (balanceAfter >= balanceBefore + amount). If tokenAmount > amount, the attacker keeps the difference (tokenAmount - amount) as profit, effectively minting tokens at a discounted rate.
Impact:
This vulnerability allows an attacker to mint an arbitrary amount of tokens at a reduced ETH cost, limited only by the liquidity in the Uniswap pool and the size of the flash loan they can process within a single transaction. This undermines the token’s economic model, potentially leading to significant inflation of the total supply and loss of value for legitimate holders. The lack of any access control or fee on the flashLoan function exacerbates the ease of executing this attack.
Proof of Concept Considerations:
Initial State: Uniswap pool with reserveEth and reserveToken.
Step 1: Attacker borrows amount tokens via flashLoan.
Step 2: Sells amount tokens, receiving approximately ethReceived ≈ (reserveEth * amount) / (reserveToken + amount) ETH, adjusting pool to reserveEth' = reserveEth - ethReceived and reserveToken' = reserveToken + amount.
Step 3: Calls mint with msg.value = ethSold (where ethSold ≤ ethReceived), minting tokenAmount tokens, where tokenAmount is larger due to increased reserveToken' and decreased reserveEth'.
Step 4: Repays amount tokens, keeping tokenAmount - amount tokens and any remaining ETH.
With a sufficiently large amount, the price manipulation can be significant, making tokenAmount exceed amount by a profitable margin.
Major Vulnerability
No additional major vulnerabilities were identified beyond the critical issue described above. While the flashLoan function lacks a mandatory fee—which is unusual compared to standard DeFi protocols like Aave—it does not constitute a direct exploit path beyond enabling the oracle manipulation attack already classified as critical.
Recommendations
Mitigating Oracle Manipulation
To address the critical vulnerability, consider the following mitigation strategies:
Use a Robust Oracle:
Replace the direct Uniswap price query with a time-weighted average price (TWAP) oracle or a decentralized oracle solution (e.g., Chainlink). TWAP calculates the average price over a time window, making it resistant to short-term manipulations within a single transaction.
Alternatively, aggregate prices from multiple Uniswap pools or other sources to reduce reliance on a single manipulable pool.
Introduce a Price Checkpoint or Delay:
Cache the oracle price periodically (e.g., every block or set interval) and use the cached value in mint, preventing the use of a price altered within the same transaction as the flash loan.
Limit Flash Loan Impact:
Impose a cap on the amount parameter in flashLoan to limit the extent of pool manipulation possible in a single transaction.
Add a fee to flashLoan (e.g., require balanceAfter >= balanceBefore + amount + fee), reducing the economic incentive for manipulation and aligning with common DeFi practices.
Additional Design Improvements
Fee Enforcement in Flash Loans: If the contract owner intends to generate revenue or deter abuse, enforce a minimum fee in flashLoan by adjusting the repayment condition (e.g., balanceAfter >= balanceBefore + amount + fee), where fee is a predefined percentage or fixed amount.
Oracle Upgradability: The uniswapOracle address is immutable, set in the constructor. Consider adding a governance mechanism to update the oracle address if Uniswap upgrades or if a more secure oracle becomes available, though this introduces centralization risks that must be carefully managed.
Additional Notes
Reentrancy Safety: The flashLoan function appears safe from traditional reentrancy attacks. The state changes (minting and burning) are properly sequenced around the external call, and the balance check ensures repayment before burning. Recursive calls to flashLoan are possible but do not bypass the repayment requirement, as each instance independently verifies its own balanceBefore + amount.
Total Supply Fluctuation: The temporary increase in total supply during a flash loan could affect external contracts relying on totalSupply, but without additional context, this is not a direct vulnerability in OracleFlashToken itself.
Conclusion
The OracleFlashToken contract contains a critical vulnerability due to the combination of an unprotected flash loan feature and an oracle-dependent minting mechanism, enabling attackers to manipulate the Uniswap pool and mint tokens at an artificially low cost. Implementing a manipulation-resistant oracle or adding safeguards to the mint and flashLoan functions is essential to secure the contract. No standalone major vulnerabilities were identified, though design adjustments like adding a flash loan fee could enhance the contract’s robustness and utility. Immediate action is recommended to protect the token’s integrity and user trust.