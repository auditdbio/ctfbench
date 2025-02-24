# **Comprehensive Documentation for MerkleAirdrop Smart Contract**

# **Introduction**

The MerkleAirdrop smart contract is designed to facilitate the distribution of ERC-20 tokens to specified recipients using a Merkle Tree structure. This contract ensures that tokens are distributed securely and verifiably to entitled recipients based on precomputed proofs. Utilized in scenarios requiring efficient verification and minimal storage, the Merkle Tree structure is ideal for airdrops or distributions involving large datasets.

### **Overview**

### **Key Features:**

- **Merkle Tree Verification**: Utilizes Merkle proofs to verify claims securely.
- **Token Distribution**: Distributes specified ERC-20 tokens to verified recipients.
- **Role-based Access**: Only the contract owner can update the Merkle root.

### **Dependencies**

- **OpenZeppelin Contracts**: Importing well-audited libraries for secure token operations and ownership control.
	- IERC20: Interface for ERC-20 token.
	- SafeERC20: Safe operations for ERC-20 tokens.
	- Ownable: Ensures that certain functions can only be called by the contract owner.

# **Contract Structure**

### **State Variables**

- merkleRoot (bytes32): The root hash of the Merkle Tree, updated only by the owner, acts as the base for proof verification.
- token (IERC20): The ERC-20 token to be distributed through the airdrop.
- payouts (mapping): Tracks the amount already claimed by each leafHash to prevent double claims.

#### **Events**

- Claimed: Emitted upon the successful claim of tokens, storing the receiver's address, total amount, and leaf hash.
#### **Constructor**

- **Parameters**:
	- _token: The token to be distributed.
	- _merkleRoot: Initial Merkle root hash.
- **Functionality**: Initializes the contract by setting the token and initial Merkle root.

### **Functions**

#### **setMerkleRoot**

- **Access**: onlyOwner
- **Parameters**: _merkleRoot (bytes32) The new Merkle root.
- **Functionality**: Updates the Merkle root to represent new eligible claims.

#### **Parameters**:

- nonce (uint96): An arbitrary value to ensure unique leaves if necessary.
- receiver (address): Address to which the payout will be sent.
- amount (uint256): Total allocation available for the receiver.
- payout (uint256): Amount to be claimed in this transaction.
- proof (bytes32[]): Merkle proof array for verification.

#### **Functionality**:

- Validates the provided proof against the Merkle root.
- Ensures that cumulative payouts do not exceed the allocated amount.
- Transfers the tokens using the SafeERC20.safeTransfer function.
- Emits a Claimed event upon success.

#### **verifyProof**

- **Parameters**:
	- proof (bytes32[]): The Merkle proof array.
	- root (bytes32): The root hash of the Merkle Tree.
	- leaf (bytes32): The hash of the claim parameters.
- **Functionality**: Iteratively hashes the elements of the proof with the leaf or intermediate nodes to check convergence with the Merkle root.

### **Best Practices and Considerations**

- **Security**: Use the SafeERC20 library to securely handle token transfers, preventing reentrancy attacks and unnecessary token loss.
- **Efficiency**: Optimize storage by employing a Merkle Tree to handle potentially large datasets with small cryptographic proof sizes.
- **Permission Control**: Only the owner can modify the Merkle root, preventing unauthorized changes.

# **Conclusion**

The MerkleAirdrop contract provides a secure and efficient mechanism to distribute ERC-20 tokens based on precomputed proofs. It leverages the benefits of the Merkle Tree structure to ensure fair distribution with minimal storage and computational overhead. This documentation serves as a guide for developers looking to implement or audit the MerkleAirdrop contract, ensuring clarity in its structure and functionality.

# **Security Analysis of the MerkleAirdrop Solidity Contract**

The provided code implements a Merkle Airdrop using the Solidity programming language. It effectively utilizes OpenZeppelin's contracts for handling ERC20 tokens and employs a verification process based on Merkle proofs. Below is a detailed analysis of potential security issues within the contract, along with suggestions on how to remedy them.

#### **Security Issues**

#### **1. Reentrancy Attack Risk**

**Issue**: The method claim does not use any protection mechanisms against reentrancy, which could potentially allow an attacker to recall the claim function and drain tokens before the payouts[leaf] is updated.

**Consequence**: Exploiting this vulnerability could allow a malicious user to repetitively claim rewards, thereby depleting the funds meant for other legitimate users.

#### **Mitigation**:

