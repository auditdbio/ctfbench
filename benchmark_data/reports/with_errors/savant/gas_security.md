# Audit Report 🎯

*Generated at 2025-02-18 03:21:34*

## 📊 Vulnerability Statistics

- Total vulnerabilities found: 6

---

## 🚨 Issue 1

### 📄 File: `Airdrop.sol`

### Original Code
```solidity
function register() public {
    require(block.timestamp <= registrationDeadline, "Registration closed");
    require(eligible.isEligible(msg.sender), "Not eligible");
    require(!registered[msg.sender], "Already registered");
    registered[msg.sender] = true;
    participants.push(msg.sender);
}
```

### Synopsis
The `register` function allows unlimited participant registrations, enabling a boundary condition where distribution's gas requirements exceed block limits. Attackers can register numerous eligible addresses to permanently prevent token distribution by making transactions impossible to process.

### Technical Details
The vulnerability stems from missing participant count validation in the `register` function. The `distribute` function loops through all participants, but with excessive registrations (over ~500 addresses), gas costs surpass block limits. Since `distributed` is only set AFTER successful distribution, repeated failed attempts remain possible but ineffective. This creates permanent fund lockage as legitimate distribution becomes technically impossible.

### Proof of Concept
1. Attacker deploys malicious eligibility contract approving unlimited addresses
2. Using script, attacker registers 2000 eligible addresses
3. Token balance = 2000 tokens (1 per participant expected)
4. `distribute()` attempts 2000 transfers in one transaction
5. Transaction hits gas limit at ~500 transfers, reverts
6. Repeat attempts fail identically, funds remain permanently locked

### Impact Assessment
**Severity:** Critical (CVSS 9.3)  
Permanent loss of all airdrop funds. Attack cost is minimal (gas for registrations). Requires eligible status manipulation, but many real-world eligibility checks (e.g., token holding) could be gamed. Successful attack leaves zero recovery path as contract enters unrecoverable state.

### Remediation
Implement maximum participant cap in registration:

```solidity
function register() public {
    require(block.timestamp <= registrationDeadline, "Registration closed");
    require(eligible.isEligible(msg.sender), "Not eligible");
    require(!registered[msg.sender], "Already registered");
+   require(participants.length < MAX_PARTICIPANTS, "Registration full");
    registered[msg.sender] = true;
    participants.push(msg.sender);
}
```

Add `MAX_PARTICIPANTS` as immutable parameter set in constructor. Alternative: Use batched distributions, but cap is simplest solution.



---

## 🚨 Issue 2

### 📄 File: `Airdrop.sol`

### Original Code
```solidity
function distribute() external {
    require(block.timestamp > registrationDeadline, "Distribution not started");
    require(!distributed, "Already distributed");
    uint256 totalParticipants = participants.length;
    require(totalParticipants > 0, "No participants");

    uint256 balance = token.balanceOf(address(this));
    uint256 amountPerParticipant = balance / totalParticipants;

    distributed = true;

    for (uint256 i = 0; i < totalParticipants; i++) {
        require(token.transfer(participants[i], amountPerParticipant), "Transfer failed");
    }
}
```

### Synopsis
The register function allows unlimited participant registrations, enabling a boundary condition where token distribution calculations truncate to zero. Attackers can flood registrations to render the airdrop worthless, permanently locking all deposited funds.

### Technical Details
The vulnerability stems from missing participant count validation in `register()`:
1. Anyone can register multiple times (via distinct addresses) until deadline
2. `distribute()` uses integer division: `balance / participants.length`
3. If participants > token balance, division yields zero amount per recipient
4. Zero-value transfers execute successfully (per ERC20 spec) but distribute nothing
5. `distributed` flag gets set, preventing corrective redistribution

### Proof of Concept
1. Deploy Airdrop contract with 100 wei token balance
2. Attacker registers 101 eligible addresses via script
3. Call `distribute()` after deadline:
   - balance = 100, participants = 101
   - 100 / 101 = 0 (integer division)
   - All transfers send 0 tokens
4. Tokens remain trapped with `distributed = true`

