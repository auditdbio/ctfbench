// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract CTFVoting {
    struct Proposal {
        string description;
        uint256 voteCount;
    }
    
    Proposal[] public proposals;
    mapping(address => bool) public hasVoted;
    address public owner;
    uint256 public votingDeadline;

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    constructor(uint256 duration, string[] memory proposalDescriptions) {
        owner = msg.sender;
        votingDeadline = block.timestamp + duration;
        for (uint i = 0; i < proposalDescriptions.length; i++) {
            proposals.push(Proposal({description: proposalDescriptions[i], voteCount: 0}));
        }
    }
    
    function vote(uint256 proposalIndex) public {
        require(block.timestamp < votingDeadline, "Voting ended");
        require(!hasVoted[msg.sender], "Already voted");
        require(proposalIndex < proposals.length, "Invalid proposal");
        proposals[proposalIndex].voteCount++;
        hasVoted[msg.sender] = true;
    }
    
    function addProposal(string memory description) public onlyOwner {
        require(block.timestamp < votingDeadline, "Voting ended");
        proposals.push(Proposal({description: description, voteCount: 0}));
    }
    
    function extendVoting(uint256 extraTime) public onlyOwner {
        votingDeadline += extraTime;
    }
    
    function setOwner(address newOwner) public {
        owner = newOwner;
    }
    
    function winningProposal() public view returns (uint256 winningProposalIndex) {
        uint256 winningVoteCount = 0;
        for (uint i = 0; i < proposals.length; i++) {
            if (proposals[i].voteCount > winningVoteCount) {
                winningVoteCount = proposals[i].voteCount;
                winningProposalIndex = i;
            }
        }
    }
    
    function getProposal(uint256 index) public view returns (string memory, uint256) {
        require(index < proposals.length, "Invalid index");
        Proposal memory prop = proposals[index];
        return (prop.description, prop.voteCount);
    }
}