- **Using Mutex (OpenZeppelin ReentrancyGuard)**: Implement a mutex using OpenZeppelin's ReentrancyGuard to prevent reentrant calls.
import "@openzeppelin/contracts/security/ReentrancyGuard.sol"; contract MerkleAirdrop is Ownable, ReentrancyGuard { ... function claim(

#### **2. Immutable References Violation**

**Issue**: The token reference is declared as a state variable but is not marked as immutable.

**Consequence**: While this isn't a critical issue, marking state variables as immutable when they won't change after the contract's constructor execution can optimize the contract by providing cheaper access in future transactions.

#### **Mitigation**:

- **Mark non-changing state variables as immutable.**
IERC20 public immutable token;

#### **3. Lack of Event Emission on Critical Operations**

**Issue**: Some critical operations, such as updating the merkleRoot, do not emit events, which can hinder tracking and transparency of changes taking place within the contract.

**Consequence**: Users tracking the state of the contract might not be aware of changes to critical variables, making the contract less transparent and harder to audit externally.

#### **Mitigation**:

- **Emit Events upon Change in State**:

```
event MerkleRootUpdated(bytes32 oldMerkleRoot, bytes32 newMerkleRoot);
function setMerkleRoot(bytes32 _merkleRoot) external onlyOwner {
  emit MerkleRootUpdated(merkleRoot, _merkleRoot);
  merkleRoot = _merkleRoot;
}
```
#### **4. Potential Gas Limit Exceedance**

**Issue**: The verifyProof function, although implemented correctly to follow the Merkle proof verification process, requires iterating over a variable-length array (proof). This can potentially lead to high gas costs or exceeding block gas limits, especially with proofs of larger lengths.

**Consequence**: Users attempting to claim their airdrop amounts may face transaction failures due to excessive gas requirements, causing potential denial of service.

#### **Mitigation**:

- **Maintain small batch sizes for claims** and encourage users to do the same to maintain operational feasibility in order to reduce the number of hashes needed and stay within manageable gas costs per transaction.
#### **Code Review**

#### **Best Practices and Recommendations:**

- 1. **Ensure Complete Access Control**:
	- While the onlyOwner modifier is properly applied on setMerkleRoot, ensure that other critical functions which require restricted access also appropriately use modifiers to restrict access.

#### 2. **Safe Arithmetic Operations**:

- Current code relies on Solidity's checked arithmetic in payouts[leaf] + payout <= amount. While safe arithmetic is enforced by default in Solidity ^0.8.0, any future use of older Solidity versions should include safe math checks using OpenZeppelin or other safe math libraries.
#### 3. **Gas Fee Estimation**:

- Provide explicit information to users regarding the gas fees expected and ensure proper optimizations are in place to keep gas costs minimal.
The structure of the contract follows good coding standards utilizing OpenZeppelin's well-audited libraries, which provides a significant level of default safety. However, addressing these security issues and adopting best practices will further strengthen the robustness of the MerkleAirdrop contract. By applying the suggested mitigations, developers and users of this contract can ensure better security and an overall trustworthy environment for managing token airdrops using a Merkle tree structure.

### **Test cases**

To write test cases for the MerkleAirdrop Solidity contract in Go, we need to set up a Go environment that can interact with Ethereum smart contracts. We can use the go-ethereum library for this purpose. Below is how we can create test cases to test some of the functionalities of your smart contract, such as setting the Merkle root and claiming tokens from the airdrop.

First, ensure that you have the necessary packages installed:

go get github.com/ethereum/go-ethereum go get github.com/stretchr/testify/assert go get github.com/stretchr/testify/mock

We will use geth, the go-ethereum official Go implementation, and testify to write and execute the test cases.

Here's a sample test file in Go for your smart contract:

```
package main
import (
  "crypto/ecdsa"
  "fmt"
  "math/big"
  "testing"
  "github.com/ethereum/go-ethereum"
  "github.com/ethereum/go-ethereum/accounts/abi/bind"
  "github.com/ethereum/go-ethereum/accounts/keystore"
  "github.com/ethereum/go-ethereum/common"
  "github.com/ethereum/go-ethereum/core"
  "github.com/ethereum/go-ethereum/core/types"
  "github.com/ethereum/go-ethereum/crypto"
  "github.com/stretchr/testify/assert"
)
// TestMerkleAirdrop tests the functionality of the MerkleAirdrop contract
func TestMerkleAirdrop(t *testing.T) {
  // Setup simulated blockchain environment
  key, _ := crypto.GenerateKey()
  auth := bind.NewKeyedTransactor(key)
  alloc := make(core.GenesisAlloc)
  alloc[auth.From] = core.GenesisAccount{Balance: big.NewInt(1000000000000)}
  sim := backends.NewSimulatedBackend(alloc, 10000000)
  // Deploy the contract with initial parameters
  tokenAddress := deployERC20Token(t, sim, auth)
  merkleRoot := [32]byte{}
  contractAddress, _, instance, err := DeployMerkleAirdrop(auth, sim, tokenAddress, merkleRoot)
  if err != nil {
    t.Fatalf("Failed to deploy new token: %v", err)
  }
```

```
sim.Commit()
  // Test setting the merkle root
  newMerkleRoot := [32]byte{}
  copy(newMerkleRoot[:], crypto.Keccak256([]byte("newMerkleRoot")))
  _, err = instance.SetMerkleRoot(auth, newMerkleRoot)
  if err != nil {
     t.Fatalf("Failed to set merkle root: %v", err)
  }
  sim.Commit()
  // Verify the merkle root has been set correctly
  root, err := instance.MerkleRoot(nil)
  assert.NoError(t, err)
  assert.Equal(t, newMerkleRoot, root, "The merkle root was not set correctly.")
  // Additional tests for 'claim' can be added as needed
}
// Helper function to deploy an ERC20 token
func deployERC20Token(t *testing.T, sim *backends.SimulatedBackend, auth *bind.TransactOpts)
common.Address {
  // You would replace this with deploying your own ERC20 token
  // This function should return the deployed token address
  // For example purpose, returns a generated address
  key, _ := crypto.GenerateKey()
  return crypto.PubkeyToAddress(key.PublicKey)
}
```
### **How to Run the Tests**

You need to have a Go development environment on your machine. Follow these steps:

- 1. Save the Go test file above.
- 2. Run the tests using the go test command in the terminal within the same directory as your Go files.

#### **Explanation**

- **SimulatedBackend**: Creates an Ethereum simulator which is ideal for unit testing and does not require a real Ethereum client or any network access.
- **DeployMerkleAirdrop**: This function will be generated by the abigen tool for your MerkleAirdrop contract. You need to run abigen on your Solidity code to generate Go bindings for your contract.
- **ERC20 deployment**: The deployERC20Token is a placeholder. Replace this with the actual deployment logic of your ERC20 token if needed.

Remember that the above tests cover setting the merkle root only. You should expand the tests to cover the claim function, including verifying Merkle proofs and checking token balances. To do this, you might need to pre-compute Merkle proofs for known addresses and amounts manually or with a script.

# **Optimizations**

Here are some optimizations and improvements you can apply to the Solidity code:

- 1. **Gas Optimization in claim function:** Check for amount eligibility after verifying the proof. Verifying the proof requires computation and should be done before further state modification.
- 2. **Use of constant and immutable keywords:** Using constant or immutable for values that don't change can save on gas costs. For instance, merkleRoot can be declared as immutable since it's likely set once at deployment and not frequently updated.
- 3. **Function visibility:** Use external over public for functions that are not intended to be called internally to save gas.
- 4. **Repetitive Event Data:** The amount in emit Claimed(receiver, amount, leaf); may be redundant, as the same can be derived from payouts[leaf], therefore conserving storage access (gas).

```
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
contract MerkleAirdrop is Ownable {
  using SafeERC20 for IERC20;
  bytes32 public immutable merkleRoot;
  IERC20 public immutable token;
  mapping(bytes32 => uint256) public payouts;
  event Claimed(address indexed receiver, uint256 payout, bytes32 leafHash);
  constructor(IERC20 _token, bytes32 _merkleRoot) {
    token = _token;
    merkleRoot = _merkleRoot;
  }
  function setMerkleRoot(bytes32 _merkleRoot) external onlyOwner {
    // You might prefer to set this once and make it immutable for gas savings.
    // Uncomment below line and comment out this function if no resetting is intended
    // merkleRoot = _merkleRoot;
  }
  function claim(
    uint96 nonce,
    address receiver,
    uint256 amount,
    uint256 payout,
    bytes32[] calldata proof
  ) external {
    bytes32 leaf = keccak256(abi.encodePacked(nonce, receiver, amount));
    require(verifyProof(proof, merkleRoot, leaf), "Invalid proof");
    require(payouts[leaf] + payout <= amount, "Exceeds eligible amount");
    payouts[leaf] += payout;
    token.safeTransfer(receiver, payout);
    emit Claimed(receiver, payout, leaf); // Removed redundant amount
  }
  function verifyProof(
    bytes32[] calldata proof,
    bytes32 root,
    bytes32 leaf
  ) internal pure returns (bool) {
    bytes32 computedHash = leaf;
    for (uint256 i = 0; i < proof.length; i++) {
       bytes32 proofElement = proof[i];
       if (computedHash <= proofElement) {
         computedHash = keccak256(abi.encodePacked(computedHash, proofElement));
       } else {
         computedHash = keccak256(abi.encodePacked(proofElement, computedHash));
       }
    }
    return computedHash == root;
  }
}
```
### **Summary**

- **Gas Efficiency:** Checking the proof validity before performing additional computations helps in saving unnecessary gas fees.
- **Code Clarity:** Using the right variable mutability (constant or immutable) where possible clarifies the intended use and optimizes gas usage.

- **Event Emission:** Emitting only necessary data in events helps reduce gas costs.
# **Top Vulnerabilities**

CWE-287: Improper Authentication,CWE-362: Race Condition

# **CVE Description**

```
[
  {
     "issue": "CWE-287: Improper Authentication",
     "description": "The `claim` function does not have any form of access control, allowing
anyone with a valid proof to execute it and potentially claim tokens that they are not entitled to.
This function should be protected to ensure that only authorized users can claim tokens.",
     "recommendation": "Consider implementing additional authentication checks to ensure that
only authorized users can call the `claim` function. For example, you might require signature
verification or additional whitelisting measures based on your use case."
  },
  {
     "issue": "CWE-362: Race Condition",
     "description": "The `claim` function's logic for incrementing the payouts can lead to race
conditions. If two transactions are processed simultaneously that update the same state, it can
result in inconsistent state updates.",
     "recommendation": "Use the `Checks-Effects-Interactions` pattern to manage state updates
securely and consider using a reentrancy guard to prevent simultaneous executions of the
function for the same user or leaf."
  }
]
```