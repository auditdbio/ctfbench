# **GoLang Documentation for Solidity Vesting Smart Contract**

This documentation provides insights into the functionality, structure, and best practices for the given Solidity Vesting smart contract code. This contract is designed for token vesting, a common mechanism in blockchain projects to lock tokens and gradually release them over time.

# **Overview**

The Vesting smart contract is used to manage time-based token vesting. It allows a beneficiary to claim tokens over a specified period, ensuring the tokens are not all released at once. This is particularly useful in scenarios where tokens are distributed to team members, advisors, or investors in a phased manner to align incentives with the project's long-term goals.

## **Key Concepts**

- **Token Vesting:** The process of locking tokens and releasing them gradually over time.
- **Cliff:** The initial period before tokens start vesting.
- **Duration:** The total vesting period.

# **Contract Structure**

### **State Variables**

- IERC20 public token;: The ERC-20 token interface that will be vested.
- address public beneficiary;: The account that will receive vested tokens.
- uint256 public start;: The timestamp when the vesting starts.
- uint256 public cliff;: Vesting cliff time period, calculated as start + cliff.
- uint256 public duration;: Total duration for vesting after the cliff period.
- uint256 public released;: Tracks the total tokens that have been released to the beneficiary.

### **Constructor**

The constructor initializes the vesting contract with:

constructor(IERC20 _token, address _beneficiary, uint256 _start, uint256 _cliff, uint256 _duration)

- **_token:** The token to vest.
- **_beneficiary:** The address to receive the tokens.
- **_start:** The timestamp at which vesting begins.
- **_cliff:** The time period before vesting starts (added to start time).
- **_duration:** The entire duration over which tokens are vested.

#### **Validations**

- Ensures **_beneficiary** is not a zero address.
### **Functions**

#### **release()**

This function allows the beneficiary to release the tokens that have vested up to the current time.

function release() public

#### **Conditions:**

- Current time must be past the cliff.
- There must be an unreleased amount available.

#### **vestedAmount()**

Calculates the total amount of tokens that have vested up to the current time.

function vestedAmount() public view returns (uint256)

- **Returns:** Amount of tokens that are vested.
#### **releasableAmount()**

Computes the amount of vested tokens that are available for release.

function releasableAmount() public view returns (uint256)

- **Returns:** Difference between vested and released amounts.
# **Best Practices**

- 1. **Security:** Always ensure input validations like non-zero addresses and proper mathematical checks to prevent integer overflow.
- 2. **Optimization:** The use of SafeERC20 ensures security when transferring tokens.
- 3. **Audit:** Regular audits and updates to follow the latest security practices are recommended.
- 4. **Testing:** Comprehensive testing, including edge cases and possible failure scenarios, should be conducted.

# **Conclusion**

The Vesting contract is a foundational tool in the token management lifecycle of a blockchain project. It is crucial to implement such mechanisms to secure token distributions and incentivize stakeholders rightly. The contract should be deployed with diligence, ensuring parameters align with the project's vesting needs. Regular reviews and smart contract audits are essential to safeguard token management processes.

The provided Solidity code is a smart contract for a token vesting schedule. Below are the identified security issues and recommended fixes in the contract:

#### 1. **Lack of Input Validation for duration, cliff, and start**

- **Issue:**
The constructor does not check if the duration is greater than zero or if the cliff and start times are set correctly. This oversight can lead to a misconfiguration where tokens may never be released or become immediately accessible.

#### **Fix:**

Add a check to ensure that the duration is a positive number and that cliff is after the start time.

require(_duration > 0, "Duration should be greater than zero"); require(_cliff > 0, "Cliff should be greater than zero"); require(_cliff <= _duration, "Cliff should be less than or equal to duration"); require(_start + _cliff >= block.timestamp, "Start time + cliff should be in the future");

#### 2. **Lack of Event Emission on Token Release**

#### **Issue:**

