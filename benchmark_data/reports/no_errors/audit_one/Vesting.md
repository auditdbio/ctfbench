# AI Audit

## Disclaimer
> **This report is AI-generated and may contain false positives.**  
> For a thorough and accurate analysis, we strongly recommend obtaining a manual audit with AuditOne.

---

## Issues

### 1. Duration Can Be Set to 0, Allowing All Vested Tokens to Be Released at the Cliff

#### **Input Code**
```solidity
} else if (block.timestamp >= start + duration) {
```

- **Severity:** 🟠 *Medium*  
- **Impact:**  
  Duration can be set to 0, allowing all vested tokens to be released at the cliff.

#### **Description**
On `Vesting.sol#15`, the constructor initializes `duration`, where `duration` must be a positive integer.

```solidity
constructor(IERC20 _token, address _beneficiary, uint256 _start, uint256 _cliff, uint256 _duration) {
```

However, if a developer sets `duration` to 0, then on `Vesting.sol#32`, `vestedAmount()#42` will calculate all tokens are vested at the cliff.

```solidity
} else if (block.timestamp >= start + duration) {
    return totalBalance;
    // ReleasableAmount = VestedAmount - Released
```

On `Vesting.sol#39`, `releasableAmount()#42` will return all tokens are releasable at the cliff.

```solidity
function releasableAmount() public view returns (uint256) {
    return vestedAmount() - released;
}
```

Vesting contracts with `duration = 0` can be constantly created and released, which can be abused via DOS attacks.

```
# Create a vesting with duration = 0
vesting = Vesting.new(token, beneficiary, start, cliff, 0, {from: admin});

# Release all vested tokens at the cliff
vesting.release({from: admin});

# Create a new vesting and repeat the process
vesting = Vesting.new(token, beneficiary, start, cliff, 0, {from: admin});
Release({from: admin});
```

#### **Recommendations**
✅ Ensure `duration` must be greater than `cliff`.
