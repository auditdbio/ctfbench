# Audit Report 🎯

*Generated at 2025-02-18 03:20:01*

## 📊 Vulnerability Statistics

- Total vulnerabilities found: 4

---

## 🚨 Issue 1

### 📄 File: `Lending.sol`

### Original Code
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
The `getCurrentDebt` function suffers from precision loss due to premature integer division, resulting in zero interest accumulation for realistic loan durations. Attackers can borrow funds indefinitely without paying interest, leading to protocol insolvency.

### Technical Details
The vulnerability arises in the interest calculation where `INTEREST_RATE_PER_SECOND * timeElapsed` is divided by `1e18` using integer division. For loan durations under ~10.5 years, this operation truncates to zero, causing the exponential approximation to return 1.0 (no interest). The flawed calculation occurs because the per-second rate (3.17e-9 when scaled) multiplied by typical loan durations (seconds) results in values < 1e18, which truncate to zero when divided by 1e18.

### Proof of Concept
1. Borrower takes 1 ETH loan with 1 ETH collateral
2. Loan remains open for 1 year (31,536,000 seconds)
3. `x = (3170979198 * 31536000) / 1e18 = 0` (truncated from 0.10007)
4. `expApprox` returns 1e18 (no interest)
5. Borrower repays 1 ETH principal instead of 1.105 ETH (10.5% APR)
6. Repeat for all loans to drain protocol interest reserves

### Impact Assessment
- **Severity:** Critical (CVSS: 9.3)
- **Direct Impact:** Complete loss of interest income
- **Business Impact:** Protocol becomes insolvent as loans never accrue interest
- **Attack Cost:** Zero - exploitation occurs through normal usage
- **Worst Case:** All loans become interest-free, collapsing the lending system

### Remediation
Modify the interest calculation order to preserve precision: multiply before dividing. Move the scaling division to the final calculation step.

**Fixed Code:**
```solidity
function getCurrentDebt(address borrower) public view returns (uint256) {
    Loan memory loan = loans[borrower];
    if (loan.principal == 0) return 0;
    uint256 timeElapsed = block.timestamp - loan.startTime;
    
    uint256 accumulated = loan.principal;
    uint256 ratePerSecond = INTEREST_RATE_PER_SECOND;
    
    // Calculate using higher precision first
    uint256 interest = (accumulated * ratePerSecond * timeElapsed) / 1e18;
    
    return accumulated + interest;
}
```



---

## 🚨 Issue 2

### 📄 File: `Lending.sol`

### Original Code
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
The `repayLoan` function fails to account for ERC20 fee-on-transfer tokens, allowing borrowers to underpay debts while retrieving full collateral. This vulnerability enables systematic draining of contract funds through token-specific transfer deductions.

### Technical Details
The vulnerability stems from using `transferFrom` without verifying actual received token amounts. When dealing with ERC20 tokens that implement fee-on-transfer mechanics:
1. `transferFrom` return value only confirms transaction success, not received amount
2. Contract balance increases by (debt - fees) instead of full debt amount
3. Loan is still marked as repaid despite underpayment
4. Contract's token reserves gradually deplete due to systematic shortfalls

### Proof of Concept
1. Attacker deploys malicious ERC20 token with 10% transfer fee
2. Borrow 100 tokens (requiring 1.5x collateral in ETH)
3. Approve 100 tokens for repayment
4. Call `repayLoan()` - contract transfers 100 tokens but only receives 90 due to fee
5. Contract deletes loan and returns full collateral
6. Repeat to drain contract's token reserves while only paying 90% of owed debt

### Impact Assessment
- **Severity:** Critical (CVSS 9.3)
- **Direct Impact:** Permanent loss of ERC20 token reserves
- **Prerequisites:** Any fee-charging ERC20 token integration
- **Worst Case:** Complete depletion of lending pool through repeated underfunded repayments

### Remediation
Modify `borrow` function to track internal token balance changes instead of relying on transfer success:

```solidity
function borrow(uint256 borrowAmount) external payable {
    uint256 balanceBefore = token.balanceOf(address(this));
    require(token.transfer(msg.sender, borrowAmount), "Token transfer failed");
    uint256 balanceAfter = token.balanceOf(address(this));
    require(balanceBefore - balanceAfter == borrowAmount, "Invalid token transfer");
    // Rest of original logic...
}
```



