// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;


interface IVotingPower {
    function votingPower(address account) external view returns (uint256);
}

contract Voting {
    IVotingPower public immutable votingPowerContract;
    
    mapping(address => bool) public hasVoted;
    
    uint256 public totalVotes;
    
    uint256 public immutable quorumVotes;
    
    address public immutable proposalTarget;
    
    bytes public proposalData;
    
    bool public executed;

    event VoteCast(address indexed voter, uint256 weight);
    event ProposalExecuted(address indexed executor, bool success, bytes returnData);

    constructor(
        address _votingPowerContract,
        uint256 _quorumVotes,
        address _proposalTarget,
        bytes memory _proposalData
    ) {
        require(_votingPowerContract != address(0), "Invalid voting power contract address");
        require(_proposalTarget != address(0), "Invalid proposal target address");
        
        votingPowerContract = IVotingPower(_votingPowerContract);
        quorumVotes = _quorumVotes;
        proposalTarget = _proposalTarget;
        proposalData = _proposalData;
    }


    function vote() external {
        require(!hasVoted[msg.sender], "You have already voted");

        uint256 power = votingPowerContract.votingPower(msg.sender);
        require(power > 0, "No voting power");

        hasVoted[msg.sender] = true;
        totalVotes += power;

        emit VoteCast(msg.sender, power);
    }

    function executeProposal() external {
        require(!executed, "Proposal already executed");
        require(totalVotes >= quorumVotes, "Quorum not reached");

        executed = true;
        (bool success, bytes memory returnData) = proposalTarget.call(proposalData);
        require(success, "Proposal execution failed");

        emit ProposalExecuted(msg.sender, success, returnData);
    }
}
