# AI Audit

## Disclaimer
> **This report is AI-generated and may contain false positives.**  
> For a thorough and accurate analysis, we strongly recommend obtaining a manual audit with AuditOne.

---

## Issues

### 1. Released Address is Incorrect

#### **Input Code**
```solidity
_recipient := shr(96, calldataload(36))
```

- **Severity:** 🔴 *High*  
- **Impact:**  
  The address that is about to be released does not equal the address in the `Eip712SignatureCheck.js` file.

#### **Description**
In assembly, the recipient address is extracted from the call data. If the vesting function is called with more than one zero parameter, the recipient will equal the address zero, and the vesting function will revert.

```solidity
processRelease(uint256 _amount, address _signer) external validSignature(_signer, msg.sender, _amount) {
    address _recipient;
    assembly {
        _recipient := shr(96, calldataload(36))
    }

    require(_recipient != address(0), "Invalid recipient");
    require(block.timestamp >= releaseTime[msg.sender], "Funds locked");
    require(balances[msg.sender] >= _amount, "Insufficient funds");
    require(_amount <= balances[msg.sender], "Amount exceeds balance");
    balances[msg.sender] -= _amount;
    (bool success, ) = _recipient.call{value: _amount}("");
    require(success, "Transfer failed");
    emit Released(msg.sender, _recipient, _amount);
}
```

#### **Recommendations**
✅ Change the value from 36 to 68.
