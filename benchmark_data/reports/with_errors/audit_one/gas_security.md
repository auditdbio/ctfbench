# AI Audit

## Disclaimer
> **This report is AI-generated and may contain false positives.**  
> For a thorough and accurate analysis, we strongly recommend obtaining a manual audit with AuditOne.

---

## Issues

### 1. `Airdrop.register()` Uses an Unchecked Push to Participants Array

#### **Input Code**
```solidity
function register() public {
    require(block.timestamp <= registrationDeadline, "Registration closed");
    require(eligible.isEligible(msg.sender), "Not eligible");
    require(!registered[msg.sender], "Already registered");
    registered[msg.sender] = true;
    participants.push(msg.sender);
}
```

- **Severity:** 🟠 *Medium*  
- **Impact:**  
  The participants array may corrupt with overflows if the array length exceeds 2^256-1.

#### **Description**
This issue is similar to the one found in StarkWare's code, which states that the participants array in the Airdrop contract can overflow due to excessive pushing. Although the chance of this occurring is slim, it remains a distinct possibility and is therefore categorized as a medium-severity issue.

```solidity
function register() public {
    require(block.timestamp <= registrationDeadline, "Registration closed");
    require(eligible.isEligible(msg.sender), "Not eligible");
    require(!registered[msg.sender], "Already registered");
    registered[msg.sender] = true;
    participants.push(msg.sender);
}
```

As referenced in the StarkWare finding, the link can be found here. 
In addition, the contract inherits from OpenZeppelin's library, which has a similar finding that also classified it as a medium level issue. 
Code Can Overflow In This Version
Code Does Not Overflow In This Version

#### **Recommendations**
✅ Use the `unchecked` keyword when pushing to the participants array like the below code.

```diff
--- airdrop.sol
+++ airdrop.sol
@@ -16,6 +16,7 @@
     mapping(address => bool) public registered;
     bool public distributed;
 
 
+    using SafeMath for uint256;
     constructor(address _token, uint256 _registrationDeadline, address _eligible) {
         token = IERC20(_token);
         registrationDeadline = _registrationDeadline;
@@ -20,6 +21,7 @@
 
 
 
     function register() public {
+        using SafeMath for uint256;
         require(block.timestamp <= registrationDeadline, "Registration closed");
         require(eligible.isEligible(msg.sender), "Not eligible");
         require(!registered[msg.sender], "Already registered");
@@ -26,5 +28,5 @@
         registered[msg.sender] = true;
         participants.push(msg.sender);
     }

     function distribute() external {
         require(block.timestamp > registrationDeadline, "Distribution not started");
         require(!distributed, "Already distributed");
--- airdrop.sol
+++ airdrop.sol
@@ -16,6 +16,7 @@
     mapping(address => bool) public registered;
     bool public distributed;
 
 
+    using SafeMath for uint256;
     constructor(address _token, uint256 _registrationDeadline, address _eligible) {
         token = IERC20(_token);
         registrationDeadline = _registrationDeadline; 
@@ -20,6 +21,7 @@
 
 
 
     function register() public {
+        using SafeMath for uint256;
         require(block.timestamp <= registrationDeadline, "Registration closed");
         require(eligible.isEligible(msg.sender), "Not eligible");
         require(!registered[msg.sender], "Already registered");
@@ -26,5 +28,5 @@
         registered[msg.sender] = true;
         participants.push(msg.sender);
     }

     function distribute() external {
         require(block.timestamp > registrationDeadline, "Distribution not started");
         require(!distributed, "Already distributed");
```
