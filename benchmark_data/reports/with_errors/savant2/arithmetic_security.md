# Audit Report 🎯

*Generated at 2025-03-04 10:47:06*

## 📝 Disclaimer


This AI-powered audit by Savant.Chat is based on the smart contract code at the time of evaluation; 
any subsequent changes may require re-auditing. Due to AI limitations, such as potential hallucination, 
the audit may not detect all issues, and findings—especially fix recommendations—should be reviewed by 
a security specialist. Users are advised to implement additional checks like manual reviews and regular 
re-audits. The AI auditor is provided "as is," and neither Savant.Chat, nor its developers, nor its 
providers, shall be liable for any direct, indirect, incidental, special, exemplary, or consequential 
damages arising from its use or reliance on its results. Users must independently verify findings and 
assume all risks, as the AI may produce incorrect information.

## 📊 Vulnerability Statistics

- Total vulnerabilities found: 4

---

## 🚨 Issue 1

### 📄 File: `Lending.sol`

### Issue Code Highlight

```solidity
    function getCurrentDebt(address borrower) public view returns (uint256) {
        Loan memory loan = loans[borrower];
        if (loan.principal == 0) return 0;
        uint256 timeElapsed = block.timestamp - loan.startTime;
        uint256 scale = 1e18;

        uint256 x = INTEREST_RATE_PER_SECOND * timeElapsed / scale;
        
        uint256 x2 = (x * x) / scale;
        uint256 x3 = (x2 * x) / scale;
        
        uint256 expApprox = scale + x + (x2 / 2) + (x3 / 6);
        
        return (loan.principal * expApprox) / scale;
    }
```

### Synopsis
Interest calculation uses integer division truncation with block.timestamp dependency, resulting in zero interest accumulation for loans under 10 years due to scaling errors in the Taylor approximation.

### Technical Details
The vulnerability stems from improper scaling in the interest calculation algorithm:
1. `INTEREST_RATE_PER_SECOND` (3.17e9) multiplied by time produces values too small for 1e18 scaling
2. Integer division truncates `x` to zero for realistic loan durations (<315M seconds)
3. Taylor series collapses to 1e18, returning principal with zero interest
4. Protocol fails to collect any interest due to calculation flaw

### Proof of Concept
1. User borrows 1000 tokens with 1 ETH collateral
2. Repays loan after 1 year (31,536,000 seconds)
3. Calculation: 
   - x = (3,170,979,198 * 31,536,000) / 1e18 = 0.0999 ≈ 0 in integer math
   - expApprox = 1e18 + 0 + 0 + 0
   - Debt = 1000 * 1e18 / 1e18 = 1000 tokens
4. Borrower repays principal only, protocol loses all interest income

### Impact Assessment
Critical severity (CVSS: 9.1):
- Protocol becomes insolvent as all loans return principal only
- Lenders lose expected interest earnings
- Attack cost: $0 (automatic exploitation)
- All loan positions affected since inception

### Remediation
1. Adjust rate scaling to maintain precision:
```solidity
// In contract variables
uint256 public constant INTEREST_RATE_PER_SECOND = 3170979198000000; // 1e14 precision

// In getCurrentDebt
uint256 x = (INTEREST_RATE_PER_SECOND * timeElapsed) / (1e18 * 1e4); // Adjust scaling
```
2. Implement time-weighted average price (TWAP) oracles for interest calculation
3. Add minimum duration checks in repayment logic

---

## 🚨 Issue 2

### 📄 File: `Lending.sol`

### Issue Code Highlight

```solidity
    constructor(address _token, address _oracle) {
        owner = msg.sender;
        token = IERC20(_token);
        oracle = IPriceOracle(_oracle);
    }
```

### Synopsis
Missing decimal validation for ERC20 token allows improper collateral calculations, enabling under-collateralized loans through decimal mismatch between token and ETH value conversions.

### Technical Details
The constructor fails to verify that the ERC20 token uses 18 decimals. Calculations assume 1e18 wei/dec precision (collateralValue: (msg.value * price)/1e18). With non-18 decimal tokens:
1. Borrow amount scaling mismatches collateral requirements
2. Allows 10^12x collateral errors (6 vs 18 decimals)
3. Permits borrowing without sufficient collateral
4. Interest calculations become fundamentally incorrect

### Proof of Concept
1. Deploy with USDC (6 decimals) as token
2. Borrow 1,000,000 USDC (1.0 actual)
3. Provide 0.01 ETH collateral ($100 @ $10k ETH)
4. Oracle returns $1000 per ETH (price=1e21)
5. CollateralValue = (0.01e18 * 1e21)/1e18 = 1e19 ($10)
6. Check passes: 1e19 * 100 ≥ 1e6 * 150 → 1e21 ≥ 1.5e8
7. Loan approved with 666x under-collateralization

### Impact Assessment
Critical severity: Allows systemic under-collateralization through decimal mismatch. Attackers can drain liquidity pool with minimal collateral. Protocol becomes immediately insolvent upon first non-18 decimal token loan. Requires only malicious token selection during deployment.

### Remediation
Modify constructor to verify token decimals match 18:
```solidity
constructor(address _token, address _oracle) {
    require(IERC20Metadata(_token).decimals() == 18, "Invalid token decimals");
    owner = msg.sender;
    token = IERC20(_token);
    oracle = IPriceOracle(_oracle);
}
```
Requires importing and using OpenZeppelin's ERC20Metadata interface.

