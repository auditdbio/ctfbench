Below is the audit report for the provided Airdrop smart contract, identifying all CRITICAL and MAJOR vulnerabilities based on a thorough analysis. As a senior smart contract auditor, I have examined the code for security issues that could compromise its functionality or lead to exploits, focusing on critical and major vulnerabilities that impact the contract's core purpose—distributing tokens to eligible participants.
Audit Report for Airdrop Smart Contract
Overview
The Airdrop contract is designed to allow users to register for an airdrop before a specified deadline, with eligibility determined by an external IEligible contract. After the registration period ends, the distribute function transfers an equal share of ERC20 tokens (held by the contract) to all registered participants. The contract uses OpenZeppelin's IERC20 interface for token interactions and includes immutable variables for the token, eligibility contract, and registration deadline.
While the contract's logic is straightforward, it contains significant vulnerabilities that could prevent token distribution or allow denial-of-service (DoS) attacks. Below are the identified CRITICAL and MAJOR vulnerabilities, along with their descriptions, impacts, and recommendations for mitigation.
Critical Vulnerabilities
1. Unbounded Loop in distribute Function
Description:
The distribute function iterates over the participants array to transfer tokens to each registered address using a for loop:
solidity
for (uint256 i = 0; i < totalParticipants; i++) {
    require(token.transfer(participants[i], amountPerParticipant), "Transfer failed");
}
The gas cost of this loop increases linearly with the number of participants. If the number of participants grows large (e.g., hundreds or thousands), the total gas required may exceed the Ethereum block gas limit (approximately 30 million gas at the time of writing), causing the transaction to fail.
Impact:
If the gas limit is exceeded, the distribute function becomes inexecutable, preventing token distribution entirely. This locks the tokens in the contract, rendering the airdrop ineffective and failing its primary purpose. Since the participants array has no upper bound (anyone eligible can register before the deadline), this vulnerability is highly likely to occur in a successful airdrop with many participants.
Recommendation:
Replace the push-based distribution with a pull-based mechanism, where participants call a claim function to retrieve their tokens individually:
solidity
mapping(address => bool) public claimed;

function claim() external {
    require(block.timestamp > registrationDeadline, "Distribution not started");
    require(!distributed, "Already distributed");
    require(registered[msg.sender], "Not registered");
    require(!claimed[msg.sender], "Already claimed");
    
    uint256 totalParticipants = participants.length;
    uint256 balance = token.balanceOf(address(this));
    uint256 amountPerParticipant = balance / totalParticipants;
    
    claimed[msg.sender] = true;
    require(token.transfer(msg.sender, amountPerParticipant), "Transfer failed");
}
Alternatively, use a Merkle tree-based approach to allow scalable verification and claiming of airdrop allocations off-chain, reducing on-chain gas costs.
Major Vulnerabilities
1. Single Failed Transfer Blocks Entire Distribution
Description:
In the distribute function, each token transfer is wrapped in a require statement:
solidity
require(token.transfer(participants[i], amountPerParticipant), "Transfer failed");
If any single transfer fails—for example, if a participant's address is a contract that reverts upon receiving tokens (e.g., lacks a receive or fallback function)—the entire distribute function reverts. This halts distribution to all participants, even those whose transfers would have succeeded.
Impact:
A single malicious or misconfigured participant can prevent the entire airdrop from completing, effectively causing a denial-of-service (DoS) attack. For instance, an attacker could register with a contract address designed to revert on token receipt, ensuring the distribute function fails. This leaves all tokens stuck in the contract, undermining the airdrop's purpose.
Recommendation:
Modify the distribute function to handle failed transfers gracefully by skipping them instead of reverting:
solidity
for (uint256 i = 0; i < totalParticipants; i++) {
    if (!token.transfer(participants[i], amountPerParticipant)) {
        // Log failure and continue (could emit an event)
        continue;
    }
}
However, this requires the IERC20 transfer function's return value to be handled without require, which may not guarantee delivery if the token implementation is non-standard. A more robust solution is the pull-based claiming mechanism suggested above, where each participant claims their share individually, isolating failures to specific claimants.
Additional Observations
While not classified as critical or major vulnerabilities, the following design considerations could affect the contract's usability or security and are worth noting:
Constructor Forces Deployer Registration:
The constructor calls register(), automatically registering the deployer if they are eligible:
solidity
constructor(address _token, uint256 _registrationDeadline, address _eligible) {
    token = IERC20(_token);
    registrationDeadline = _registrationDeadline;
    eligible = IEligible(_eligible);
    register();
}
If the deployer is not eligible, the deployment reverts due to the require(eligible.isEligible(msg.sender), "Not eligible") check in register(). This design forces the deployer to be eligible, which may not align with all use cases (e.g., a deployer who does not intend to participate).
Remainder Tokens Left in Contract:
The amountPerParticipant calculation uses integer division:
solidity
uint256 amountPerParticipant = balance / totalParticipants;
Any remainder (e.g., 100 tokens divided among 3 participants leaves 1 token) remains in the contract with no mechanism for withdrawal or further distribution.
No Emergency Withdrawal:
There is no function to recover tokens if distribution fails (e.g., due to gas limits) or after distribution completes with remaining tokens. This could trap funds in the contract permanently.
External Dependency on IEligible:
The contract relies on the IEligible interface for eligibility checks. If the external contract is buggy or malicious, it could compromise the airdrop's integrity, though this is outside the Airdrop contract's direct control.
Conclusion
The Airdrop smart contract contains two significant vulnerabilities:
Critical: An unbounded loop in the distribute function that risks exceeding the block gas limit with a large number of participants, making distribution impossible.
Major: A single failed token transfer that can revert the entire distribution, enabling a potential DoS attack by a malicious participant.
These issues threaten the contract's ability to reliably distribute tokens, its core functionality. Implementing a pull-based claiming mechanism would mitigate both vulnerabilities by eliminating the loop and isolating transfer failures to individual claimants. Additional improvements, such as handling remainder tokens and adding emergency withdrawal functionality, would enhance the contract's robustness.
Addressing these vulnerabilities is essential to ensure the Airdrop contract operates securely and fulfills its intended purpose of fairly distributing tokens to eligible participants.
This report provides a comprehensive analysis of the critical and major vulnerabilities in the Airdrop contract, along with actionable recommendations for remediation.