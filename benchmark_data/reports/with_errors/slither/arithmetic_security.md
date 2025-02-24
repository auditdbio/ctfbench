Summary
 - [divide-before-multiply](#divide-before-multiply) (4 results) (Medium)
 - [incorrect-equality](#incorrect-equality) (3 results) (Medium)
 - [timestamp](#timestamp) (5 results) (Low)
 - [pragma](#pragma) (1 results) (Informational)
 - [solc-version](#solc-version) (2 results) (Informational)
 - [low-level-calls](#low-level-calls) (2 results) (Informational)
 - [immutable-states](#immutable-states) (3 results) (Optimization)
## divide-before-multiply
Impact: Medium
Confidence: Medium
 - [ ] ID-0
[MinimalLending.getCurrentDebt(address)](new_contracts/arithmetic_security/Lending.sol#L61-L75) performs a multiplication on the result of a division:
	- [x = INTEREST_RATE_PER_SECOND * timeElapsed / scale](new_contracts/arithmetic_security/Lending.sol#L67)
	- [x2 = (x * x) / scale](new_contracts/arithmetic_security/Lending.sol#L69)

new_contracts/arithmetic_security/Lending.sol#L61-L75


 - [ ] ID-1
[MinimalLending.isLiquidatable(address)](new_contracts/arithmetic_security/Lending.sol#L91-L98) performs a multiplication on the result of a division:
	- [collateralValue = (loan.collateral * price) / 1e18](new_contracts/arithmetic_security/Lending.sol#L96)
	- [(debt * 100) >= (collateralValue * LIQUIDATION_THRESHOLD)](new_contracts/arithmetic_security/Lending.sol#L97)

new_contracts/arithmetic_security/Lending.sol#L91-L98


 - [ ] ID-2
[MinimalLending.getCurrentDebt(address)](new_contracts/arithmetic_security/Lending.sol#L61-L75) performs a multiplication on the result of a division:
	- [x = INTEREST_RATE_PER_SECOND * timeElapsed / scale](new_contracts/arithmetic_security/Lending.sol#L67)
	- [x2 = (x * x) / scale](new_contracts/arithmetic_security/Lending.sol#L69)
	- [x3 = (x2 * x) / scale](new_contracts/arithmetic_security/Lending.sol#L70)

new_contracts/arithmetic_security/Lending.sol#L61-L75


 - [ ] ID-3
[MinimalLending.borrow(uint256)](new_contracts/arithmetic_security/Lending.sol#L44-L59) performs a multiplication on the result of a division:
	- [collateralValue = (msg.value * price) / 1e18](new_contracts/arithmetic_security/Lending.sol#L49)
	- [require(bool,string)(collateralValue * 100 >= borrowAmount * MIN_COLLATERAL_RATIO,Insufficient collateral)](new_contracts/arithmetic_security/Lending.sol#L50)

new_contracts/arithmetic_security/Lending.sol#L44-L59


## incorrect-equality
Impact: Medium
Confidence: High
 - [ ] ID-4
[MinimalLending.getCurrentDebt(address)](new_contracts/arithmetic_security/Lending.sol#L61-L75) uses a dangerous strict equality:
	- [loan.principal == 0](new_contracts/arithmetic_security/Lending.sol#L63)

new_contracts/arithmetic_security/Lending.sol#L61-L75


 - [ ] ID-5
[MinimalLending.borrow(uint256)](new_contracts/arithmetic_security/Lending.sol#L44-L59) uses a dangerous strict equality:
	- [require(bool,string)(loans[msg.sender].principal == 0,Existing loan exists)](new_contracts/arithmetic_security/Lending.sol#L46)

new_contracts/arithmetic_security/Lending.sol#L44-L59


 - [ ] ID-6
[MinimalLending.isLiquidatable(address)](new_contracts/arithmetic_security/Lending.sol#L91-L98) uses a dangerous strict equality:
	- [loan.principal == 0](new_contracts/arithmetic_security/Lending.sol#L93)

new_contracts/arithmetic_security/Lending.sol#L91-L98


## timestamp
Impact: Low
Confidence: Medium
 - [ ] ID-7
[MinimalLending.repayLoan()](new_contracts/arithmetic_security/Lending.sol#L78-L88) uses timestamp for comparisons
	Dangerous comparisons:
	- [require(bool,string)(loan.principal > 0,No active loan)](new_contracts/arithmetic_security/Lending.sol#L80)
	- [require(bool,string)(token.transferFrom(msg.sender,address(this),debt),Token transfer failed)](new_contracts/arithmetic_security/Lending.sol#L85)
	- [require(bool,string)(success,ETH refund failed)](new_contracts/arithmetic_security/Lending.sol#L87)

new_contracts/arithmetic_security/Lending.sol#L78-L88


 - [ ] ID-8
[MinimalLending.borrow(uint256)](new_contracts/arithmetic_security/Lending.sol#L44-L59) uses timestamp for comparisons
	Dangerous comparisons:
	- [require(bool,string)(loans[msg.sender].principal == 0,Existing loan exists)](new_contracts/arithmetic_security/Lending.sol#L46)

new_contracts/arithmetic_security/Lending.sol#L44-L59


 - [ ] ID-9
[MinimalLending.liquidate(address)](new_contracts/arithmetic_security/Lending.sol#L100-L109) uses timestamp for comparisons
	Dangerous comparisons:
	- [require(bool,string)(token.transferFrom(msg.sender,address(this),debt),Token transfer failed)](new_contracts/arithmetic_security/Lending.sol#L106)
	- [require(bool,string)(success,Collateral transfer failed)](new_contracts/arithmetic_security/Lending.sol#L108)

new_contracts/arithmetic_security/Lending.sol#L100-L109


 - [ ] ID-10
[MinimalLending.isLiquidatable(address)](new_contracts/arithmetic_security/Lending.sol#L91-L98) uses timestamp for comparisons
	Dangerous comparisons:
	- [loan.principal == 0](new_contracts/arithmetic_security/Lending.sol#L93)
	- [(debt * 100) >= (collateralValue * LIQUIDATION_THRESHOLD)](new_contracts/arithmetic_security/Lending.sol#L97)

new_contracts/arithmetic_security/Lending.sol#L91-L98


 - [ ] ID-11
[MinimalLending.getCurrentDebt(address)](new_contracts/arithmetic_security/Lending.sol#L61-L75) uses timestamp for comparisons
	Dangerous comparisons:
	- [loan.principal == 0](new_contracts/arithmetic_security/Lending.sol#L63)

new_contracts/arithmetic_security/Lending.sol#L61-L75


## pragma
Impact: Informational
Confidence: High
 - [ ] ID-12
2 different versions of Solidity are used:
	- Version constraint ^0.8.0 is used by:
		-[^0.8.0](new_contracts/arithmetic_security/Lending.sol#L2)
	- Version constraint ^0.8.20 is used by:
		-[^0.8.20](node_modules/@openzeppelin/contracts/token/ERC20/IERC20.sol#L4)

new_contracts/arithmetic_security/Lending.sol#L2


## solc-version
Impact: Informational
Confidence: High
 - [ ] ID-13
Version constraint ^0.8.20 contains known severe issues (https://solidity.readthedocs.io/en/latest/bugs.html)
	- VerbatimInvalidDeduplication
	- FullInlinerNonExpressionSplitArgumentEvaluationOrder
	- MissingSideEffectsOnSelectorAccess.
It is used by:
	- [^0.8.20](node_modules/@openzeppelin/contracts/token/ERC20/IERC20.sol#L4)

node_modules/@openzeppelin/contracts/token/ERC20/IERC20.sol#L4


 - [ ] ID-14
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
	- [^0.8.0](new_contracts/arithmetic_security/Lending.sol#L2)

new_contracts/arithmetic_security/Lending.sol#L2


## low-level-calls
Impact: Informational
Confidence: High
 - [ ] ID-15
Low level call in [MinimalLending.liquidate(address)](new_contracts/arithmetic_security/Lending.sol#L100-L109):
	- [(success,None) = msg.sender.call{value: collateral}()](new_contracts/arithmetic_security/Lending.sol#L107)

new_contracts/arithmetic_security/Lending.sol#L100-L109


 - [ ] ID-16
Low level call in [MinimalLending.repayLoan()](new_contracts/arithmetic_security/Lending.sol#L78-L88):
	- [(success,None) = msg.sender.call{value: collateral}()](new_contracts/arithmetic_security/Lending.sol#L86)

new_contracts/arithmetic_security/Lending.sol#L78-L88


## immutable-states
Impact: Optimization
Confidence: High
 - [ ] ID-17
[MinimalLending.token](new_contracts/arithmetic_security/Lending.sol#L13) should be immutable 

new_contracts/arithmetic_security/Lending.sol#L13


 - [ ] ID-18
[MinimalLending.oracle](new_contracts/arithmetic_security/Lending.sol#L14) should be immutable 

new_contracts/arithmetic_security/Lending.sol#L14


 - [ ] ID-19
[MinimalLending.owner](new_contracts/arithmetic_security/Lending.sol#L12) should be immutable 

new_contracts/arithmetic_security/Lending.sol#L12


