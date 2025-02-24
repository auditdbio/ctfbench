# AI Audit

## Disclaimer
> **This report is AI-generated and may contain false positives.**  
> For a thorough and accurate analysis, we strongly recommend obtaining a manual audit with AuditOne.

---

## Issues

### 1. Untrusted Recipient in `OracleFlashToken.sol`

#### **Input Code**
```solidity
_mint(target, amount);
```

- **Severity:** 🟡 *Quality Assurance*  
- **Impact:**  
  The target address in the `flashLoan` function is untrusted and can be an attacker contract. That contract can steal the flashed loan by overriding the loan callback or can cause a Revert in the loan callback, preventing repayments and stealing the tokens minted by the deposit function.

#### **Description**
The `flashLoan` interface is not defined in the code. It is most probably available in another codebase integrated with multiple protocols. However, the callback functionality is a known pattern, and most likely, the target contract is implementing `IFlashLoanReceiver`. The issue is the target address is untrusted. An attacker can deploy a contract to that address and steal the flash loan by overriding the `receiveFlashLoan` callback or can make the callback Revert, preventing loan repayment. The `mint` function does not specify a receiver, meaning `msg.sender` is the receiver. An attacker can flash loan from the deposit function directly.

#### **Recommendations**
✅ Define the `flashLoan` interface in the codebase. Create and integrate trusted target contracts with the deposit function for all loan operations. Establish and document a whitelist policy for target addresses that can receive loans. Ensure that whitelisted target contracts implement and correctly handle the `IFlashLoanReceiver` interface.

---

### 2. Fixed-Token Minting in `OracleFlashToken.sol` May Lead to Loss of Funds

#### **Input Code**
```solidity
require(tokenAmount > 0, "Oracle returned zero tokens");
```

- **Severity:** 🟡 *Quality Assurance*  
- **Impact:**  
  When the price of ETH/TOKEN drops, fewer TOKENs are given when calling `OFT.mint()` because `getEthToTokenInputPrice(msg.value)` returns fewer tokens. People can call the `OFT.mint()` function and pay less ETH to receive the same amount of TOKENs as before (because the oracle price does not change instantly). After that, they can call `OFT.burn()` to convert the same TOKENs back to ETH, causing a loss of funds.

#### **Description**
Consider the following scenario:
1. Alice calls `OFT.mint()` by sending 1 ETH while the price of TOKEN is 1 ETH/TOKEN (i.e., 1 TOKEN = 1 ETH).
2. Bob calls `OFT.mint()` by sending 1 ETH when the price of TOKEN drops to 0.5 ETH/TOKEN (i.e., 2 TOKEN = 1 ETH). He receives 2 TOKENs.
3. Alice and Bob wait until the price of TOKEN returns to 1 ETH/TOKEN (i.e., 1 TOKEN = 1 ETH).
4. Alice calls `OFT.burn()` to convert the 1 TOKEN she owns back to 0.5 ETH.

Note that Alice and Bob received the same amount of TOKENs (2 TOKENs), but Alice paid 1 ETH while Bob paid only 0.5 ETH. When the price of TOKEN returns to 1 ETH/TOKEN, Bob can call `OFT.burn()` to convert his 2 TOKENs back to 1 ETH.

#### **Recommendations**
✅ The problem is caused by the fixed-token minting in the `OFT.mint()` function. To solve the problem, get the latest price of TOKEN (i.e., the price quoted by Uniswap) and calculate the amount of TOKENs to mint by using this price rather than the oracle price.
