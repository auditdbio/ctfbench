# **Airdrop Smart Contract Documentation**

# **Overview**

The Airdrop contract is a Solidity-based smart contract facilitating the distribution of ERC20 tokens to eligible participants. The contract uses interfaces and external contracts to check eligibility and manage token transfers securely.

## **Key Components**

- **Token Handling**: Manages the ERC20 token distribution using OpenZeppelin's IERC20.
- **Eligibility Check**: Interface IEligible ensures users meet specific criteria to partake in the airdrop.
- **Registration Deadline**: Limits registration to a predefined timeframe.
- **Token Distribution**: Distributes tokens to registered participants evenly after the registration period ends.

# **Contract Structure**

## **State Variables**

- **IERC20 immutable public token**: Reference to the ERC20 token contract, ensuring the token type is consistent and immutable.
- **IEligible immutable public eligible**: Reference to the contract that checks participant eligibility.
- **uint256 immutable public registrationDeadline**: Timestamp marking the deadline for participant registration.
- **address[] public participants**: Dynamic array tracking registered participants.
- **mapping(address => bool) public registered** : Tracks registration status of addresses to prevent duplicate registrations.
- **bool public distributed**: Indicates whether tokens have been distributed to prevent re-entrancy.

### **Constructor**

The constructor initializes the contract state:

```
constructor(address _token, uint256 _registrationDeadline, address _eligible) {
  token = IERC20(_token);
  registrationDeadline = _registrationDeadline;
  eligible = IEligible(_eligible);
  register();
}
```
#### **Parameters**:

- _token: The ERC20 token contract address.
- _registrationDeadline: The timestamp marking the end of registration.
- _eligible: The address providing eligibility verification.

### **Functions**

#### **register()**

Allows eligible and unregistered users to register:

```
function register() public {
  require(block.timestamp <= registrationDeadline, "Registration closed");
  require(eligible.isEligible(msg.sender), "Not eligible");
  require(!registered[msg.sender], "Already registered");
  registered[msg.sender] = true;
  participants.push(msg.sender);
```

```
}
```
#### **Requirements**:

- Registration open (current time is before registrationDeadline).
- The user is eligible, validated via the IEligible interface.
- User must not have registered previously.

#### **distribute()**

Distributes tokens equally among registered participants after registration closes:

```
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
#### **Requirements**:

- Distribution starts post registrationDeadline.
- Ensures tokens have not already been distributed.
- The balance divided equally among participants.
- Ensures sufficient contract balance and transfer success.

# **Best Practices**

- **Security**: Follow OpenZeppelin standards, using audited interfaces and libraries.
- **Re-entrancy**: Prevent by setting distributed before transfers.
- **Gas Optimization**: Use immutable for fixed contract addresses and require statements efficiently.

# **Diagrams and Tables**

#### **State Diagram**

A simple flow can be depicted as:

- 1. **Initialization**: Deploy contract with parameters.
- 2. **Registration Phase**: Participants register if eligible.
- 3. **Distribution Phase**: Tokens distributed after registration closes.

#### **Table: Roles and Responsibilities**

#### **Role Responsibility**

Admin/Creator Sets token contract and eligibility

- Participant Registers and receives tokens
- Contract Manages registration and token distribution

This documentation provides a comprehensive understanding of the Airdrop contract, ensuring both security and functionality alignment with ERC20 standards.

# **Security Analysis of the Solidity Airdrop Contract**

This smart contract is a basic implementation of an airdrop mechanism on the Ethereum blockchain. Below, I will highlight potential security issues, recommend best practices, and provide solutions for any vulnerabilities found in the code.

### **1. Race Condition in Registration**

#### **Issue:**

The registration process starts immediately when the contract is deployed due to the register() call in the constructor. This means that the contract deployer automatically registers their address as a participant, which might not be the intended behavior.

#### **Recommendation:**

Remove the register(); call from the constructor. Instead, allow participants to manually call the register() function after deploying the contract.

#### **Revised Code:**

```
constructor(address _token, uint256 _registrationDeadline, address _eligible) {
  token = IERC20(_token);
  registrationDeadline = _registrationDeadline;
  eligible = IEligible(_eligible);
}
```
# **2. Reentrancy Vulnerability in Distribution Function**

#### **Issue:**

The distribute() function is vulnerable to reentrancy attacks, as it transfers tokens to recipients in a loop. If the token contract is not properly designed, it could allow a participant to re-enter and call distribute() again before the distribution process is completed for everyone.

#### **Recommendation:**

Implement the "checks-effects-interactions" pattern to mitigate reentrancy. Additionally, consider using OpenZeppelin's ReentrancyGuard where applicable.

#### **Revised Code:**

```
function distribute() external nonReentrant {
  require(block.timestamp > registrationDeadline, "Distribution not started");
  require(!distributed, "Already distributed");
  uint256 totalParticipants = participants.length;
  require(totalParticipants > 0, "No participants");
  uint256 balance = token.balanceOf(address(this));
  uint256 amountPerParticipant = balance / totalParticipants;
  // Set distributed to true before making any external transfers
  distributed = true;
  for (uint256 i = 0; i < totalParticipants; i++) {
     require(token.transfer(participants[i], amountPerParticipant), "Transfer failed");
  }
}
```
#### Add the ReentrancyGuard:

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

```
contract Airdrop is ReentrancyGuard {
  // rest of the code
}
```
# **3. Distribution Proportionality Error**

The function distribute() divides the total tokens by the number of participants using integer division, which may leave some tokens undistributed due to rounding down.

#### **Recommendation:**

Track any remainder tokens from this division and handle them appropriately. For instance, send the leftover tokens to a predefined beneficiary or redistribute them to some participants.

#### **Revised Code Example:**

```
function distribute() external nonReentrant {
  require(block.timestamp > registrationDeadline, "Distribution not started");
  require(!distributed, "Already distributed");
  uint256 totalParticipants = participants.length;
  require(totalParticipants > 0, "No participants");
  uint256 balance = token.balanceOf(address(this));
  uint256 amountPerParticipant = balance / totalParticipants;
  uint256 leftover = balance % totalParticipants; // Calculate the remaining tokens
  distributed = true;
  for (uint256 i = 0; i < totalParticipants; i++) {
     require(token.transfer(participants[i], amountPerParticipant), "Transfer failed");
  }
  // Handle the leftover tokens
  if (leftover > 0) {
     // Define a beneficiary address or send back to address(0)
     require(token.transfer(address(0), leftover), "Leftover transfer failed");
  }
}
```
### **4. Lack Of Access Control**

#### **Issue:**

The distribute() function is open to be called by anyone after the deadline, potentially causing disruption if reentrancy is improperly handled or leading to premature distribution.

#### **Recommendation:**

Introduce access control to restrict who can trigger the distribution process.

#### **Revised Code:**

```
function distribute() external onlyOwner nonReentrant {
  require(block.timestamp > registrationDeadline, "Distribution not started");
  require(!distributed, "Already distributed");
  uint256 totalParticipants = participants.length;
  require(totalParticipants > 0, "No participants");
  uint256 balance = token.balanceOf(address(this));
  uint256 amountPerParticipant = balance / totalParticipants;
  uint256 leftover = balance % totalParticipants;
  distributed = true;
  for (uint256 i = 0; i < totalParticipants; i++) {
     require(token.transfer(participants[i], amountPerParticipant), "Transfer failed");
  }
  if (leftover > 0) {
     require(token.transfer(address(0), leftover), "Leftover transfer failed");
  }
}
```
import "@openzeppelin/contracts/access/Ownable.sol";

```
contract Airdrop is ReentrancyGuard, Ownable {
  // Rest of the code
}
```
# **5. Gas Limit Considerations**

#### **Issue:**

The distribute() function could potentially run out of gas if the list of participants is too long, preventing successful execution.

#### **Recommendation:**

Implement a mechanism to distribute in batches, or set a maximum number of participants to ensure distribute function can complete within block gas limits.

#### **Revised Code Suggestion:**

Active batching implementation can be quite intricate, and careful architectural decisions should be made. Below is an outline:

```
// Define batch constraints
uint256 public participantBatchSize = 100;
uint256 public currentParticipantIndex;
function distributeInBatches() external onlyOwner nonReentrant {
  require(block.timestamp > registrationDeadline, "Distribution not started");
  require(!distributed, "Already distributed");
  uint256 totalParticipants = participants.length;
  require(totalParticipants > 0, "No participants");
  uint256 balance = token.balanceOf(address(this));
  uint256 amountPerParticipant = balance / totalParticipants;
  uint256 leftover = balance % totalParticipants;
  // Batch distribution
  uint256 start = currentParticipantIndex;
  uint256 end = start + participantBatchSize > totalParticipants ? totalParticipants : start +
participantBatchSize;
  for (uint256 i = start; i < end; i++) {
     require(token.transfer(participants[i], amountPerParticipant), "Transfer failed");
  }
  currentParticipantIndex = end;
  // If all participants received tokens, make distribution true
  if (currentParticipantIndex >= totalParticipants) {
     distributed = true;
     // Transfer leftover
     if (leftover > 0) {
       require(token.transfer(address(0), leftover), "Leftover transfer failed");
     }
  }
}
```
**Note:** This batching approach requires sufficient testing and may make user feedback and visibility more complex.

### **Conclusion**

Each of these recommendations should undergo rigorous testing and verification in a test environment before deploying on live networks. Consider automatic tooling like Static Analysis tools to ensure further that security best practices are being followed. Regular auditing, both manual and automated, can protect against vulnerabilities in these types of token distribution contracts.

# **Test cases**

});

The Solidity code is for an Airdrop smart contract that allows eligible addresses to register for a token airdrop within a specified time frame and then distributes tokens to registered participants. Below, I will write test cases for this Solidity contract using the Ethereum testing framework Hardhat, which requires writing tests in JavaScript.

To test this contract, you need the following setup:

- 1. Ensure you have Node.js installed.
- 2. Install Hardhat: npm install --save-dev hardhat

Then, create a test directory and add a test file for our contract. Here is an example of how you can write test cases using Mocha and Chai in Hardhat.

Create a new file airdrop.test.js in the test directory:

```
const { expect } = require("chai");
const { ethers } = require("hardhat");
describe("Airdrop Contract", function () {
  let Token;
  let airdropContract;
  let tokenContract;
  let eligibleContract;
  let owner;
  let addr1;
  let addr2;
  let addrs;
  let deadline;
  beforeEach(async function () {
     Token = await ethers.getContractFactory("MockERC20");
     Eligible = await ethers.getContractFactory("MockEligible");
     [owner, addr1, addr2, ...addrs] = await ethers.getSigners();
     // Deploy Mock ERC20 Token
     tokenContract = await Token.deploy("Test Token", "TTK", ethers.utils.parseEther("1000"));
     await tokenContract.deployed();
     // Deploy Mock Eligible Contract
     eligibleContract = await Eligible.deploy();
     await eligibleContract.deployed();
     // Set eligibility for addr1 and addr2
     await eligibleContract.setEligible(addr1.address, true);
     await eligibleContract.setEligible(addr2.address, true);
     // Register deadline in the future
     deadline = Math.floor(Date.now() / 1000) + 86400; // 1 day from now
     // Deploy Airdrop Contract
     Airdrop = await ethers.getContractFactory("Airdrop");
     airdropContract = await Airdrop.deploy(tokenContract.address, deadline,
eligibleContract.address);
     await airdropContract.deployed();
     // Send some tokens to Airdrop contract
     const sendAmount = ethers.utils.parseEther("500");
     await tokenContract.transfer(airdropContract.address, sendAmount);
  });
  describe("Registration", function () {
     it("Should allow eligible user to register", async function () {
       await airdropContract.connect(addr1).register();
       expect(await airdropContract.registered(addr1.address)).to.be.true;
     });
     it("Should not allow ineligible user to register", async function () {
       await expect(airdropContract.connect(addrs[0]).register()).to.be.revertedWith("Not
eligible");
```

```
it("Should not allow user to register after the deadline", async function () {
       // fast forward time to after the deadline
       await ethers.provider.send("evm_increaseTime", [86401]);
       await expect(airdropContract.connect(addr1).register()).to.be.revertedWith("Registration
closed");
     });
     it("Should not allow user to register twice", async function () {
       await airdropContract.connect(addr2).register();
       await expect(airdropContract.connect(addr2).register()).to.be.revertedWith("Already
registered");
     });
  });
  describe("Distribution", function () {
     it("Should distribute tokens evenly after deadline", async function () {
       await airdropContract.connect(addr1).register();
       await airdropContract.connect(addr2).register();
       // fast forward to past the deadline
       await ethers.provider.send("evm_increaseTime", [86401]);
       await airdropContract.distribute();
       expect(await
tokenContract.balanceOf(addr1.address)).to.equal(ethers.utils.parseEther("250"));
       expect(await
tokenContract.balanceOf(addr2.address)).to.equal(ethers.utils.parseEther("250"));
     });
     it("Should not distribute if called before deadline", async function () {
       await airdropContract.connect(addr1).register();
       await airdropContract.connect(addr2).register();
       await expect(airdropContract.distribute()).to.be.revertedWith("Distribution not started");
     });
     it("Should not distribute twice", async function () {
       await airdropContract.connect(addr1).register();
       await airdropContract.connect(addr2).register();
       // fast forward to past the deadline
       await ethers.provider.send("evm_increaseTime", [86401]);
       await airdropContract.distribute();
       await expect(airdropContract.distribute()).to.be.revertedWith("Already distributed");
     });
     it("Should not distribute if no participants", async function () {
       // fast forward to past the deadline
       await ethers.provider.send("evm_increaseTime", [86401]);
       await expect(airdropContract.distribute()).to.be.revertedWith("No participants");
     });
  });
});
```
### **Summary of the Test Cases**

#### **Registration Tests:**

- Verify that eligible users can register.
- Prevent ineligible users from registering.
- Disallow registration after the deadline.
- Prevent users from registering more than once.

#### **Distribution Tests:**

- Confirm tokens are distributed evenly once the registration deadline has passed.
- Prevent distribution if attempted before the deadline.
- Ensure tokens are not distributed more than once.
- Ensure distribution does not occur if there are no participants.

These tests ensure the core functionality and constraints of the Airdrop contract are upheld. The mock contracts MockERC20 and MockEligible should mimic the behavior of token contracts and eligibility checks necessary for these tests.

# **Optimizations**

Here are some optimizations and improvements for your Solidity smart contract:

- 1. **Use require statements with error messages sparingly** :
Reducing or optimizing the number of require statements can save on gas costs. Always provide error messages that are concise.

- 2. **Avoid Immutable State Variables for Gas Efficiency**:
Immutable variables save gas when set in the constructor since they are read-only after construction time. However, reconsider if the use of immutable truly benefits in this case, especially for addresses if not meant to be set rarely.

- 3. **Optimize Loop for Distribution**:
Ensure that you handle gas limits properly in the distribute function. If the number of participants increases significantly, it might run into gas limit issues. Consider alternative designs for large-scale operations.

### 4. **Add Event Logs**:

Emit events for key actions in your contract to enable easier tracking of operations.

Here is the modified code:

```
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
interface IEligible {
  function isEligible(address user) external view returns (bool);
}
contract Airdrop is Ownable {
  IERC20 public token;
  IEligible public eligible;
  uint256 public registrationDeadline;
  address[] public participants;
  mapping(address => bool) public registered;
  bool public distributed;
  event Registered(address indexed participant);
  event Distributed(uint256 totalTokens, uint256 participants);
  modifier registrationOpen() {
     require(block.timestamp <= registrationDeadline, "Registration closed");
     _;
  }
  modifier eligibleUser() {
     require(eligible.isEligible(msg.sender), "Not eligible");
     _;
  }
  modifier notRegistered() {
     require(!registered[msg.sender], "Already registered");
     _;
  }
  modifier distributionNotStarted() {
     require(block.timestamp > registrationDeadline, "Distribution not started");
     require(!distributed, "Already distributed");
     _;
  }
```

```
constructor(address _token, uint256 _registrationDeadline, address _eligible) {
     token = IERC20(_token);
     registrationDeadline = _registrationDeadline;
     eligible = IEligible(_eligible);
     register();
  }
  function register() public registrationOpen eligibleUser notRegistered {
     registered[msg.sender] = true;
     participants.push(msg.sender);
     emit Registered(msg.sender);
  }
  function distribute() external onlyOwner distributionNotStarted {
     uint256 totalParticipants = participants.length;
     require(totalParticipants > 0, "No participants");
     uint256 balance = token.balanceOf(address(this));
     uint256 amountPerParticipant = balance / totalParticipants;
     distributed = true;
     for (uint256 i = 0; i < totalParticipants; i++) {
       token.transfer(participants[i], amountPerParticipant);
     }
     emit Distributed(balance, totalParticipants);
  }
}
```
### **Key Improvements:**

- **Modifiers**: Reduced redundancy in require checks via modifiers. This reduces gas cost and makes code cleaner.
- **Events**: Added event emissions for key actions, aiding in transaction event records and debugging.
- **Gas Optimization**: While designing large scale operations with unknown numbers of participants, carefully consider blockchain limits or alternative methods for distribution, like batching or a claims & pull pattern. Current changes do not alter the loop's gas handling, but it's worth noting for future optimizations.

# **Top Vulnerabilities**

CWE-703: Improper Check or Handling of Exceptional Conditions,CWE-284: Improper Access Control,CWE-345: Insufficient Verification of Data Authenticity,CWE-382: J2EE Insufficient Process Validation

# **CVE Description**

```
[
  {
     "issue": "CWE-703: Improper Check or Handling of Exceptional Conditions",
     "description": "The constructor calls the `register()` function, which could lead to reentrancy
issues or undesired behavior if certain checks are bypassed. This may potentially allow
unauthorized registrations or interfere with contract states.",
     "recommendation": "Avoid calling state-changing functions like `register()` within
constructors directly. Instead, provide a distinct initialization function if necessary, ensuring that
it's safe and doesn't introduce reentrancy or violate function preconditions."
  },
  {
     "issue": "CWE-284: Improper Access Control",
     "description": "The function `distribute()` can be called by any external account. This might
enable any party to trigger the distribution process once the registration deadline is passed,
leading to potential premature or unauthorized distribution.",
```
"recommendation": "Introduce an access control mechanism, such as ownership checks or role-based access control, to ensure that only authorized accounts can invoke the `distribute()` function."

{ "issue": "CWE-345: Insufficient Verification of Data Authenticity",

"description": "The contract does not have a mechanism to handle token transfers failures robustly. If the `token.transfer` call fails, it can lead to partial distributions and state inconsistencies.",

"recommendation": "Consider using `OpenZeppelin's SafeERC20` library to ensure error checks around the `transfer` calls are handled properly, providing a fail-safe for token operations and preserving contract state integrity."

}, {

},

"issue": "CWE-382: J2EE Insufficient Process Validation",

"description": "The `distribute` function assumes that the balance of tokens in the contract is intended for distribution and does not verify if the token balance is appropriate or been manipulated.",

"recommendation": "Implement checks before distribution to verify the token balance against expected amounts, ensuring adequate funds are deposited prior to distribution and preventing accidental over-distribution or manipulation."

]

}