---

## 🚨 Issue 3

### 📄 File: `Lending.sol`

### Original Code
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
The `borrow` function allows borrowing zero tokens due to missing validation, enabling attackers to lock user collateral permanently by creating loans with zero principal. This is a critical boundary condition vulnerability leading to loss of funds.

### Technical Details
The `borrow` function does not validate that `borrowAmount` is greater than zero. When users call `borrow` with `borrowAmount=0`, a loan with zero principal is created. Since the `repayLoan` function requires `loan.principal > 0`, these loans cannot be repaid, permanently locking the collateral in the contract. The lack of a lower-bound check on `borrowAmount` violates protocol assumptions about loan validity.

### Proof of Concept
1. Attacker calls `borrow` with `borrowAmount=0` and `msg.value=1 ETH`
2. Contract creates a loan with `principal=0`
3. Attacker attempts to repay but transaction reverts due to `loan.principal=0`
4. 1 ETH remains locked indefinitely in the contract

### Impact Assessment
Critical severity. Attackers can lock any amount of ETH collateral permanently. Users are deceived into losing funds through seemingly valid transactions. Protocol reputation is damaged, and locked funds require contract redeployment to recover.

### Remediation
Add a `require(borrowAmount > 0, "Cannot borrow zero")` check in the `borrow` function to prevent zero-principal loans.



---

## 🚨 Issue 4

### 📄 File: `Lending.sol`

### Original Code

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

The `repayLoan` function contains an **ERC20 return value deception** vulnerability. The code assumes successful ERC20 transfers guarantee full amount receipt, allowing fee-on-transfer or rebasing tokens to enable partial debt repayment while obtaining full collateral refunds, directly risking protocol solvency.

### Technical Details

The vulnerability stems from improper handling of ERC20 token transfers when calculating actual received amounts:
1. Uses `transferFrom` with explicit amount but only verifies operation success
2. Doesn't validate contract's token balance change after transfer
3. Fee-on-transfer/deflationary tokens would transfer less than specified `debt` amount
4. Attackers repay less than required while receiving full collateral
5. Protocol accumulates bad debt from underpaid loans

### Proof of Concept

1. Deploy malicious ERC20 with 25% transfer fee:
```solidity
function transferFrom(address, address, uint256) external returns (bool) {
    _balances[msg.sender] -= amount;
    _balances[to] += amount * 0.75; // Keep 25% as fee
    return true;
}
```
2. Owner configures lending contract with this token
3. User borrows 100 tokens with 1 ETH collateral
4. Call `repayLoan()` when 100 tokens owed:
   - `transferFrom` deducts 100 from user, only 75 arrive in contract
   - Protocol accepts repayment as successful
   - User receives full 1 ETH collateral back
5. Protocol left with 75 tokens debt coverage instead of 100

### Impact Assessment

Severity: Critical
- Direct Loss: 25% loss per repayment with malicious token
- Systemic Risk: Protocol becomes undercollateralized over time
- Attack Ease: Trivial execution once token is approved
- Prerequisites: Owner must configure vulnerable token (accidentally or maliciously)
- Worst Case: Complete protocol insolvency if popular fee-token integrated

### Remediation

Implement balance verification pattern for ERC20 operations:
1. Check contract's token balance before transfer
2. Calculate actual received amount after transfer
3. Validate received amount matches debt

Modified `repayLoan` function:
```solidity
function repayLoan() external {
    Loan memory loan = loans[msg.sender];
    require(loan.principal > 0, "No active loan");
    uint256 debt = getCurrentDebt(msg.sender);
    uint256 collateral = loan.collateral;
    
    uint256 balanceBefore = token.balanceOf(address(this));
    require(token.transferFrom(msg.sender, address(this), debt), "Token transfer failed");
    uint256 balanceAfter = token.balanceOf(address(this));
    require(balanceAfter - balanceBefore == debt, "Incorrect amount received");
    
    delete loans[msg.sender];
    (bool success, ) = msg.sender.call{value: collateral}("");
    require(success, "ETH refund failed");
}
```