There's no event emitted when tokens are released. This can cause transparency and traceability issues for stakeholders monitoring the vesting using blockchain explorers.

#### **Fix:**

Add an event emission for the release function.

```
event TokensReleased(address beneficiary, uint256 amount);
function release() public {
  require(block.timestamp >= cliff);
  uint256 unreleased = releasableAmount();
  require(unreleased > 0);
  released += unreleased;
  token.safeTransfer(beneficiary, unreleased);
  emit TokensReleased(beneficiary, unreleased);
}
```
### 3. **No Emergency Withdraw Functionality**

#### **Issue:**

The contract lacks an emergency mechanism for the owner to withdraw tokens in unforeseen circumstances such as contract upgrade requirements or migration.

#### **Fix:**

Implement an emergency withdraw function restricted to the owner. Consider using a role-based access control mechanism to secure this function.

```
address public owner;
modifier onlyOwner() {
  require(msg.sender == owner, "Caller is not the owner");
  _;
}
constructor(IERC20 _token, address _beneficiary, uint256 _start, uint256 _cliff, uint256
_duration) {
  require(_beneficiary != address(0));
  require(_duration > 0, "Duration should be greater than zero");
  require(_cliff > 0, "Cliff should be greater than zero");
  require(_cliff <= _duration, "Cliff should be less than or equal to duration");
  require(_start + _cliff >= block.timestamp, "Start time + cliff should be in the
future");
  token = _token;
  beneficiary = _beneficiary;
  start = _start;
  cliff = _start + _cliff;
  duration = _duration;
  owner = msg.sender;
}
function emergencyWithdraw() external onlyOwner {
  uint256 balance = token.balanceOf(address(this));
  require(balance > 0, "No tokens to withdraw");
  token.safeTransfer(owner, balance);
}
```
#### 4. **Use of block.timestamp for Time Calculation**

#### **Issue:**

block.timestamp can be manipulated by miners within a small range. Using it for time calculations can introduce security concerns.

#### **Fix:**

While block.timestamp is commonly used in Solidity for such purposes, being aware of its limitations is crucial. At present, there is no widely accepted alternative in Solidity, but designing logic that tolerates such minor manipulation (within 900s protocol spec) is essential. Ensure calculations rely on larger intervals than seconds where feasible.

#### 5. **Lack of Constructor Guardrails**

#### **Issue:**

It is crucial to ensure that the vesting contract's parameters are correctly configured to avoid operational mishaps.

- **Fix:**
Consider including checks for the appropriateness or non-zero nature of the _beneficiary, initializing

assert(released == 0); // Ensure released is initialized to zero

### 6. **Lack of Access Control for Release**

#### **Issue:**

The release function is publicly accessible, which means anyone can trigger the release of tokens, although they can only be sent to the beneficiary. It's advisable to restrict operations that impact financial transactions to specific roles or actions.

**Fix:**

Consider using a hasRole check like those offered by OpenZeppelin's access control if specific authorized parties need usage control.

In conclusion, the contract shows a basic level of completeness in its implementation. However, introducing these improvements will enhance both the security and robustness of the vesting mechanism, making it a more reliable component for token management in various blockchain projects.

Integrating the suggested event emissions, ensuring robustness in time calculations, implementing access restrictions on sensitive functions, and providing administrative control via emergency exits or governance mechanisms will ensure this contract can be deployed safely in a production environment.

# **Test cases**

You've provided a Solidity code for a basic vesting contract. To assist you with testing this contract, I'm going to provide you with the corresponding test cases using Hardhat and ethers.js in JavaScript. These test cases will help you ensure that the vesting functionality behaves as expected.

The vesting contract allows tokens to be gradually released to a beneficiary over time, following a cliff period.

Here's how you can structure and write test cases for this Solidity contract:

### **Hardhat Test Cases for the Vesting Contract**

