// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IEligible {
    function isEligible(address user) external view returns (bool);
}

contract Airdrop {
    IERC20 immutable public token;
    IEligible immutable public eligible;
    uint256 immutable public registrationDeadline;
    
    address[] public participants;
    mapping(address => bool) public registered;
    bool public distributed;


    constructor(address _token, uint256 _registrationDeadline, address _eligible) {
        token = IERC20(_token);
        registrationDeadline = _registrationDeadline;
        eligible = IEligible(_eligible);
        register();
    }

    function register() public {
        require(block.timestamp <= registrationDeadline, "Registration closed");
        require(eligible.isEligible(msg.sender), "Not eligible");
        require(!registered[msg.sender], "Already registered");
        registered[msg.sender] = true;
        participants.push(msg.sender);
    }


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
}