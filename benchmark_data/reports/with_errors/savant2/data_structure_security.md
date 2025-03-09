# Audit Report 🎯

*Generated at 2025-03-04 10:45:03*

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

### 📄 File: `Vesting.sol`

### Issue Code Highlight

```solidity
    function processReleaseForMyself(uint256 _amount) public {
        processRelease(_amount, msg.sender);
    }
```

### Synopsis

Critical parameter handling flaw in self-release function causes failed transactions due to incorrect calldata parsing via assembly, permanently locking user funds by making the primary withdrawal mechanism unusable.

### Technical Details

The vulnerability stems from how `processRelease` handles calldata in internal calls:
1. **Calldata Context Mismatch**: When `processReleaseForMyself` calls `processRelease` internally, the assembly tries to read recipient from original transaction's calldata (position 36) rather than stack parameters
2. **Broken Address Parsing**: For calls through `processReleaseForMyself`, calldata ends at position 36 (4B selector + 32B amount). `calldataload(36)` reads zero-padded bytes, making recipient = address(0)
3. **Permanent Fund Lock**: This causes "Invalid recipient" revert for all legitimate self-release attempts, rendering the contract's primary withdrawal mechanism inoperable despite passed parameters being valid

### Proof of Concept

1. Alice deposits 1 ETH with valid vesting period
2. After lockup expires, she calls `processReleaseForMyself(1 ether)`
3. Execution flow: 
   - `processReleaseForMyself` -> `processRelease(amount, msg.sender)`
   - Assembly reads calldata from Alice's original call (length=36 bytes)
4. `calldataload(36)` returns 0x00...00 due to out-of-bounds read
5. Recipient validation fails with "Invalid recipient", transaction reverts
6. Alice cannot access her funds through designed interface

### Impact Assessment

Severity: Critical
- All user funds become permanently inaccessible through primary interface
- Contract core functionality completely broken
- Requires emergency migration/fork to recover funds
- Direct financial loss for all participants
- High reputational damage to project

### Remediation

**Fix in `processRelease` function:**
1. Remove assembly-based address parsing
2. Use proper parameter declaration and validation

Modified `processRelease`:
```solidity
function processRelease(uint256 _amount, address _recipient) public {
    require(_recipient != address(0), "Invalid recipient");
    require(block.timestamp >= releaseTime[msg.sender], "Funds locked");
    require(balances[msg.sender] >= _amount, "Insufficient funds");
    
    balances[msg.sender] -= _amount;
    (bool success, ) = _recipient.call{value: _amount}("");
    require(success, "Transfer failed");
    emit Released(msg.sender, _recipient, _amount);
}
```

---

## 🚨 Issue 2

### 📄 File: `Vesting.sol`

### Issue Code Highlight

```solidity
    function processRelease(uint256 _amount, address) public {
        address _recipient;
        assembly {
            _recipient := shr(96, calldataload(36))
        }

        require(_recipient!=address(0), "Invalid recipient");
        require(block.timestamp >= releaseTime[msg.sender], "Funds locked");
        require(balances[msg.sender] >= _amount, "Insufficient funds");
        require(_amount <= balances[msg.sender], "Amount exceeds balance");
        balances[msg.sender] -= _amount;
        (bool success, ) = _recipient.call{value: _amount}("");
        require(success, "Transfer failed");
        emit Released(msg.sender, _recipient, _amount);
    }
```

### Synopsis

**Insecure Calldata Parsing** in processRelease() allows attackers to hijack recipient address via crafted calls to processReleaseForMyself. Critical severity as it enables fund theft through parameter injection in internal calls.

### Technical Details

The vulnerability stems from:
1. **Incorrect Calldata Assumption**: processRelease uses inline assembly to read recipient from calldata position 36, assuming external call structure
2. **Internal Call Mismatch**: When called internally via processReleaseForMyself, parameters are passed via stack but assembly reads residual calldata
3. **Parameter Injection**: Attackers can append address data to processReleaseForMyself calls that gets interpreted as recipient by the assembly

This allows manipulating the recipient address in what should be self-releases by exploiting calldata leftovers from internal calls.

### Proof of Concept

1. Attacker deposits ETH and waits for vesting period
2. Craft call to processReleaseForMyself(amount) with extra 32 bytes containing attacker-controlled address at position 36
3. processReleaseForMyself calls processRelease(amount, msg.sender) internally
4. Assembly reads old calldata at position 36 (attacker's address) instead of msg.sender
5. Funds get sent to attacker's address instead of msg.sender

### Impact Assessment

**Critical Risk**: Allows complete theft of vested funds through apparently legitimate self-release calls. Attackers can drain any user's balance by frontrunning transactions or tricking users into signing malicious payloads. Requires only standard user interaction to trigger.

### Remediation

**Fix in processReleaseForMyself**:
```solidity
function processReleaseForMyself(uint256 _amount) public {
    processRelease(_amount, msg.sender);
}
```

**Original Code**:
```solidity
function processReleaseForMyself(uint256 _amount) public {
    processRelease(_amount, msg.sender);
}
```

**Corrected Code**:
```solidity
function processReleaseForMyself(uint256 _amount) public {
    address recipient = msg.sender;
    assembly {
        // Explicitly pass recipient as second parameter
        mstore(0x00, _amount)
        mstore(0x20, recipient)
        let success := call(gas(), address(), 0, 0x00, 0x40, 0, 0)
        if iszero(success) {
            returndatacopy(0, 0, returndatasize())
            revert(0, returndatasize())
        }
    }
}
```

Force proper parameter encoding for internal calls by using explicit assembly or modify processRelease to use stack parameters.

