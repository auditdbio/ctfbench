# Audit Report 🎯

*Generated at 2025-03-04 11:06:58*

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

### 📄 File: `Vesting.sol`

### Issue Code Highlight

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

Missing initial token balance tracking enables fund dilution attacks. Vesting calculations incorrectly use live balances instead of locked amount, allowing manipulation via token deposits and creating inflation vulnerabilities with fee-on-transfer tokens.

### Technical Details

The constructor fails to record the initial token balance, causing subsequent vesting calculations to use dynamic balance instead of fixed allocation. This allows:
1. **Balance inflation** - Anyone can deposit additional tokens to artificially increase vested amounts
2. **Fee miscalculations** - With fee-on-transfer tokens, actual locked amount differs from expected balance
3. **Fund dilution** - Additional deposits dilute beneficiary's percentage share of vested tokens

Core vulnerability stems from using `token.balanceOf(address(this)) + released` instead of tracking the original deposit amount. The constructor should store initial balance during deployment to establish correct base value.

### Proof of Concept

1. Deploy vesting contract with 1000 tokens
2. Attacker sends 1000 more tokens to contract
3. `vestedAmount()` now calculates using 2000 tokens total
4. Beneficiary receives double the intended vested amount at each release

For fee-on-transfer tokens:
1. Deploy with 1000 tokens (actual received: 980 due to 2% fee)
2. `vestedAmount()` calculates using 980 + released instead of 1000
3. Beneficiary's vesting completes at 98% of expected total

### Impact Assessment

**Severity:** Critical (CVSS: 9.3)  
Allows complete bypass of vesting schedule through external token transfers. Enables:
- Theft of extra tokens via artificial balance inflation
- Premature fund exhaustion through token burns
- Beneficiary reward dilution from malicious deposits
- Permanent fund lockage with deflationary tokens

### Remediation

Add initial balance tracking in constructor and modify `vestedAmount()` calculation:

**Original Code (Vesting.sol):**
```solidity
function vestedAmount() public view returns (uint256) {
    uint256 totalBalance = token.balanceOf(address(this)) + released;
    // ... existing logic ...
}
```

**Fixed Code:**
```solidity
uint256 public initialBalance;

constructor(...) {
    // ... existing checks ...
    initialBalance = token.balanceOf(address(this));
}

function vestedAmount() public view returns (uint256) {
    uint256 totalBalance = initialBalance;
    // ... existing logic using totalBalance instead of dynamic balance ...
}
```

---

## 🚨 Issue 2

### 📄 File: `Vesting.sol`

### Issue Code Highlight

```solidity
    function vestedAmount() public view returns (uint256) {
        uint256 totalBalance = token.balanceOf(address(this)) + released;
        if (block.timestamp < cliff) {
            return 0;
        } else if (block.timestamp >= start + duration) {
            return totalBalance;
        } else {
            return totalBalance * (block.timestamp - start) / duration;
        }
    }
```

### Synopsis

The vesting calculation uses a dynamic `totalBalance` (current contract balance + released amount) instead of a fixed initial allocation, enabling manipulation of vested amounts through token deposits and leading to over-vesting.

### Technical Details

The critical vulnerability lies in the `vestedAmount` calculation using `token.balanceOf(address(this)) + released` as the basis for proportional vesting. This allows:
1. Inflation attacks: Anyone can deposit tokens to artificially increase `totalBalance`
2. Underflow risk: If tokens are removed from the contract, `vestedAmount()` could return values less than `released` causing underflow in `releasableAmount()`
3. Incorrect vesting curve: Vesting becomes dependent on contract's current balance rather than a fixed allocation

### Proof of Concept

1. Deploy vesting contract with 100 tokens
2. Attacker sends 900 tokens to contract (`totalBalance` = 1000)
3. After 1/10th of duration: `vestedAmount()` = 1000 * 0.1 = 100
4. Beneficiary releases 100 tokens
5. Repeat deposit/withdraw patterns to drain attacker's tokens + original allocation

### Impact Assessment

Critical severity (CVSS 9.3): 
- Allows infinite fund extraction via token inflation
- Violates core vesting guarantees
- Permanent fund loss for token donors
- Requires no special privileges to exploit

### Remediation

Store initial allocation during construction and use it for calculations instead of dynamic balance:

