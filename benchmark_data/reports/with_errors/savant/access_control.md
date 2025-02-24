# Audit Report 🎯

*Generated at 2025-02-18 03:19:45*

## 📊 Vulnerability Statistics

- Total vulnerabilities found: 4

---

## 🚨 Issue 1

### 📄 File: `Voting.sol`

### Original Code
```solidity
function setOwner(address newOwner) public {
    owner = newOwner;
}
```

### Synopsis
The contract lacks critical access control on `setOwner` function allowing anyone to become owner and bypass administrative restrictions. Vulnerability stems from missing `onlyOwner` modifier application despite proper modifier definition.

### Technical Details
The `onlyOwner` modifier (defined in highlighted code) correctly restricts access, but the `setOwner` function fails to use it. This allows any address to arbitrarily change contract ownership, enabling full administrative privilege takeover. The modifier itself is correctly implemented but not applied where needed, creating an access control bypass.

### Proof of Concept
1. Deploy contract with Alice as initial owner
2. Attacker calls `setOwner(attackerAddress)`
3. Verify `owner` is now attackerAddress
4. Attacker calls `addProposal`/`extendVoting` using stolen owner privileges

### Impact Assessment
Severity: Critical. Allows complete contract takeover. Attackers can manipulate voting results, add malicious proposals, extend voting periods indefinitely, and lock legitimate owner out. Requires zero prerequisites - exploitable in one transaction by any user.

### Remediation
Add `onlyOwner` modifier to `setOwner` function:
```solidity
function setOwner(address newOwner) public onlyOwner {
    owner = newOwner;
}
```



---

## 🚨 Issue 2

### 📄 File: `Voting.sol`

### Original Code
```solidity
modifier onlyOwner() {
    require(msg.sender == owner, "Not owner");
    _;
}
```

### Synopsis
The `onlyOwner` modifier lacks a zero-address check, enabling permanent contract lockdown if ownership is renounced or improperly set, leading to denial-of-service for critical owner-dependent functionality.

### Technical Details
The `onlyOwner` modifier validates `msg.sender == owner` but doesn't verify `owner != address(0)`. If ownership is transferred to the zero address (via the unprotected `setOwner` function), all modifier-protected functions become permanently inaccessible. This creates a contract-wide denial-of-service state where governance functions (adding proposals, extending voting) become permanently frozen.

### Proof of Concept
1. Attacker calls `setOwner(0x0000000000000000000000000000000000000000)`
2. Now `owner == address(0)` 
3. Any call to `addProposal()` or `extendVoting()` fails because:
   - `onlyOwner` modifier checks `msg.sender == 0x0` (impossible)
   - These functions become permanently unusable
4. Voting system loses ability to add new proposals or adjust timelines

### Impact Assessment
Severity: Critical  
If exploited, this permanently disables all owner-controlled functionality. Attackers could sabotage governance processes by locking proposal management and timeline adjustments. Combined with the public `setOwner` vulnerability, this creates an unrecoverable contract state requiring redeployment.

### Remediation
Add zero-address validation to ownership changes and modifier checks:

1. Modify `setOwner` to include zero-address check (already reported but needs correction)
2. Update `onlyOwner` modifier to prevent zero-address ownership:

```solidity
modifier onlyOwner() {
    require(owner != address(0), "Ownership renounced");
    require(msg.sender == owner, "Not owner");
    _;
}
```



---

## 🚨 Issue 3

### 📄 File: `Voting.sol`

### Original Code
```solidity
function setOwner(address newOwner) public {
    owner = newOwner;
}
```

### Synopsis
The `setOwner` function lacks zero-address validation, allowing irreversible loss of contract ownership. Attackers can set owner to 0x0, permanently locking privileged functions and disrupting governance. Critical severity due to permanent denial of administrative control.

---

