# AI Audit

## Disclaimer
> **This report is AI-generated and may contain false positives.**  
> For a thorough and accurate analysis, we strongly recommend obtaining a manual audit with AuditOne.

---

## Issues

### 1. Potential Integer Underflow in `MinimalLending.isLiquidatable()`

#### **Input Code**
```solidity
function isLiquidatable(address borrower) public view returns (bool) {
    Loan memory loan = loans[borrower];
    if (loan.principal == 0) return false;
    uint256 debt = getCurrentDebt(borrower);
    uint256 price = oracle.getPrice();
    uint256 collateralValue = (loan.collateral * price) / 1e18;
    return (debt * 100) >= (collateralValue * LIQUIDATION_THRESHOLD);
}
```

- **Severity:** 🟠 *Medium*  
- **Impact:**  
  In the `MinimalLending` contract, the function `isLiquidatable()` does not check if the price returned by the Oracle is 0. If it returns 0, this would cause a divide by error when doing `(loan.collateral * price) / 1e18`. This function would then return false when it should return true if a loan is liquidatable. Considering that different oracles may be used, this issue may affect all deployments of the `MinimalLending` contract.

#### **Description**
Please make sure to include proof of any interactions with the vulnerable code.

#### **POC - Oracle Returns 0 Price**
```solidity
function isLiquidatable(address borrower) public view returns (bool) {
    Loan memory loan = loans[borrower];
    if (loan.principal == 0) return false;
    uint256 debt = getCurrentDebt(borrower);
    uint256 price = oracle.getPrice();
    uint256 collateralValue = (loan.collateral * price) / 1e18;
    return (debt * 100) >= (collateralValue * LIQUIDATION_THRESHOLD);
}
```

#### **Recommendations**
✅ Add the following line to protect against underflow.
```solidity
uint256 price = oracle.getPrice();
require(price > 0);
```