First, ensure you have a Hardhat project set up with the necessary dependencies. You'll need ethers.js and optionally Mocha and Chai for testing if not included by default:

npm install --save-dev @nomiclabs/hardhat-ethers ethers mocha chai

Now, you can create a test file, say test/VestingTest.js, and write the following test cases:

```
const { expect } = require("chai");
const { ethers } = require("hardhat");
describe("Vesting Contract", function () {
 let Vesting;
 let vesting;
 let Token;
 let token;
 let owner;
 let beneficiary;
 let otherAccount;
 let start;
 let cliff;
 let duration;
 beforeEach(async function () {
  [owner, beneficiary, otherAccount] = await ethers.getSigners();
  // Deploy a mock ERC20 token using OpenZeppelin
  Token = await ethers.getContractFactory("ERC20Mock");
  token = await Token.deploy("Test Token", "TTK", owner.address,
ethers.utils.parseEther("1000"));
  await token.deployed();
```

```
// Set vesting parameters
  start = Math.floor(Date.now() / 1000); // current time
  cliff = 60; // 1 minute cliff
  duration = 3600; // 1 hour duration total
  // Deploy the Vesting contract
  Vesting = await ethers.getContractFactory("Vesting");
  vesting = await Vesting.deploy(token.address, beneficiary.address, start, cliff, duration);
  await vesting.deployed();
  // Transfer tokens to the vesting contract
  await token.transfer(vesting.address, ethers.utils.parseEther("500"));
 });
 it("should not allow release before cliff", async function () {
  await expect(vesting.release()).to.be.revertedWith("");
 });
 it("should release correct amount after cliff", async function () {
  // Fast forward time to after the cliff
  await ethers.provider.send('evm_increaseTime', [cliff + 1]);
  await ethers.provider.send('evm_mine'); // mine a block to reflect time change
  const vestedAmountBefore = await vesting.vestedAmount();
  const beneficiaryBalanceBefore = await token.balanceOf(beneficiary.address);
  await vesting.release();
  const beneficiaryBalanceAfter = await token.balanceOf(beneficiary.address);
  const released = beneficiaryBalanceAfter.sub(beneficiaryBalanceBefore);
  expect(released).to.equal(vestedAmountBefore);
 });
 it("should release full amount after duration", async function () {
  // Fast forward time to after the full duration
  await ethers.provider.send('evm_increaseTime', [duration + 1]);
  await ethers.provider.send('evm_mine');
  const totalVestedAmount = await vesting.vestedAmount();
  const initialBalance = await token.balanceOf(beneficiary.address);
  await vesting.release();
  const finalBalance = await token.balanceOf(beneficiary.address);
  expect(finalBalance.sub(initialBalance)).to.equal(totalVestedAmount);
 });
 it("should not allow non-beneficiary to release", async function () {
  await ethers.provider.send('evm_increaseTime', [cliff + 1]);
  await ethers.provider.send('evm_mine');
  await expect(vesting.connect(otherAccount).release()).to.be.reverted;
 });
});
```
### **Explanation of Test Cases**

- 1. **Initial Setup and Transfers**: Before each test, the token contract and vesting contract are deployed and tokens are transferred to the vesting contract.
- 2. **Before Cliff Test**: Ensures that tokens cannot be released before the cliff period has passed.
- 3. **Partial Release After Cliff** : Verifies that a proportionate amount of tokens is released after the cliff but before the full duration is reached.
- 4. **Full Release After Duration**: Checks that all tokens are released once the vesting duration has completely elapsed.
- 5. **Unauthorized Access Test**: Confirms that only the designated beneficiary can call the release function.

#### **Running the Tests**

To run these tests, execute the following command in your project directory:

npx hardhat test

This setup will help ensure your vesting contract operates correctly under these defined conditions. Further testing might require more complex scenarios or edge cases depending on your contract use case.

# **Optimizations**

Below are some optimizations that can be applied to your Solidity smart contract to improve readability, efficiency, and maintainability:

- 1. **Use revert with error messages**: Adding clear error messages to require statements can significantly aid in debugging and make it easier for users to understand why a transaction failed.
- 2. **Minimize computation**: Compute values only once when possible and reuse variables. This can save gas costs when the computation is reused multiple times, as seen in the vestedAmount and releasableAmount calculations.
- 3. **Event Logging**: Emitting events when significant actions occur (like releasing tokens) can provide better visibility and auditability of contract interactions.
- 4. **Make the constructor payable if needed**: In certain scenarios, it could be useful for the constructor to accept ether along with initializing the contract parameters, although it's not necessary here since this is an ERC20 vesting contract.
- 5. **Organize function visibility**: Listing functions in the contract according to their visibility (external, public, internal, private) may improve readability and structure.

Here is the refactored code based on these suggestions:

```
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
contract Vesting {
  using SafeERC20 for IERC20;
  IERC20 public immutable token;
  address public immutable beneficiary;
  uint256 public immutable start;
  uint256 public immutable cliff;
  uint256 public immutable duration;
  uint256 private released;
  event TokensReleased(address beneficiary, uint256 amount);
  constructor(
     IERC20 _token,
     address _beneficiary,
     uint256 _start,
     uint256 _cliff,
     uint256 _duration
  ) {
     require(_beneficiary != address(0), "Invalid beneficiary address");
     require(address(_token) != address(0), "Invalid token address");
     token = _token;
     beneficiary = _beneficiary;
     start = _start;
     cliff = _start + _cliff;
     duration = _duration;
  }
  function release() external {
     require(block.timestamp >= cliff, "Cliff period not reached");
```

```
uint256 unreleased = releasableAmount();
     require(unreleased > 0, "No tokens to release");
     released += unreleased;
     token.safeTransfer(beneficiary, unreleased);
     emit TokensReleased(beneficiary, unreleased);
  }
  function vestedAmount() public view returns (uint256) {
     uint256 totalBalance = token.balanceOf(address(this)) + released;
     if (block.timestamp < cliff) {
       return 0;
     } else if (block.timestamp >= start + duration) {
       return totalBalance;
     } else {
       return (totalBalance * (block.timestamp - start)) / duration;
     }
  }
  function releasableAmount() public view returns (uint256) {
     return vestedAmount() - released;
  }
}
```
### **Key Changes Explained:**

- **Error Messages**: We have added descriptive error messages to improve error handling.
- **Immutable Variables**: Using immutable for constructor-initialized variables reduces gas costs.
- **Event Emission**: An event TokensReleased is emitted when tokens are released, which helps in tracking and debugging.
- **Function Visibility**: Reorganized the contract to have external and public functions clearly grouped for readability.

# **Top Vulnerabilities**

CWE-371: Time-of-Check Time-of-Use (TOCTOU) Race Condition,CWE-703: Improper Check Stub for Error Handling

# **CVE Description**

```
[
  {
     "issue": "CWE-371: Time-of-Check Time-of-Use (TOCTOU) Race Condition",
     "description": "The use of block.timestamp for time calculation allows for potential
exploitation through block timestamp manipulation by miners. This can lead to errors in the
release mechanism, especially when multiple calls to the 'release' function happen close together
in time.",
     "recommendation": "Consider using a more secure mechanism for time management that is
less susceptible to manipulation, such as block numbers with an average block time for
calculations, or implementing additional checks to ensure the integrity of the time-based
conditions."
  },
  {
     "issue": "CWE-703: Improper Check Stub for Error Handling",
     "description": "The constructor of the Vesting contract does not handle the situation where
the _token is the zero address. This could potentially allow for the instantiation of a contract with
invalid token addresses, leading to unexpected behavior when token operations are attempted.",
     "recommendation": "Include a require statement to check that the _token address is not the
zero address in the constructor, similar to the check for _beneficiary."
  }
]
```