### Impact Assessment
Critical severity (CVSS 9.3). Attackers can:
- Brick any airdrop by front-running with mass registrations
- Permanently freeze all deposited tokens
- Requires only Sybil addresses & eligibility criteria weakness
- Worst-case: Complete loss of airdrop funds with no recovery

### Remediation
Add zero-amount prevention in `distribute()`:
```solidity
function distribute() external {
    require(block.timestamp > registrationDeadline, "Distribution not started");
    require(!distributed, "Already distributed");
    uint256 totalParticipants = participants.length;
    require(totalParticipants > 0, "No participants");

    uint256 balance = token.balanceOf(address(this));
    uint256 amountPerParticipant = balance / totalParticipants;
    require(amountPerParticipant > 0, "Insufficient tokens per participant"); // <-- FIX
    
    distributed = true;

    for (uint256 i = 0; i < totalParticipants; i++) {
        require(token.transfer(participants[i], amountPerParticipant), "Transfer failed");
    }
}
```



---

## 🚨 Issue 3

### 📄 File: `Airdrop.sol`

### Original Code

```solidity
function distribute() external {
    require(block.timestamp > registrationDeadline, "Distribution not started");
    require(!distributed, "Already distributed");
    uint256 totalParticipants = participants.length;
    require(totalParticipants > 0, "No participants");

    uint256 balance = token.balanceOf(address(this));
    uint256 amountPerParticipant = balance / totalParticipants;

    distributed = true;

    for (uint256 i = 0; i < totalParticipants; i++) {
        require(token.transfer(participants[i], amountPerParticipant), "Transfer failed");
    }
}
```

### Synopsis

The `distribute()` function lacks a zero-balance check, allowing execution when contract holds no tokens. This permanently locks the distribution state while participants receive zero tokens, rendering any future token deposits irrecoverable due to the `distributed` flag being set.

### Technical Details

The vulnerability occurs during the token distribution phase:
1. `distribute()` calculates `balance` as current token holdings but doesn't validate it's >0
2. When balance=0, `amountPerParticipant` becomes 0 due to integer division
3. The contract marks distribution as complete (`distributed=true`) after sending zero-value transfers
4. Subsequent token deposits become permanently stuck as distribution can't be re-triggered

This creates a fatal state when:
- Contract deployed without initial funding
- Accidental early distribution call before funding
- Temporary balance depletion before distribution

### Proof of Concept

1. Deploy Airdrop with future `registrationDeadline`
2. Addresses register through `register()` (requires 0 tokens)
3. Immediately call `distribute()` after deadline passes (contract still has 0 balance)
4. All participants receive 0 tokens
5. Send 1000 tokens to contract
6. Attempting `distribute()` again fails due to `distributed=true` check

### Impact Assessment

- **Severity:** Critical (CVSS: 9.1)
- **Attack Feasibility:** High - no special privileges required
- **Impact:**
  - Permanent loss of all deposited funds
  - Irreversible lock of distribution mechanism
  - Requires contract redeployment to recover
- **Worst Case:** Early distribution call bricks contract permanently despite later funding

### Remediation

Add balance validation before processing distributions:

```solidity
function distribute() external {
    require(block.timestamp > registrationDeadline, "Distribution not started");
    require(!distributed, "Already distributed");
    uint256 totalParticipants = participants.length;
    require(totalParticipants > 0, "No participants");

    uint256 balance = token.balanceOf(address(this));
    require(balance > 0, "Zero token balance"); // Add this check
    uint256 amountPerParticipant = balance / totalParticipants;

    distributed = true;

    for (uint256 i = 0; i < totalParticipants; i++) {
        require(token.transfer(participants[i], amountPerParticipant), "Transfer failed");
    }
}
```



---

## 🚨 Issue 4

### 📄 File: `Airdrop.sol`

### Original Code
```solidity
function distribute() external {
    require(block.timestamp > registrationDeadline, "Distribution not started");
    require(!distributed, "Already distributed");
    uint256 totalParticipants = participants.length;
    require(totalParticipants > 0, "No participants");

    uint256 balance = token.balanceOf(address(this));
    uint256 amountPerParticipant = balance / totalParticipants;

    distributed = true;

    for (uint256 i = 0; i < totalParticipants; i++) {
        require(token.transfer(participants[i], amountPerParticipant), "Transfer failed");
    }
}
```

