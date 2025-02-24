# OracleFlashLoan Smart Contract Security Analysis

## Issue
**File:** OracleFlashLoan.sol


## Output

**Severity:** Med  

### Contracts that lock Ether

### Description
The smart contract function 'mint' is marked as payable, meaning it can receive ether when called. The function does not contain a 'transfer' or 'send' statement to send the received ether to a designated address, nor does it have a separate function to withdraw the ether. This can lead to a situation where ether sent to the contract is 'locked' and cannot be withdrawn, which is a common issue found in contracts that do not handle received ether appropriately.


```solidity
function mint() external payable {
        require(msg.value > 0, "Must send ETH to mint tokens");
        uint256 tokenAmount = uniswapOracle.getEthToTokenInputPrice(msg.value);
        require(tokenAmount > 0, "Oracle returned zero tokens");
        _mint(msg.sender, tokenAmount);
    }
```

---

**Severity:** Low  

### Missing Zero Address Validation

### Description
The static analysis report indicates a potential issue with the lack of a zero-check when using the low-level 'call' function in the 'flashLoan' method of the 'OracleFlashToken' contract. The 'call' function returns a boolean value which indicates success, and this return value is not checked in the code. Failing to check the success of a 'call' can lead to unexpected behavior, especially if the target contract performs critical operations in the called function that are not executed when the 'call' fails.

```
(bool success, ) = target.call(data);
```