---

## 🚨 Issue 3

### 📄 File: `Lending.sol`

### Issue Code Highlight

```solidity
    function repayLoan() external {
        Loan memory loan = loans[msg.sender];
        require(loan.principal > 0, "No active loan");
        uint256 debt = getCurrentDebt(msg.sender);
        uint256 collateral = loan.collateral;
        delete loans[msg.sender];

        require(token.transferFrom(msg.sender, address(this), debt), "Token transfer failed");
        (bool success, ) = msg.sender.call{value: collateral}("");
        require(success, "ETH refund failed");
    }
```

### Synopsis

Interest calculation precision loss allows borrowers to repay zero interest for microsecond-duration loans due to integer division truncation when repaying within first calculation interval (block), enabling interest-free borrowing.

### Technical Details

The vulnerability exists in the interaction between debt calculation precision and repayment timing. The interest calculation uses fixed-point arithmetic with divisions that truncate fractional values. When loans are repaid within the same block (timeElapsed=0), the debt calculation returns exactly the principal amount. However, due to the INTEREST_RATE_PER_SECOND constant being hardcoded with inadequate precision, any repayment within the first full time unit (1 second) results in interest calculation truncating to zero, allowing borrowers to avoid paying any interest for sub-second loans.

The key flaw is the use of insufficient precision in the interest rate constant combined with integer division truncation. The 3170979198 value represents 0.000000003170979198 when normalized by 1e18, making sub-second loans effectively interest-free due to calculation truncation during the Taylor series approximation.

### Proof of Concept

1. Borrower calls borrow(100) with 1 ETH collateral in block N
2. Oracle returns price = 1500e18 (1 ETH worth 1500 tokens)
3. Collateral check passes: (1e18 * 1500e18 / 1e18) * 100 ≥ 100 * 150 → 150000 ≥ 15000
4. Loan created: principal=100, collateral=1 ETH, startTime=block.timestamp
5. Borrower immediately calls repayLoan() in same block:
   - timeElapsed = 0 → debt = 100 tokens
   - Repays exactly principal amount with 0 interest
6. Repeat process for free flash loans

### Impact Assessment

Critical severity. Attackers can execute interest-free flash loans by borrowing and repaying within the same block. This violates core protocol economics, enables free capital extraction, and effectively bypasses all lending fees. Requires zero special privileges and minimal technical complexity to exploit.

### Remediation

Modify the interest calculation to use higher precision and implement a minimum borrow duration:

1. Add minimum duration check in repayLoan():
```solidity
require(block.timestamp > loan.startTime, "Minimum loan duration not met");
```

2. Increase precision in interest rate constants by using 1e27 scaling instead of 1e18.

---

## 🚨 Issue 4

### 📄 File: `Lending.sol`

### Issue Code Highlight

```solidity
function borrow(uint256 borrowAmount) external payable {
    require(msg.value > 0, "Collateral required");
    require(loans[msg.sender].principal == 0, "Existing loan exists");
    
    uint256 price = oracle.getPrice();
    uint256 collateralValue = (msg.value * price) / 1e18;
    require(collateralValue * 100 >= borrowAmount * MIN_COLLATERAL_RATIO, "Insufficient collateral");
    
    loans[msg.sender] = Loan({
        collateral: msg.value,
        principal: borrowAmount,
        startTime: block.timestamp
    });
    
    require(token.transfer(msg.sender, borrowAmount), "Token transfer failed");
}
```

### Synopsis

Missing zero-check for borrow amount allows creation of loans with zero principal, permanently locking collateral. Attackers or users can accidentally deposit ETH that becomes unrecoverable due to invalid loan state.

### Technical Details

1. **Flawed Validation**: Borrow function lacks `require(borrowAmount > 0)` check
2. **Invalid Loan State**: Allows creating loans with 0 principal but non-zero collateral
3. **Permanent Lock**: RepayLoan() rejects repayment attempts for 0-principal loans
4. **Collateral Capture**: ETH remains trapped in contract with no recovery mechanism

### Proof of Concept

1. Attacker calls `borrow(0)` with 1 ETH:
   ```solidity
   borrowAmount = 0, msg.value = 1 ether
   ```
2. Collateral check passes: `0 * 100 >= 0 * 150` → true
3. Loan created with:
   ```solidity
   principal = 0, collateral = 1 ether
   ```
4. Attacker attempts to repay:
   ```solidity
   repayLoan() → reverts with "No active loan"
   ```
5. 1 ETH is permanently locked in contract

### Impact Assessment

- **Severity**: Critical (Direct fund loss)
- **Attack Cost**: $0 (Gas only)
- **Prerequisites**: None - accessible to any user
- **Impact**: Permanent loss of collateral ETH
- **Risk**: High likelihood of accidental losses + potential griefing attacks

### Remediation

Add zero-check validation to borrow function:
```solidity
function borrow(uint256 borrowAmount) external payable {
    require(borrowAmount > 0, "Cannot borrow zero amount"); // Add this line
    require(msg.value > 0, "Collateral required");
    // Rest of function remains unchanged
}
```

