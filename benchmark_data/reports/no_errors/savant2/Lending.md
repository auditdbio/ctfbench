# Audit Report 🎯

*Generated at 2025-03-04 10:48:22*

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

- Total vulnerabilities found: 3

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

    uint256 x = (INTEREST_RATE_PER_SECOND * timeElapsed) / scale;
    
    uint256 x2 = (x * x) / scale;
    uint256 x3 = (x2 * x) / scale;
    
    uint256 expApprox = scale + x + (x2 / 2) + (x3 / 6);
    
    return (loan.principal * expApprox) / scale;
}
```

### Synopsis

Interest calculation truncates to zero for durations under 10 years due to integer division order, allowing borrowers to avoid all interest payments by repaying within this period, resulting in total protocol interest loss.

### Technical Details

The critical vulnerability stems from premature truncation in interest accumulation calculation:
1. `x` calculation performs division before accumulating sufficient precision: `(INTEREST_RATE_PER_SECOND * timeElapsed) / 1e18`
2. With rate=3.17e9 wei/sec, x<1 requires time<315M sec (10 years)
3. For any x<1, integer division truncates to 0, making expApprox=1e18 (0% interest)
4. All loans repaid within 10 years incur zero interest despite protocol expectations
5. Division before multiplication destroys precision for real-world loan durations

### Proof of Concept

1. Alice borrows 1000 DAI with 1 ETH collateral
2. Repays loan after 9 years 364 days (315M - 1 sec):
   - timeElapsed = 315,359,999 seconds
   - x = (3,170,979,198 * 315,359,999) / 1e18 = 0.999... → 0 via integer division
   - expApprox = 1e18 → Debt = 1000 DAI
3. Alice repays principal only, stealing 9 years of interest-free capital
4. Protocol loses all expected interest revenue (~950 DAI at 10% APY)

### Impact Assessment

Severity: Critical (CVSS 9.3)
- Direct loss: 100% of protocol's expected interest income
- All loans become interest-free if repaid within 10 years
- Protocol sustainability destroyed as lenders receive zero yield
- Attack cost: $0 (natural borrower behavior exploits it)
- Irreversible loss as transactions are valid per contract code

### Remediation

**Preferred Fix:**
1. Reorder operations to preserve precision:
2. Change interest calculation to accumulate in numerator before division:

```solidity
uint256 x = INTEREST_RATE_PER_SECOND * timeElapsed;
// Keep all calculations in numerator space
uint256 x2 = (x * x) / (scale * scale);  // Now divided by 1e36
uint256 x3 = (x2 * x) / (scale * scale * scale);  // Divided by 1e54

// Scale factors adjusted accordingly
uint256 expApprox = (scale**3 + x*scale**2 + (x2 * scale)/2 + x3/6) / scale**2;
return (loan.principal * expApprox) / scale;
```

**Alternative Fix:**
Increase precision using 1e27 scaling during calculations to preserve fractional values for practical loan durations.

---

## 🚨 Issue 2

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

Critical vulnerability in `repayLoan` enables debt underpayment via fee-on-transfer tokens. Protocol assumes full debt recovery but receives reduced amounts from non-compliant ERC20s, allowing borrowers to reclaim collateral while leaving unpaid debt.

### Technical Details

The vulnerability stems from:
1. Using `transferFrom` without verifying actual received amount
2. Assuming ERC20 token compliance with exact amount transfers
3. Not checking contract's token balance change after transfer

For tokens with transfer fees or rebasing logic, `transferFrom` may move less than `debt` amount while still returning success. This allows borrowers to:
- Repay less than owed debt (including accrued interest)
- Still trigger collateral release
- Create protocol bad debt through undercollateralized repayments

### Proof of Concept

1. Attacker uses token with 10% transfer fee
2. Borrows 100 tokens against 1 ETH collateral
3. Debt grows to 110 tokens with interest
4. `repayLoan()` calls `transferFrom(attacker, contract, 110)`
5. Token contract deducts 11 tokens as fee (99 received)
6. Protocol accepts repayment as successful (transferFrom returns true)
7. Attacker receives full 1 ETH collateral back
8. Protocol left with 99 tokens instead of 110 (10% loss)

### Impact Assessment

Severity: Critical
- Direct financial loss from unrecovered debt
- Protocol insolvency due to accumulated bad debt
- Works with any non-compliant ERC20 token
- No special privileges required - exploitable by any borrower
- Worst case: Complete drainage through repeated underpayments

### Remediation

Modify `repayLoan` to verify actual balance changes:

```solidity
function repayLoan() external {
    Loan memory loan = loans[msg.sender];
    require(loan.principal > 0, "No active loan");
    uint256 debt = getCurrentDebt(msg.sender);
    uint256 collateral = loan.collateral;
    
    uint256 balanceBefore = token.balanceOf(address(this));
    require(token.transferFrom(msg.sender, address(this), debt), "Transfer failed");
    uint256 balanceAfter = token.balanceOf(address(this));
    require(balanceAfter - balanceBefore >= debt, "Insufficient tokens received");
    
    delete loans[msg.sender];
    (bool success, ) = msg.sender.call{value: collateral}("");
    require(success, "ETH refund failed");
}
```

---

## 🚨 Issue 3

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

Missing validation for zero borrow amount allows attackers to lock user collateral permanently by creating loans with 0 principal, blocking legitimate borrowing and causing fund loss through unrecoverable collateral.

### Technical Details

The borrow function fails to validate that `borrowAmount > 0`. When users call `borrow(0)`, they create a loan with principal=0 that passes all checks but:
1. Transfers 0 tokens (operationally useless)
2. Cannot be repaid due to `principal > 0` check in `repayLoan()`
3. Blocks future borrows via existing loan check
4. Permanently locks collateral ETH sent with the transaction

### Proof of Concept

1. Attacker calls `borrow(0)` with 1 wei ETH
2. Loan created: `principal=0`, `collateral=1 wei`
3. Attacker attempts repayment - fails at `principal > 0` check
4. User's address now has active loan, blocking legitimate borrowing
5. Collateral ETH remains permanently locked in contract

### Impact Assessment

**Severity:** Critical  
Direct fund loss through locked collateral. Attackers can weaponize this to:  
- Lock victim's collateral for 1 wei cost
- Deny borrowing capability for targeted addresses
- No recovery mechanism exists once loan is created

### Remediation

Add zero-check validation in borrow function:

```solidity
require(borrowAmount > 0, "Cannot borrow zero amount");
```

This should be inserted immediately after the existing collateral check:

```solidity
require(msg.value > 0, "Collateral required");
require(borrowAmount > 0, "Cannot borrow zero amount"); // <-- Add this line
require(loans[msg.sender].principal == 0, "Existing loan exists");
```