### Technical Details
**Vulnerability:** Missing boundary check for zero address in ownership transfer  
**Affected Component:** `setOwner` function  
**Mechanism:**  
1. Function accepts any address as new owner including address(0)
2. Ethereum zero address (0x000...000) is invalid/uncontrolled
3. If set to zero address:
   - All `onlyOwner` functions become permanently inaccessible
   - Governance mechanisms (proposal adding, deadline extension) are frozen
   - No recovery path exists as ownership modification requires owner privileges

**Root Cause:** Lack of `require(newOwner != address(0))` validation before assignment

---

### Proof of Concept
1. Attacker calls `setOwner(address(0))`
2. Verify ownership transfer:
   ```solidity
   // Before attack
   console.log(ctfVoting.owner()) // Returns original owner address
   
   // Execute attack
   ctfVoting.setOwner(address(0));
   
   // After attack
   console.log(ctfVoting.owner()) // Returns 0x0000000000000000000000000000000000000000
   ```
3. Attempt owner-only function:
   ```solidity
   ctfVoting.addProposal("Malicious Proposal"); // Reverts with "Not owner" 
   ```

---

### Impact Assessment
**Severity:** Critical (CVSS 9.3)  
**Prerequisites:** None - exploitable by any account  
**Worst Case:**  
- Permanent loss of contract governance
- Voting system becomes immutable (no new proposals, deadline extensions)
- Protocol requires redeployment with lost historical data
- Funds not directly at risk unless owner controls treasury functions

---

### Remediation
Add zero-address validation and access control:
```solidity
function setOwner(address newOwner) public onlyOwner {
    require(newOwner != address(0), "Invalid owner address");
    owner = newOwner;
}
```

**Key Fixes:**  
1. Add `onlyOwner` modifier to restrict access
2. Require non-zero address for ownership transfers

---



---

## 🚨 Issue 4

### 📄 File: `Voting.sol`

### Original Code
```solidity
    constructor(uint256 duration, string[] memory proposalDescriptions) {
        owner = msg.sender;
        votingDeadline = block.timestamp + duration;
        for (uint i = 0; i < proposalDescriptions.length; i++) {
            proposals.push(Proposal({description: proposalDescriptions[i], voteCount: 0}));
        }
    }
```

### Synopsis
The constructor lacks validation on the `duration` parameter, allowing an infinite voting period. This enables malicious owners to continuously add proposals, leading to unbounded gas consumption in `winningProposal()` and potential denial-of-service when determining election results.

### Technical Details
The vulnerability stems from the constructor accepting any `duration` value without upper bounds. When combined with:
1. Publicly callable `setOwner()` allowing anyone to become owner
2. Owner-controlled `addProposal()` that works while `block.timestamp < votingDeadline`
3. Linear iteration in `winningProposal()`

An attacker can:
1. Deploy with `duration = type(uint256).max` 
2. Take ownership via `setOwner()`
3. Add unlimited proposals through `addProposal()`
4. Make `winningProposal()` iterations exceed block gas limit

### Proof of Concept
1. Attacker deploys contract: `new CTFVoting(type(uint256).max, [""])`
2. Attacker calls `setOwner(attackerAddress)`
3. For i in 1..10,000: `addProposal("DoS")` (costs ~24k gas/proposal)
4. Any call to `winningProposal()` now requires iterating 10k storage slots (~2M gas), exceeding Ethereum's 30M limit at ~125k proposals

### Impact Assessment
Severity: Critical 
- Attackers can permanently disable election result determination
- Requires only standard transaction capabilities
- Directly prevents core contract functionality
- Irreversible once proposals exceed gas limits
- Impacts all contract users and dependent systems

### Remediation
Add maximum duration check in constructor and implement proposal caps:

```solidity
constructor(uint256 duration, string[] memory proposalDescriptions) {
    require(duration <= 30 days, "Excessive voting duration");
    require(proposalDescriptions.length <= 100, "Too many initial proposals");
    owner = msg.sender;
    votingDeadline = block.timestamp + duration;
    for (uint i = 0; i < proposalDescriptions.length; i++) {
        proposals.push(Proposal({description: proposalDescriptions[i], voteCount: 0}));
    }
}
```