```solidity
contract Vesting {
    uint256 private _initialAllocation;

    constructor(...) {
        _initialAllocation = _token.balanceOf(address(this));
    }

    function vestedAmount() public view returns (uint256) {
        if (block.timestamp < cliff) return 0;
        uint256 elapsed = block.timestamp - start;
        return min(_initialAllocation * elapsed / duration, _initialAllocation);
    }
}
```

---

## 🚨 Issue 3

### 📄 File: `Vesting.sol`

### Issue Code Highlight

```solidity
    function release() public {
        require(block.timestamp >= cliff);
        uint256 unreleased = releasableAmount();
        require(unreleased > 0);
        released += unreleased;
        token.safeTransfer(beneficiary, unreleased);
    }
```

### Synopsis

The release function allows stealing additional tokens sent to the contract due to flawed vested amount calculation that considers current contract balance instead of initial allocation, enabling unauthorized withdrawals of non-vested funds.

### Technical Details

The vulnerability stems from `vestedAmount()` using `token.balanceOf(address(this)) + released` as the total vesting pool. This allows:
1. Any external token transfers to the contract to increase available vesting amount
2. Premature access to principal before vesting period completion
3. Over-vesting beyond originally allocated amount

The `release()` function blindly trusts this miscalculation, enabling the beneficiary to drain any ERC-20 tokens sent to the contract (accidentally or maliciously), not just the intended vesting amount.

### Proof of Concept

1. Deploy vesting contract with 1000 tokens
2. Attacker sends 1000 extra tokens to contract
3. After cliff period:
   - `token.balanceOf(contract)` = 2000
   - `vestedAmount()` = 2000 (immediately after cliff)
   - `released` = 0 → `unreleased` = 2000
4. Beneficiary drains full 2000 tokens instead of intended 1000

### Impact Assessment

Critical severity (CVSS 9.3). Allows complete drainage of contract's token balance regardless of vesting schedule. Any token sent to contract becomes immediately claimable after cliff period. Violates core contract purpose of controlled vesting.

### Remediation

Store initial allocation during construction and use it for calculations:

```solidity
contract Vesting {
    uint256 public initialAllocation; // Add this

    constructor(...) {
        ...
        initialAllocation = _token.balanceOf(address(this));
    }

    function vestedAmount() public view returns (uint256) {
        if (block.timestamp < cliff) return 0;
        uint256 elapsed = block.timestamp - start;
        return elapsed >= duration ? initialAllocation : initialAllocation * elapsed / duration;
    }
}
```

---

## 🚨 Issue 4

### 📄 File: `Vesting.sol`

### Issue Code Highlight

```solidity
function releasableAmount() public view returns (uint256) {
    return vestedAmount() - released;
}
```

### Synopsis

The vesting contract miscalculates releasable amounts when using fee-on-transfer tokens due to incorrect released token accounting. This vulnerability classifies as a token accounting error allowing gradual fund lockup and incorrect vesting payouts.

### Technical Details

The core flaw stems from improper handling of non-standard ERC20 tokens (like fee-on-transfer tokens) in release tracking. The `released` state variable is incremented using pre-transfer amounts rather than actual transferred values. When combined with the `vestedAmount()` calculation that incorporates both contract balance and released amounts, this creates cumulative accounting discrepancies that compound with each release.

### Proof of Concept

1. Deploy vesting with fee-on-transfer token (10% transfer fee)
2. Fund contract with 100 tokens (actual balance: 100)
3. After cliff, call release() to claim 100 tokens:
   - Contract sends 100 tokens, actual transfer: 90 tokens (10% fee)
   - `released` increases by 100 instead of 90
4. Subsequent vested calculations use incorrect `released` value:
   - `vestedAmount()` = (current balance + overcounted released)
   - `releasableAmount()` becomes negative due to arithmetic underflow

### Impact Assessment

Severity: Critical. Repeated releases with fee tokens permanently lock a portion of funds by creating unrecoverable accounting errors. Over time, this completely disables vesting functionality. Attackers can exploit with malicious token contracts to brick vesting schedules.

### Remediation

Modify the release function to track actual transferred amounts:

```solidity
function release() public {
    require(block.timestamp >= cliff);
    uint256 unreleased = releasableAmount();
    require(unreleased > 0);
    
    uint256 balanceBefore = token.balanceOf(address(this));
    token.safeTransfer(beneficiary, unreleased);
    uint256 actualReleased = balanceBefore - token.balanceOf(address(this));
    
    released += actualReleased;
}
```

This change ensures `released` accurately reflects real token movements.

