# Audit Report 🎯

*Generated at 2025-02-18 03:22:46*

## 📊 Vulnerability Statistics

- Total vulnerabilities found: 1

---

## 🚨 Issue 1

### 📄 File: `Vesting.sol`

### Original Code
```solidity
constructor(IERC20 _token, address _beneficiary, uint256 _start, uint256 _cliff, uint256 _duration) {
    require(_beneficiary != address(0));
    token = _token;
    beneficiary = _beneficiary;
    start = _start;
    cliff = _start + _cliff;
    duration = _duration;
}
```

### Synopsis
The `vestedAmount()` function uses live token balances vulnerable to external manipulation. Attackers can inflate vested amounts by sending tokens to the contract, enabling premature/unauthorized withdrawals and draining of funds.

### Technical Details
**Vulnerability:** Incorrect calculation basis for vested amounts  
- `vestedAmount()` uses `token.balanceOf(address(this)) + released` as total balance
- This includes ALL tokens in the contract, not just vesting-allocated tokens
- External actors can send tokens to manipulate the vested amount calculation

**Architectural Weakness:**  
- No segregation between vesting funds and arbitrary deposits
- Trusts external token contract's balance reporting without validation

**Attack Vector:**  
1. Attacker sends ERC20 tokens to Vesting contract
2. `vestedAmount()` includes these extra tokens in calculations
3. Beneficiary can immediately claim inflated amount via `release()`

### Proof of Concept
1. Deploy Vesting with 1000 token allocation
2. Attacker sends 1000 tokens to Vesting contract
3. After cliff period:  
   `vestedAmount()` = (1000+1000) * time_progress = 2000 (if fully vested)  
   `releasableAmount()` = 2000 - 0 = 2000
4. Beneficiary calls `release()`, drains 2000 tokens (stealing attacker's 1000)

### Impact Assessment
**Severity:** Critical (CVSS: 9.1)  
- Direct Loss: Any ERC20 tokens sent to contract become claimable
- Business Impact: Complete fund drainage possible via simple token transfer
- Prerequisites: None - exploitable by any token holder
- Worst Case: Malicious token contract with fake balanceOf() could create infinite withdrawals

### Remediation
**Solution:** Track initial allocated amount instead of live balances  
1. Add state variable: `uint256 private _initialAllocation;`
2. Modify constructor:
   ```solidity
   constructor(...) {
       // ... existing checks ...
       _initialAllocation = _token.balanceOf(address(this));
   }
   ```
3. Update `vestedAmount()` calculation:
   ```solidity
   uint256 totalBalance = _initialAllocation + released;
   ```

**Fixed vestedAmount():**
```solidity
function vestedAmount() public view returns (uint256) {
    uint256 totalBalance = _initialAllocation + released;
    if (block.timestamp < cliff) {
        return 0;
    } else if (block.timestamp >= start + duration) {
        return totalBalance;
    } else {
        return totalBalance * (block.timestamp - start) / duration;
    }
}
```



