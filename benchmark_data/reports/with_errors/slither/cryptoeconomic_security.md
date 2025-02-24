Summary
 - [locked-ether](#locked-ether) (1 results) (Medium)
 - [reentrancy-no-eth](#reentrancy-no-eth) (1 results) (Medium)
 - [missing-zero-check](#missing-zero-check) (1 results) (Low)
 - [reentrancy-events](#reentrancy-events) (1 results) (Low)
 - [pragma](#pragma) (1 results) (Informational)
 - [dead-code](#dead-code) (2 results) (Informational)
 - [solc-version](#solc-version) (2 results) (Informational)
 - [low-level-calls](#low-level-calls) (1 results) (Informational)
 - [immutable-states](#immutable-states) (1 results) (Optimization)
## locked-ether
Impact: Medium
Confidence: High
 - [ ] ID-0
Contract locking ether found:
	Contract [OracleFlashToken](new_contracts/cryptoeconomic_security/OracleFlashLoan.sol#L10-L35) has payable functions:
	 - [OracleFlashToken.mint()](new_contracts/cryptoeconomic_security/OracleFlashLoan.sol#L17-L22)
	But does not have a function to withdraw the ether

new_contracts/cryptoeconomic_security/OracleFlashLoan.sol#L10-L35


## reentrancy-no-eth
Impact: Medium
Confidence: Medium
 - [ ] ID-1
Reentrancy in [OracleFlashToken.flashLoan(uint256,address,bytes)](new_contracts/cryptoeconomic_security/OracleFlashLoan.sol#L25-L33):
	External calls:
	- [(success,None) = target.call(data)](new_contracts/cryptoeconomic_security/OracleFlashLoan.sol#L28)
	State variables written after the call(s):
	- [_burn(address(this),amount)](new_contracts/cryptoeconomic_security/OracleFlashLoan.sol#L32)
		- [_balances[from] = fromBalance - value](node_modules/@openzeppelin/contracts/token/ERC20/ERC20.sol#L194)
		- [_balances[to] += value](node_modules/@openzeppelin/contracts/token/ERC20/ERC20.sol#L206)
	[ERC20._balances](node_modules/@openzeppelin/contracts/token/ERC20/ERC20.sol#L30) can be used in cross function reentrancies:
	- [ERC20._update(address,address,uint256)](node_modules/@openzeppelin/contracts/token/ERC20/ERC20.sol#L183-L211)
	- [ERC20.balanceOf(address)](node_modules/@openzeppelin/contracts/token/ERC20/ERC20.sol#L92-L94)
	- [_burn(address(this),amount)](new_contracts/cryptoeconomic_security/OracleFlashLoan.sol#L32)
		- [_totalSupply += value](node_modules/@openzeppelin/contracts/token/ERC20/ERC20.sol#L186)
		- [_totalSupply -= value](node_modules/@openzeppelin/contracts/token/ERC20/ERC20.sol#L201)
	[ERC20._totalSupply](node_modules/@openzeppelin/contracts/token/ERC20/ERC20.sol#L34) can be used in cross function reentrancies:
	- [ERC20._update(address,address,uint256)](node_modules/@openzeppelin/contracts/token/ERC20/ERC20.sol#L183-L211)
	- [ERC20.totalSupply()](node_modules/@openzeppelin/contracts/token/ERC20/ERC20.sol#L85-L87)

new_contracts/cryptoeconomic_security/OracleFlashLoan.sol#L25-L33


## missing-zero-check
Impact: Low
Confidence: Medium
 - [ ] ID-2
[OracleFlashToken.flashLoan(uint256,address,bytes).target](new_contracts/cryptoeconomic_security/OracleFlashLoan.sol#L25) lacks a zero-check on :
		- [(success,None) = target.call(data)](new_contracts/cryptoeconomic_security/OracleFlashLoan.sol#L28)

new_contracts/cryptoeconomic_security/OracleFlashLoan.sol#L25


## reentrancy-events
Impact: Low
Confidence: Medium
 - [ ] ID-3
Reentrancy in [OracleFlashToken.flashLoan(uint256,address,bytes)](new_contracts/cryptoeconomic_security/OracleFlashLoan.sol#L25-L33):
	External calls:
	- [(success,None) = target.call(data)](new_contracts/cryptoeconomic_security/OracleFlashLoan.sol#L28)
	Event emitted after the call(s):
	- [Transfer(from,to,value)](node_modules/@openzeppelin/contracts/token/ERC20/ERC20.sol#L210)
		- [_burn(address(this),amount)](new_contracts/cryptoeconomic_security/OracleFlashLoan.sol#L32)

new_contracts/cryptoeconomic_security/OracleFlashLoan.sol#L25-L33


## pragma
Impact: Informational
Confidence: High
 - [ ] ID-4
2 different versions of Solidity are used:
	- Version constraint ^0.8.0 is used by:
		-[^0.8.0](new_contracts/cryptoeconomic_security/OracleFlashLoan.sol#L2)
	- Version constraint ^0.8.20 is used by:
		-[^0.8.20](node_modules/@openzeppelin/contracts/interfaces/draft-IERC6093.sol#L3)
		-[^0.8.20](node_modules/@openzeppelin/contracts/token/ERC20/ERC20.sol#L4)
		-[^0.8.20](node_modules/@openzeppelin/contracts/token/ERC20/IERC20.sol#L4)
		-[^0.8.20](node_modules/@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol#L4)
		-[^0.8.20](node_modules/@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol#L4)
		-[^0.8.20](node_modules/@openzeppelin/contracts/utils/Context.sol#L4)

new_contracts/cryptoeconomic_security/OracleFlashLoan.sol#L2


## dead-code
Impact: Informational
Confidence: Medium
 - [ ] ID-5
[Context._contextSuffixLength()](node_modules/@openzeppelin/contracts/utils/Context.sol#L25-L27) is never used and should be removed

node_modules/@openzeppelin/contracts/utils/Context.sol#L25-L27


 - [ ] ID-6
[Context._msgData()](node_modules/@openzeppelin/contracts/utils/Context.sol#L21-L23) is never used and should be removed

node_modules/@openzeppelin/contracts/utils/Context.sol#L21-L23


## solc-version
Impact: Informational
Confidence: High
 - [ ] ID-7
Version constraint ^0.8.20 contains known severe issues (https://solidity.readthedocs.io/en/latest/bugs.html)
	- VerbatimInvalidDeduplication
	- FullInlinerNonExpressionSplitArgumentEvaluationOrder
	- MissingSideEffectsOnSelectorAccess.
It is used by:
	- [^0.8.20](node_modules/@openzeppelin/contracts/interfaces/draft-IERC6093.sol#L3)
	- [^0.8.20](node_modules/@openzeppelin/contracts/token/ERC20/ERC20.sol#L4)
	- [^0.8.20](node_modules/@openzeppelin/contracts/token/ERC20/IERC20.sol#L4)
	- [^0.8.20](node_modules/@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol#L4)
	- [^0.8.20](node_modules/@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol#L4)
	- [^0.8.20](node_modules/@openzeppelin/contracts/utils/Context.sol#L4)

node_modules/@openzeppelin/contracts/interfaces/draft-IERC6093.sol#L3


 - [ ] ID-8
Version constraint ^0.8.0 contains known severe issues (https://solidity.readthedocs.io/en/latest/bugs.html)
	- FullInlinerNonExpressionSplitArgumentEvaluationOrder
	- MissingSideEffectsOnSelectorAccess
	- AbiReencodingHeadOverflowWithStaticArrayCleanup
	- DirtyBytesArrayToStorage
	- DataLocationChangeInInternalOverride
	- NestedCalldataArrayAbiReencodingSizeValidation
	- SignedImmutables
	- ABIDecodeTwoDimensionalArrayMemory
	- KeccakCaching.
It is used by:
	- [^0.8.0](new_contracts/cryptoeconomic_security/OracleFlashLoan.sol#L2)

new_contracts/cryptoeconomic_security/OracleFlashLoan.sol#L2


## low-level-calls
Impact: Informational
Confidence: High
 - [ ] ID-9
Low level call in [OracleFlashToken.flashLoan(uint256,address,bytes)](new_contracts/cryptoeconomic_security/OracleFlashLoan.sol#L25-L33):
	- [(success,None) = target.call(data)](new_contracts/cryptoeconomic_security/OracleFlashLoan.sol#L28)

new_contracts/cryptoeconomic_security/OracleFlashLoan.sol#L25-L33


## immutable-states
Impact: Optimization
Confidence: High
 - [ ] ID-10
[OracleFlashToken.uniswapOracle](new_contracts/cryptoeconomic_security/OracleFlashLoan.sol#L11) should be immutable 

new_contracts/cryptoeconomic_security/OracleFlashLoan.sol#L11


