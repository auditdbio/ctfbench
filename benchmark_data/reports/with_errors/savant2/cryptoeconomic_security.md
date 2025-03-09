# Audit Report 🎯

*Generated at 2025-03-04 15:39:11*

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

- Total vulnerabilities found: 2

---

## 🚨 Issue 1

### 📄 File: `OracleFlashLoan.sol`

### Issue Code Highlight

```solidity
    function mint() external payable {
        require(msg.value > 0, "Must send ETH to mint tokens");
        uint256 tokenAmount = uniswapOracle.getEthToTokenInputPrice(msg.value);
        require(tokenAmount > 0, "Oracle returned zero tokens");
        _mint(msg.sender, tokenAmount);
    }
```

### Synopsis

The mint function uses a manipulable on-chain oracle price without validation, enabling attackers to inflate token supply by manipulating DEX pools through flash loans, leading to economic collapse of the token.

### Technical Details

The vulnerability stems from directly using `Uniswap.getEthToTokenInputPrice()` without price validation or slippage controls. Uniswap spot prices can be manipulated through flash loans in low-liquidity pools. An attacker could artificially inflate the ETH-token exchange rate reported by the oracle, mint excessive tokens for minimal ETH, then dump them on the market. This breaks the fundamental minting logic as tokens are created based on manipulated prices rather than actual market value.

### Proof of Concept

1. Pool has 100 ETH and 100,000 OFT tokens (price: 1 ETH = 1,000 OFT)
2. Attacker takes flash loan to drain ETH from pool, making remaining ETH scarce
3. Now 1 ETH buys 10,000 OFT due to manipulated reserves
4. Attacker mints with 1 ETH, receives 10,000 OFT
5. Repays flash loan, pool returns to original state
6. Attacker sells 10,000 OFT at true price (1,000 OFT/ETH), stealing 9 ETH profit

### Impact Assessment

**Severity:** Critical  
Attackers can:  
1. Create unlimited tokens through price oracle manipulation  
2. Completely devalue existing token holdings  
3. Drain project ETH reserves through arbitrage  
4. Collapse token economy permanently  
Only requires one malicious transaction in a vulnerable pool, with impact proportional to pool liquidity.

### Remediation

**Add TWAP Verification:**  
```solidity
// In OracleFlashToken contract
function mint() external payable {
    require(msg.value > 0, "Must send ETH");
    uint256 minExpected = uniswapOracle.consult(address(this), msg.value); // TWAP
    uint256 instantQuote = uniswapOracle.getEthToTokenInputPrice(msg.value);
    require(instantQuote <= minExpected * 110 / 100, "Price manipulation detected");
    _mint(msg.sender, instantQuote);
}
```

**Requires modifying Uniswap oracle wrapper to include:**  
```solidity
interface Uniswap {
    function consult(address token, uint256 ethIn) external view returns (uint256);
}
```

---

## 🚨 Issue 2

### 📄 File: `OracleFlashLoan.sol`

### Issue Code Highlight

```solidity
    function flashLoan(uint256 amount, address target, bytes calldata data) external {
        uint256 balanceBefore = balanceOf(address(this));
        _mint(target, amount);
        (bool success, ) = target.call(data);
        require(success, "Flashloan callback failed");
        uint256 balanceAfter = balanceOf(address(this));
        require(balanceAfter >= balanceBefore + amount, "Flashloan not repaid");
        _burn(address(this), amount);
    }
```

### Synopsis

Critical arithmetic validation flaw in flash loan repayment check allows third-party deposits to satisfy repayment requirements, enabling borrowers to steal minted tokens while leaving other users' funds at risk.

### Technical Details

The vulnerability stems from using absolute contract balance comparisons (`balanceAfter >= balanceBefore + amount`) rather than tracking borrowed amounts. The arithmetic check validates total balance increases rather than actual repayments from borrowers, allowing attackers to:
1. Borrow `amount` tokens through `_mint`
2. Have any external account (including third parties) send `amount` to the contract during callback
3. Pass balance check despite never repaying from borrowed funds
4. Keep minted tokens while contract burns deposits from unrelated accounts

### Proof of Concept

1. Attacker calls `flashLoan(1000, attackerAddress, maliciousCallback)`
2. Contract mints 1000 tokens to attacker
3. During callback, separate victim account transfers 1000 tokens to contract
4. Balance check passes: victim's 1000 >= initial balance + 1000
5. Contract burns victim's 1000 tokens from its balance
6. Attaker keeps 1000 minted tokens permanently

### Impact Assessment

Severity: Critical (Direct fund loss)
- Attackers can steal unlimited minted tokens
- Third-party funds can be burned to cover unpaid loans
- Requires trivial setup: single transaction with accomplice transfer
- Permanent protocol insolvency through token supply inflation

### Remediation

**Fix:**
Replace balance comparison with explicit repayment tracking:
```solidity
function flashLoan(uint256 amount, address target, bytes calldata data) external {
    uint256 balanceBefore = balanceOf(address(this));
    _mint(target, amount);
    (bool success, ) = target.call(data);
    require(success, "Flashloan callback failed");
    uint256 repaid = balanceOf(address(this)) - balanceBefore;
    require(repaid >= amount, "Not fully repaid");
    _burn(address(this), repaid);
}
```

**Changes:**
1. Calculate actual repayment via delta `repaid = balanceAfter - balanceBefore`
2. Verify repayment covers borrowed amount
3. Burn exact repaid amount instead of original loan size

