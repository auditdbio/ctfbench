Smart Contract Audit Report: MinimalLending
As a senior smart contract auditor, I have conducted a thorough review of the provided MinimalLending smart contract to identify critical and major vulnerabilities. Below is a detailed report outlining the findings, their impacts, and recommendations for mitigation. The contract is a lending protocol where users can borrow ERC20 tokens by providing ETH as collateral, with mechanisms for interest accrual, repayment, and liquidation.
Contract Overview
Purpose: A minimal lending platform allowing users to borrow tokens against ETH collateral, with interest applied and a liquidation mechanism for undercollateralized loans.
Key Features:
Owner-managed liquidity deposits.
Borrowing with a minimum collateral ratio of 150%.
Continuous interest calculation using an exponential approximation.
Liquidation threshold set at 110%.
External price oracle dependency for ETH valuation.
Critical Vulnerabilities
1. Incorrect Liquidation Condition
Description: The isLiquidatable function uses the condition (debt * 100) >= (collateralValue * LIQUIDATION_THRESHOLD) with LIQUIDATION_THRESHOLD = 110. This translates to debt >= collateralValue * 1.1, meaning a loan is liquidatable when the debt exceeds 110% of the collateral value. Consequently, liquidation can occur when collateralValue <= debt / 1.1 ≈ 0.909 * debt. This is illogical for a lending protocol because:
Liquidators repay the debt in tokens and receive the ETH collateral, which, under this condition, is worth less than the debt repaid (e.g., collateral value < debt).
In standard lending protocols (e.g., Aave, Compound), liquidation occurs when collateralValue < debt * liquidationRatio (where liquidationRatio > 1, typically 1.25–1.5), ensuring liquidators receive collateral worth more than the debt for profit.
Impact:
Liquidators incur financial losses, disincentivizing liquidation.
Undercollateralized loans may persist, risking protocol insolvency.
Recommendation:
Revise the liquidation condition to a standard form, such as:
solidity
return (collateralValue * 100) < (debt * LIQUIDATION_THRESHOLD);
With LIQUIDATION_THRESHOLD = 125 (or higher), this becomes collateralValue < debt * 1.25, ensuring liquidators receive collateral exceeding the debt repaid.
Consider adding a liquidation bonus (e.g., a percentage of collateral) to further incentivize liquidators, though this may require additional design changes.
Major Vulnerabilities
1. Precision Issues in Interest Calculation
Description: The getCurrentDebt function approximates continuous compound interest using a Taylor series: e^x ≈ 1 + x + x²/2 + x³/6, where x = (INTEREST_RATE_PER_SECOND * timeElapsed) / 1e18. This approximation is only accurate for small x. For large timeElapsed (e.g., years), x grows significantly, and higher-order terms are omitted, leading to substantial errors:
For INTEREST_RATE_PER_SECOND = 3170979198 (≈10.5% annual rate), after 10 years, x ≈ 1, and the approximation is reasonable (2.6667 vs. e¹ ≈ 2.718).
After 100 years, x ≈ 10, yielding ~227.666 vs. e¹⁰ ≈ 22026, a massive underestimation.
Impact:
Incorrect debt calculations could allow borrowers to underpay or force overpayment, affecting protocol fairness and solvency.
Long-term loans become unreliable, though this may be less critical if loans are short-term.
Recommendation:
Replace the approximation with a more precise method, such as:
A higher-order Taylor series or a precomputed lookup table.
An established library (e.g., OpenZeppelin’s math utilities or ABDKMath for precise exponentiation).
Alternatively, cap loan durations to ensure x remains small, though this limits flexibility.
2. Reliance on a Single Price Oracle
Description: The contract uses a single IPriceOracle (oracle.getPrice()) to value ETH collateral. A compromised or manipulated oracle could return:
An inflated price, allowing over-borrowing.
A deflated price, triggering unjust liquidations.
Impact:
Financial losses for borrowers (via premature liquidations) or the protocol (via undercollateralized loans).
Undermines trust and security of the system.
Recommendation:
Use a decentralized oracle solution (e.g., Chainlink) with aggregated feeds from multiple sources.
Implement fallback logic (e.g., average multiple oracles or revert on suspicious price deviations).
Add an owner-only function to update the oracle address securely.
Additional Observations (Non-Critical/Major)
While not classified as critical or major, these issues could enhance security and usability:
Reentrancy Risk:
Observation: repayLoan and liquidate use call{value: collateral}("") to transfer ETH after updating state (delete loans), following the checks-effects-interactions pattern, reducing reentrancy risk. However, token transfers (transferFrom) occur before ETH transfers, and a non-standard ERC20 with callbacks could theoretically reenter.
Recommendation: Add a reentrancy guard (e.g., OpenZeppelin’s ReentrancyGuard) for defense-in-depth, especially if supporting diverse tokens.
Locked Liquidity:
Observation: depositLiquidity allows the owner to add tokens, but there’s no withdrawal mechanism, locking funds indefinitely unless borrowed or liquidated.
Recommendation: Add an owner-only withdrawLiquidity function with appropriate safeguards (e.g., ensuring no active loans are undercollateralized).
Missing Events:
Observation: No events are emitted for key actions (e.g., borrowing, repaying, liquidating), hindering off-chain monitoring.
Recommendation: Add events like:
solidity
event Borrowed(address indexed borrower, uint256 borrowAmount, uint256 collateral);
event Repaid(address indexed borrower, uint256 debt, uint256 collateralReturned);
event Liquidated(address indexed borrower, address indexed liquidator, uint256 debt, uint256 collateral);
Final Report Summary
Critical Vulnerabilities
Incorrect Liquidation Condition  
Impact: Liquidators lose money; undercollateralized loans persist.  
Fix: Use collateralValue < debt * liquidationRatio (e.g., 1.25).
Major Vulnerabilities
Precision Issues in Interest Calculation  
Impact: Inaccurate debt for long-term loans.  
Fix: Use a precise exponentiation method or library.
Reliance on a Single Oracle  
Impact: Vulnerable to manipulation, affecting collateral valuation.  
Fix: Use decentralized, aggregated oracles.
Recommendations
Fix the liquidation logic to ensure economic incentives align with standard practices.
Improve interest calculation precision for robustness.
Enhance oracle security with redundancy and validation.
Consider adding reentrancy guards, liquidity withdrawal, and events for a production-ready contract.
By addressing these vulnerabilities, the MinimalLending contract can achieve greater security, reliability, and alignment with DeFi best practices.