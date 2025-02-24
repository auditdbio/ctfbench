Smart Contract Audit Report: MinimalLending
Below is the audit report for the MinimalLending smart contract, identifying CRITICAL and MAJOR vulnerabilities based on a detailed analysis of the provided Solidity code. The contract is a lending protocol where users can borrow tokens by providing ETH as collateral, with mechanisms for loan repayment and liquidation. The report outlines vulnerabilities, their severity, impact, and recommended fixes.
Summary of Findings
The audit identified three significant vulnerabilities:
CRITICAL: Ineffective Liquidation Mechanism
MAJOR: Incorrect Interest Calculation Due to Integer Division
MAJOR: Vulnerability to Fee-on-Transfer Tokens
Each vulnerability is discussed in detail below, including its description, impact, and suggested mitigation.
Contract Overview
The MinimalLending contract allows:
The owner to deposit token liquidity.
Users to borrow tokens by providing ETH collateral (minimum collateral ratio: 150%).
Loan repayment with interest calculated using a continuous compounding approximation.
Liquidation of loans when the collateral value falls below a threshold (liquidation threshold: 110%).
Key components:
Imports: OpenZeppelin's IERC20 for token interactions.
Interfaces: IPriceOracle for fetching ETH price in tokens.
Constants: 
MIN_COLLATERAL_RATIO = 150 (150% collateral-to-borrow ratio).
LIQUIDATION_THRESHOLD = 110 (liquidation at 110% debt-to-collateral ratio).
INTEREST_RATE_PER_SECOND = 3170979198 (scaled interest rate).
Struct: Loan (tracks collateral, principal, start time).
Mapping: loans (maps borrower addresses to their loans).
Identified Vulnerabilities
1. Ineffective Liquidation Mechanism (CRITICAL)
Description
The liquidation mechanism is fundamentally flawed due to an incorrect condition in the isLiquidatable function combined with the liquidation economics. The condition for liquidation is:
solidity
return (debt * 100) >= (collateralValue * LIQUIDATION_THRESHOLD);
With LIQUIDATION_THRESHOLD = 110, this translates to:
debt * 100 >= collateralValue * 110
debt >= 1.1 * collateralValue
collateralValue <= debt / 1.1 ≈ 0.909 * debt
This means liquidation is only possible when the collateral value is less than approximately 90.9% of the debt. However, in the liquidate function, the liquidator must pay the full debt amount in tokens to receive the collateral (in ETH), with no bonus or penalty:
solidity
require(token.transferFrom(msg.sender, address(this), debt), "Token transfer failed");
(bool success, ) = msg.sender.call{value: collateral}("");
Since collateralValue < debt when liquidation is allowed (specifically, collateralValue < debt / 1.1 < debt), liquidators would always lose value by paying more (in tokens) than they receive (in ETH). As a result, there is no economic incentive to liquidate, rendering the mechanism ineffective.
Impact
Bad Debt Accumulation: If collateral values drop below debt levels (e.g., due to ETH price decreases or interest accrual), loans cannot be profitably liquidated, leaving the protocol with unrecoverable debt.
Protocol Insolvency: Without effective liquidation, the contract may hold under-collateralized loans indefinitely, undermining its financial stability.
Severity
CRITICAL: This vulnerability jeopardizes the core functionality of the lending protocol, potentially leading to significant financial losses.
Recommendation
Adjust the liquidation condition and economics to ensure liquidators are incentivized:
Fix Condition: Change the liquidation condition to trigger when the collateral value is still sufficient to cover the debt plus a bonus. For example, liquidate when collateralValue < debt * LIQUIDATION_THRESHOLD / 100, where LIQUIDATION_THRESHOLD > 100 (e.g., 120):
solidity
return collateralValue * 100 <= debt * LIQUIDATION_THRESHOLD; // e.g., collateralValue <= 1.2 * debt
Add Incentive: Modify liquidate to allow liquidators to pay less than the full debt or receive extra collateral as a bonus. Example:
solidity
uint256 debtToPay = debt * 90 / 100; // 10% discount
require(token.transferFrom(msg.sender, address(this), debtToPay), "Token transfer failed");
(bool success, ) = msg.sender.call{value: collateral}("");
2. Incorrect Interest Calculation Due to Integer Division (MAJOR)
Description
The getCurrentDebt function calculates compound interest using a Taylor series approximation for the exponential function:
solidity
uint256 x = INTEREST_RATE_PER_SECOND * timeElapsed / scale;
uint256 x2 = (x * x) / scale;
uint256 x3 = (x2 * x) / scale;
uint256 expApprox = scale + x + (x2 / 2) + (x3 / 6);
return (loan.principal * expApprox) / scale;
Where:
INTEREST_RATE_PER_SECOND = 3170979198
scale = 1e18
timeElapsed = block.timestamp - loan.startTime
Due to Solidity's integer arithmetic, x is floored during division. Since 3170979198 < 1e18, x = 0 unless timeElapsed >= 1e18 / 3170979198 ≈ 315,360,000 seconds (approximately 10 years). For example:
If timeElapsed = 1 second: x = 3170979198 * 1 / 1e18 = 0
If timeElapsed = 1 year ≈ 31,536,000 seconds: x = 3170979198 * 31,536,000 / 1e18 ≈ 0
Thus, expApprox = 1e18, and the debt equals the principal with no interest until roughly 10 years, at which point x jumps to 1, causing a sudden increase.
Impact
No Interest Accrual: Borrowers pay no interest for loans shorter than ~10 years, undermining the protocol’s revenue model.
Abrupt Interest Jump: After 10 years, interest applies suddenly, which is inconsistent with continuous compounding intent.
Severity
MAJOR: This significantly affects the protocol’s intended economics, though it does not directly cause fund loss.
Recommendation
Redesign the interest calculation to accrue gradually:
Increase Rate Precision: Define INTEREST_RATE_PER_SECOND with higher scaling, e.g., 3170979198e18, but adjust scale or use a larger base unit (e.g., per block). However, this may require careful handling due to integer limits.
Use Discrete Compounding: Calculate interest per block or day instead of per second:
solidity
uint256 INTEREST_RATE_PER_DAY = 3170979198 * 86400; // Adjust rate
uint256 daysElapsed = timeElapsed / 86400;
uint256 x = INTEREST_RATE_PER_DAY * daysElapsed / 1e18;
Fixed-Point Library: Use a library like OpenZeppelin’s Math for precise exponentiation.
3. Vulnerability to Fee-on-Transfer Tokens (MAJOR)
Description
The contract assumes that token.transferFrom transfers the exact debt amount in repayLoan and liquidate:
solidity
require(token.transferFrom(msg.sender, address(this), debt), "Token transfer failed");
For standard ERC20 tokens, this transfers debt tokens exactly. However, if the token implements a fee-on-transfer mechanism (where a fee is deducted, and the recipient receives less), the contract receives less than debt but still considers the loan repaid or liquidated. For example:
Debt = 100 tokens, 1% fee → Borrower approves 100, contract receives 99, but loan is deleted.
Impact
Fund Loss: The protocol receives less than the owed amount, potentially losing funds proportional to the fee.
Exploitation: A malicious borrower could use a high-fee token to repay less than the full debt.
Severity
MAJOR: This could lead to financial loss, though it depends on the token used, which is set by the owner at deployment.
Recommendation
Verify the received amount:
Balance Check: Measure the token balance before and after the transfer:
solidity
uint256 balanceBefore = token.balanceOf(address(this));
require(token.transferFrom(msg.sender, address(this), debt), "Token transfer failed");
uint256 balanceAfter = token.balanceOf(address(this));
require(balanceAfter >= balanceBefore + debt, "Insufficient tokens received");
Token Validation: Ensure the deployed token is a standard ERC20 without fees, though this relies on deployment-time checks.
Additional Notes
Oracle Dependency: The contract relies on a single oracle.getPrice() without validation. While not listed as a vulnerability (assuming a trusted oracle), a compromised oracle could enable over-borrowing or prevent liquidation. Consider using a decentralized oracle (e.g., Chainlink) in production.
Locked Funds: The owner cannot withdraw excess tokens or ETH, but this is a design limitation, not a security issue.
Reentrancy: The contract follows checks-effects-interactions (e.g., deleting loans before external calls), mitigating reentrancy risks.
Conclusion
The MinimalLending contract contains one CRITICAL vulnerability (ineffective liquidation) that undermines its core purpose and two MAJOR vulnerabilities (interest calculation and fee-on-transfer tokens) that affect its economics and security. Addressing these issues is essential for a functional and secure lending protocol. Recommended fixes include revising the liquidation logic, correcting the interest calculation, and adding token transfer validation.
This report provides a comprehensive analysis tailored to the contract’s code, ensuring clarity for stakeholders without relying on external context. Let me know if further details are needed!