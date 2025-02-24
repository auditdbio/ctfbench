# Audit Report 🎯

*Generated at 2025-02-18 03:22:58*

## 📊 Vulnerability Statistics

- Total vulnerabilities found: 2

---

## 🚨 Issue 1

### 📄 File: `Voting.sol`

### Original Code
```solidity
function vote() external {
    require(!hasVoted[msg.sender], "You have already voted");

    uint256 power = votingPowerContract.votingPower(msg.sender);
    require(power > 0, "No voting power");

    hasVoted[msg.sender] = true;
    totalVotes += power;

    emit VoteCast(msg.sender, power);
}
```

### Synopsis
The vote function allows voting power reuse through token transfers, enabling double-counting of the same underlying assets across multiple addresses. This access control failure permits artificial quorum inflation by transferring voting tokens between wallets to cast multiple votes.

### Technical Details
The vulnerability stems from tracking voter addresses rather than voting power sources. The contract:
1. Uses transferable voting tokens via IVotingPower interface
2. Only checks per-address voting status (hasVoted mapping)
3. Records current voting power at vote time

Attackers can:
1. Vote with Address A's full balance
2. Transfer tokens to Address B
3. Vote again with Address B's "new" balance
This allows the same tokens to be counted multiple times for totalVotes, violating the 1 token = 1 vote invariant.

### Proof of Concept
1. Deploy Voting with quorum=200
2. Alice has 150 voting tokens in Wallet A
3. Wallet A votes: totalVotes = 150
4. Alice transfers 150 tokens to Wallet B
5. Wallet B votes: totalVotes = 300
6. executeProposal() succeeds with inflated quorum

### Impact Assessment
Critical severity: Enables complete governance control with minority token ownership. Attackers can:
- Force proposal execution without real majority
- Artificially meet any quorum requirements
- Dilute legitimate voting power
Requires only transferable voting tokens and <50% honest participation.

### Remediation
Implement voting power locking in the IVotingPower contract. Modified vote function:

```solidity
function vote() external {
    require(!executed, "Voting closed");
    require(!hasVoted[msg.sender], "Already voted");
    
    uint256 power = votingPowerContract.lockVotingPower(msg.sender);
    require(power > 0, "No voting power");
    
    hasVoted[msg.sender] = true;
    totalVotes += power;
    
    emit VoteCast(msg.sender, power);
}
```

IVotingPower must implement lockVotingPower() to prevent transferred tokens from being reused for voting.



---

## 🚨 Issue 2

### 📄 File: `Voting.sol`

### Original Code  
```solidity
function vote() external {
    require(!hasVoted[msg.sender], "You have already voted");

    uint256 power = votingPowerContract.votingPower(msg.sender);
    require(power > 0, "No voting power");

    hasVoted[msg.sender] = true;
    totalVotes += power;

    emit VoteCast(msg.sender, power);
}
```

### Synopsis  
The `vote()` function lacks protection against voting power decay after voting, allowing attackers to artificially inflate `totalVotes` by repeatedly acquiring and burning voting power. This leads to premature quorum attainment despite users not holding sustained governance power.

### Technical Details  
The vulnerability stems from the lack of a snapshot mechanism for voting power. The current implementation checks voting power at the time of voting but does not lock or deduct the power. If the voting power contract allows temporary power delegation (e.g., flash-loaned tokens), attackers can:  

1. Acquire voting power (e.g., through a flash loan)  
2. Cast a vote, increasing `totalVotes` by the temporary power  
3. Return the borrowed power  
4. Repeat with new accounts to accumulate `totalVotes`  

Since `totalVotes` permanently stores historical voting power values, this allows protocol manipulation without sustained governance rights.

### Proof of Concept  
1. Attacker borrows 1M tokens via flash loan  
2. Votes using 10 fresh addresses, each temporarily holding 100k tokens  
3. `totalVotes` increases by 1M (10 * 100k)  
4. Attacker repays flash loan, leaving all voter addresses with zero power  
5. Quorum is met using ghost voting power that no longer exists  

### Impact Assessment  
Severity: Critical  
Attackers can hijack governance decisions using borrowed/stolen voting power. Proposals execute based on ephemeral stake, violating the protocol's governance integrity. Worst-case scenario: full control over `proposalTarget` execution.

### Remediation  
Implement a voting power snapshot system in the constructor:  

1. Take snapshot of voting powers at contract deployment  
2. Store individual voting power allowances from the snapshot  
3. Deduct used power during voting  

Modified `vote()` function:  
```solidity
function vote() external {
    require(!hasVoted[msg.sender], "Already voted");
    
    uint256 power = votingPowerContract.getPastVotingPower(msg.sender, snapshotBlock);
    require(power > 0, "No snapshot power");
    
    hasVoted[msg.sender] = true;
    totalVotes += power;
    
    emit VoteCast(msg.sender, power);
}
```

Add to constructor:  
```solidity
uint256 public immutable snapshotBlock;
constructor(...) {
    ...
    snapshotBlock = block.number;
}
```



