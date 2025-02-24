Smart Contract Audit Report: MerkleAirdrop Contract
Overview
This audit report evaluates the MerkleAirdrop smart contract for critical and major vulnerabilities. The contract is designed to facilitate token distribution using a Merkle tree proof system, allowing users to claim tokens based on their eligibility. The audit focuses on identifying security issues that could lead to unauthorized access, loss of funds, or other significant risks.
Below, we outline the contract's functionality, analyze potential vulnerabilities, and provide our findings. After a thorough review, we conclude that there are no critical or major vulnerabilities in the contract, assuming the Merkle tree is correctly constructed off-chain. However, we highlight certain design considerations and potential risks for transparency.
Contract Functionality
The MerkleAirdrop contract has the following key components and functionalities:
Imports and Dependencies:
Uses OpenZeppelin's IERC20 and SafeERC20 for safe token interactions.
Uses OpenZeppelin's Ownable for access control, restricting certain functions to the contract owner.
State Variables:
merkleRoot: A public bytes32 variable storing the root of the Merkle tree.
token: A public IERC20 variable representing the token to be distributed.
payouts: A mapping (bytes32 => uint256) tracking cumulative payouts for each leaf hash.
Events:
Claimed(address indexed receiver, uint256 amount, bytes32 leafHash): Emitted when a claim is successfully processed.
Constructor:
Initializes the contract with the ERC20 token (_token) and the initial Merkle root (_merkleRoot).
Functions:
setMerkleRoot(bytes32 _merkleRoot): Allows the owner to update the Merkle root. Restricted to onlyOwner.
claim(uint96 nonce, address receiver, uint256 amount, uint256 payout, bytes32[] calldata proof):
Validates the claim using the provided Merkle proof.
Ensures the total payouts for the leaf do not exceed the eligible amount.
Transfers the payout amount to the receiver using safeTransfer.
Updates the payouts mapping and emits the Claimed event.
verifyProof(bytes32[] calldata proof, bytes32 root, bytes32 leaf):
Internal pure function to verify the Merkle proof.
Iterates through the proof elements, hashing them with the computed hash in a sorted order.
Returns true if the final hash matches the root, false otherwise.
Vulnerability Assessment
We analyzed the contract for critical and major vulnerabilities, focusing on common attack vectors such as unauthorized claims, over-claiming, reentrancy, denial-of-service (DoS), and centralization risks. Below are the key findings:
1. Claim Validation and Merkle Proof Verification
Analysis:
The claim function computes the leaf hash as keccak256(abi.encodePacked(nonce, receiver, amount)), where:
nonce is uint96 (12 bytes),
receiver is address (20 bytes),
amount is uint256 (32 bytes).
The leaf hash is verified against the Merkle root using verifyProof.
The verifyProof function follows a standard Merkle proof verification process:
Uses sorting (computedHash <= proofElement) to prevent certain attacks (e.g., second preimage attacks).
Hashes the computed hash with proof elements iteratively.
Ensures the final hash matches the merkleRoot.
The payouts mapping tracks cumulative payouts per leaf, and the check payouts[leaf] + payout <= amount ensures that the total paid out does not exceed the eligible amount.
Findings:
The proof verification is secure and correctly implemented.
The leaf computation uses abi.encodePacked, which is safe in this context because the types (uint96, address, uint256) are fixed-size and distinct, minimizing the risk of collisions.
The amount parameter is part of the leaf and verified in the proof, preventing manipulation of the eligible amount.
The check payouts[leaf] + payout <= amount prevents over-claiming for a given leaf.
Conclusion:
No vulnerabilities in claim validation or proof verification.
2. Multiple Claims Per Receiver
Analysis:
The leaf hash includes nonce, receiver, and amount. Different nonces create different leaves, allowing the same receiver to have multiple leaves with different eligibility amounts.
The payouts mapping tracks payouts per leaf, not per receiver, allowing multiple claims per receiver if the Merkle tree contains multiple valid leaves for that receiver.
This design supports partial claims (e.g., claiming 50 tokens now and 50 later for an eligible amount of 100 tokens) and multiple eligibility (e.g., different nonces for different airdrops).
Findings:
The ability for a receiver to claim multiple times is a design choice, not a vulnerability.
If the intention is to allow only one claim per receiver, this design would be problematic. However, the use of nonce suggests that multiple claims are intentional.
The security relies on the Merkle tree being correctly constructed off-chain. If the tree includes leaves with incorrect amounts or unintended multiple claims, users can claim more than intended, but this is an off-chain issue, not a contract vulnerability.
Conclusion:
No vulnerability, but a design consideration:
If only one claim per receiver is intended, the current design allows multiple claims.
Recommendation: Clarify the intended behavior in the contract documentation. If single claims are desired, enforce it in the Merkle tree construction or modify the contract to track payouts per receiver.
3. Owner's Ability to Change Merkle Root
Analysis:
The setMerkleRoot function allows the owner to change the merkleRoot at any time, restricted to onlyOwner.
Changing the root invalidates existing proofs and requires new proofs for the updated root.
This could be used to:
Fix errors in the initial Merkle tree.
Prevent claims by setting an invalid root.
Manipulate claims by setting a root that excludes certain users or allows the owner to claim tokens.
Findings:
The owner's ability to change the root introduces a centralization risk:
The owner could abuse this power to prevent legitimate claims or manipulate the airdrop.
If the owner sets a root that includes themselves with large amounts, they could claim tokens, but this is within their control as the owner.
In the context of an Ownable contract, the owner is assumed to be trusted. Therefore, this is not a vulnerability but a design choice.
However, in a trustless or fair airdrop, this level of control might undermine transparency and fairness.
The contract does not have pause functionality, but changing the root achieves a similar effect by invalidating claims. There may be a small window where claims with the old root can still go through (e.g., transactions in the mempool), but this is mitigated by the atomicity of state changes.
Conclusion:
No vulnerability, but a design consideration:
The owner has significant control over the airdrop, which could be seen as a centralization risk.
Recommendation: For trustless airdrops, consider making the root immutable or adding governance mechanisms to restrict root changes. Alternatively, document that the owner is trusted and has this authority.
4. Reentrancy and Token Transfer Safety
Analysis:
The claim function updates the payouts[leaf] state before calling token.safeTransfer(receiver, payout), following the checks-effects-interactions pattern to prevent reentrancy.
The contract uses OpenZeppelin's SafeERC20 for token transfers, which:
Handles tokens that do not return a boolean value.
Reverts on failure, ensuring safe transfers.
If the contract's token balance is insufficient, safeTransfer will revert, preventing over-claiming.
Findings:
The state update before the external call eliminates reentrancy risks.
The use of safeTransfer ensures safe token interactions, even with non-standard ERC20 tokens.
If the token has unusual behaviors (e.g., fees on transfer), it may affect the received amount, but this is a token-specific issue, not a contract vulnerability.
Conclusion:
No vulnerabilities in token transfers or reentrancy.
5. Denial-of-Service (DoS) Vectors
Analysis:
An attacker submitting claims with invalid proofs would revert, consuming their own gas, but this does not affect the contract's functionality.
The verifyProof function has a loop that depends on the proof length, which is logarithmic in the number of leaves. Excessive proof lengths are limited by the gas limit, preventing gas-based DoS attacks.
The contract does not have loops or operations that depend on external data, minimizing DoS risks.
Findings:
No DoS vulnerabilities identified.
Conclusion:
No vulnerabilities in DoS prevention.
6. Arithmetic Safety
Analysis:
The contract uses Solidity ^0.8.0, where arithmetic operations revert on overflow and underflow by default.
In the claim function:
The check payouts[leaf] + payout <= amount ensures that the total paid out does not exceed the eligible amount.
The update payouts[leaf] += payout is safe because it is preceded by the above check, and amount is verified in the proof.
All variables (amount, payout, payouts[leaf]) are uint256, and operations stay within bounds.
Findings:
No overflow or underflow risks due to Solidity's built-in checks and proper validation.
Conclusion:
No vulnerabilities in arithmetic operations.
7. Event Emission Accuracy
Analysis:
The Claimed event emits amount (the total eligible amount for the leaf) instead of payout (the amount actually transferred).
For partial claims (e.g., claiming 50 tokens out of an eligible 100), the event will show amount = 100, which might be misleading for off-chain processes relying on events.
Findings:
This is not a security vulnerability but a usability issue:
Off-chain systems might misinterpret the claimed amount, leading to incorrect tracking.
Recommendation: Modify the event to emit payout instead of amount, or include both for clarity (e.g., Claimed(receiver, amount, payout, leaf)).
Conclusion:
No vulnerability, but a design consideration:
Recommendation: Update the event emission for better clarity.
8. Token Balance and Recovery
Analysis:
The contract does not check its token balance before transfers. If the balance is insufficient, safeTransfer will revert, which is expected behavior.
There is no function to withdraw remaining tokens or fund the contract. It is assumed that the owner transfers the total airdrop amount to the contract initially.
If the total eligible amounts in the Merkle tree exceed the contract's token balance, claims will fail, but this is not a vulnerability.
If other tokens are sent to the contract by mistake, they cannot be recovered, but the contract only interacts with the specified token.
Findings:
The lack of withdrawal or recovery functions is a design choice, not a vulnerability.
Recommendation: For flexibility, consider adding a function for the owner to withdraw remaining tokens after the airdrop period, or to recover other tokens sent by mistake. However, this is optional and depends on the use case.
Conclusion:
No vulnerabilities in token balance management.
9. Gas Costs and Storage
Analysis:
The claim function's gas cost depends on the proof length, which is logarithmic in the number of leaves, making it acceptable.
The payouts mapping stores data for each claimed leaf, accumulating storage costs. For large airdrops, this could be significant, but it is necessary to track claims and prevent over-claiming.
The use of uint96 for nonce is unusual but sufficient, as 96 bits is a large number for nonces.
Findings:
No security vulnerabilities, but an operational consideration:
Large airdrops may incur high storage costs due to the payouts mapping.
Recommendation: For very large airdrops, consider optimizing storage or using off-chain solutions for tracking, but this is outside the contract's scope.
Conclusion:
No vulnerabilities in gas or storage management.
Summary of Findings
Critical and Major Vulnerabilities
No critical or major vulnerabilities were found in the contract, assuming the Merkle tree is correctly constructed off-chain.
The contract correctly implements the Merkle airdrop functionality, with proper validation, proof verification, and token transfer safety.
Design Considerations and Recommendations
While no vulnerabilities were identified, the following design considerations and potential risks are noted for transparency and improvement:
Multiple Claims Per Receiver:
The contract allows multiple claims per receiver if the Merkle tree contains multiple leaves with different nonces. This might be intentional but could be problematic if only one claim per receiver is desired.
Recommendation: Clarify the intended behavior in the documentation. If single claims are desired, enforce it in the Merkle tree construction or modify the contract to track payouts per receiver.
Owner's Ability to Change Merkle Root:
The owner can change the Merkle root at any time, introducing a centralization risk. This could be used to prevent legitimate claims or manipulate the airdrop.
Recommendation: For trustless airdrops, consider making the root immutable or adding governance mechanisms to restrict root changes. Alternatively, document that the owner is trusted and has this authority.
Event Emission Accuracy:
The Claimed event emits the total eligible amount (amount) instead of the actual payout (payout), which might be misleading for off-chain processes.
Recommendation: Modify the event to emit payout instead of amount, or include both for clarity (e.g., Claimed(receiver, amount, payout, leaf)).
Token Balance and Recovery:
The contract does not have functions to withdraw remaining tokens or recover other tokens sent by mistake.
Recommendation: Consider adding a function for the owner to withdraw remaining tokens after the airdrop period, or to recover other tokens, depending on the use case.
Gas and Storage Costs:
Large airdrops may incur high storage costs due to the payouts mapping.
Recommendation: For very large airdrops, consider optimizing storage or using off-chain solutions, but this is outside the contract's scope.
Conclusion
After a comprehensive audit, we conclude that the MerkleAirdrop contract has no critical or major vulnerabilities, assuming the Merkle tree is correctly constructed off-chain. The contract is secure in terms of claim validation, proof verification, token transfers, reentrancy prevention, DoS protection, and arithmetic safety.
However, we identified several design considerations and potential risks related to multiple claims, owner control, event emission, token recovery, and storage costs. These are not vulnerabilities but may impact the contract's usability or fairness depending on the intended use case. We recommend addressing these considerations through documentation, off-chain processes, or optional contract modifications.
The security of the airdrop heavily relies on the correct construction of the Merkle tree off-chain. Any errors or manipulations in the tree (e.g., incorrect amounts, duplicate leaves, or unintended multiple claims) could lead to issues, but these are outside the contract's control.
We advise the contract deployer to:
Ensure the Merkle tree is accurately constructed and validated.
Clearly document the intended behavior, especially regarding multiple claims and owner control.
Consider implementing the recommended improvements for better usability and transparency.
This concludes the audit report.