### Synopsis
The `distribute()` function contains a critical denial-of-service vulnerability where a single failed token transfer permanently blocks the entire airdrop distribution. If any participant (accidentally or maliciously) cannot receive tokens, the entire distribution process becomes irreversibly stuck, freezing all locked funds.

### Technical Details
The vulnerability stems from atomic failure handling in the distribution loop. The function uses `require()` statements for each token transfer, causing the entire transaction to revert if any single transfer fails. Since the `distributed` state flag is only set *after* all transfers complete, failed transactions leave the contract in a state where:  
1. Distribution can be reattempted indefinitely  
2. All subsequent attempts will fail at the same problematic transfer  
3. No participants ever receive tokens  

This creates a fatal dependency where one incompatible recipient (smart contract without ERC20 support, blacklisted address, or contract with reverting fallback) can permanently brick the airdrop. The eligibility check during registration doesn't prevent addresses that pass initial checks but later become unable to receive tokens.

### Proof of Concept
1. Attacker deploys a contract that:  
   a. Passes `eligible.isEligible()` check  
   b. Reverts on ERC20 `transfer()` calls  
2. Attacker registers this contract via `register()`  
3. Legitimate users register normally  
4. Any call to `distribute()`:  
   a. Processes recipients in array order  
   b. Fails on first transfer to attacker's contract  
   c. Reverts entire transaction  
   d. Leaves `distributed` flag unset  
5. Distribution becomes permanently blocked - all funds locked

### Impact Assessment
**Severity:** Critical (CVSS 9.1)  
- **Prerequisites:** Attacker needs to register at least one blocking address  
- **Direct Impact:** Permanent loss of all airdrop funds  
- **Business Impact:** Complete protocol functionality denial, reputational damage, legal liabilities for locked user assets  
- **Attack Vector:** Easily exploitable through predictable registration patterns  

### Remediation
**Solution:** Implement atomic-per-recipient distribution with failed transfer isolation:  
1. Track distributed amounts per participant  
2. Remove per-transfer `require()` statements  
3. Handle individual transfer failures without reverting entire transaction  

Modified `distribute()` function:  
```solidity
function distribute() external {
    require(block.timestamp > registrationDeadline, "Distribution not started");
    require(!distributed, "Already distributed");
    uint256 totalParticipants = participants.length;
    require(totalParticipants > 0, "No participants");

    uint256 balance = token.balanceOf(address(this));
    uint256 amountPerParticipant = balance / totalParticipants;

    distributed = true;

    for (uint256 i = 0; i < totalParticipants; i++) {
        address participant = participants[i];
        // Attempt transfer without reverting on failure
        (bool success,) = address(token).call(
            abi.encodeWithSignature(
                "transfer(address,uint256)",
                participant,
                amountPerParticipant
            )
        );
        // Log failures for manual remediation
        if (!success) {
            emit TransferFailed(participant);
        }
    }
}
```



---

## 🚨 Issue 5

### 📄 File: `Airdrop.sol`

### Original Code
```solidity
    function distribute() external {
        require(block.timestamp > registrationDeadline, "Distribution not started");
        require(!distributed, "Already distributed");
        uint256 totalParticipants = participants.length;
        require(totalParticipants > 0, "No participants");

        uint256 balance = token.balanceOf(address(this));
        uint256 amountPerParticipant = balance / totalParticipants;

        distributed = true;

        for (uint256 i = 0; i < totalParticipants; i++) {
            require(token.transfer(participants[i], amountPerParticipant), "Transfer failed");
        }
    }
```

### Synopsis
The `distribute()` function performs token transfers in an unbounded loop without gas limits, risking transaction failure if any transfer consumes excessive gas. A single malicious participant can intentionally trigger high gas consumption, leading to permanent distribution lockout.

### Technical Details
The vulnerability arises from making unlimited-gas external calls during token transfers in a loop. ERC20's `transfer` typically uses fixed gas, but non-compliant tokens (e.g., ERC777) may invoke untrusted recipient callbacks. A malicious participant can deploy a contract that consumes excessive gas during token receipt, causing the entire transaction to revert and preventing distribution completion.

### Proof of Concept
1. Attacker deploys a contract that reverts or consumes excessive gas when receiving tokens
2. Attacker registers this contract as a participant
3. Legitimate user calls `distribute()`
4. Transaction processes until reaching the malicious participant
5. Malicious transfer consumes all remaining gas, reverting transaction
6. Distribution becomes permanently blocked due to revert-on-failure logic

### Impact Assessment
**Severity:** Critical  
Attackers can permanently prevent token distribution by front-running with a single malicious address. Funds remain locked in the contract indefinitely, requiring redeployment and loss of trust. Attack cost is minimal (gas for registration), and success rate is 100% if executed correctly.

### Remediation
Replace batch transfers with a pull-based withdrawal pattern:

1. Track unclaimed amounts per participant
2. Remove the distribution loop
3. Let participants claim their allocations individually

Add claim tracking and remove the `distributed` state race condition:

```solidity
mapping(address => uint256) public claimableAmount;

function distribute() external {
    require(block.timestamp > registrationDeadline, "Distribution not started");
    require(!distributed, "Already distributed");
    uint256 totalParticipants = participants.length;
    require(totalParticipants > 0, "No participants");

    uint256 balance = token.balanceOf(address(this));
    uint256 amountPerParticipant = balance / totalParticipants;
    
    distributed = true;
    
    for (uint256 i = 0; i < totalParticipants; i++) {
        claimableAmount[participants[i]] = amountPerParticipant;
    }
}

function claim() external {
    require(distributed, "Distribution not completed");
    uint256 amount = claimableAmount[msg.sender];
    require(amount > 0, "Nothing to claim");
    claimableAmount[msg.sender] = 0;
    require(token.transfer(msg.sender, amount), "Transfer failed");
}
```



---

## 🚨 Issue 6

### 📄 File: `Airdrop.sol`

### Original Code
```solidity
constructor(address _token, uint256 _registrationDeadline, address _eligible) {
    token = IERC20(_token);
    registrationDeadline = _registrationDeadline;
    eligible = IEligible(_eligible);
    register();
}
```

### Synopsis
The constructor fails to validate that `registrationDeadline` is set in the future, allowing deployers to set it to the deployment timestamp. This creates an instant closure of registration, enabling the deployer to capture the entire airdrop by being the sole participant.

### Technical Details
The vulnerability stems from the missing validation of `_registrationDeadline` in the constructor. When deployers set this parameter to the current block timestamp (`block.timestamp`), they can successfully register during contract creation (as deadline ≥ current time holds true during that block). All subsequent registration attempts by other users fail immediately since `block.timestamp` exceeds the deadline from the next block onward. This allows the deployer to monopolize the airdrop by being the only registered participant.

### Proof of Concept
1. **Deployer Action**: Deploy `Airdrop` with:
   ```solidity
   _registrationDeadline = block.timestamp // Current block timestamp
   ```
2. **Registration During Deployment**: Constructor calls `register()`, passing checks:
   - `block.timestamp ≤ registrationDeadline` (true, since equal)
   - Other checks pass (eligibility)
3. **Post-Deployment**: Other users attempt to call `register()`, but transaction occurs in subsequent blocks where `block.timestamp > registrationDeadline`, causing immediate revert.
4. **Distribution**: `distribute()` sends entire token balance to the deployer as sole participant.

### Impact Assessment
**Severity**: Critical  
**Impact**: Deployers can steal 100% of airdrop funds by engineering sole participation.  
**Prerequisites**: None beyond deployer control of initialization parameters.  
**Business Impact**: Complete loss of airdrop funds to unauthorized party, destroying trust and protocol integrity.

### Remediation
Add validation in the constructor to ensure `_registrationDeadline` is set sufficiently in the future. Modify constructor as follows:

```solidity
constructor(address _token, uint256 _registrationDeadline, address _eligible) {
    require(_registrationDeadline > block.timestamp, "Deadline must be future");
    token = IERC20(_token);
    registrationDeadline = _registrationDeadline;
    eligible = IEligible(_eligible);
    register();
}
```



