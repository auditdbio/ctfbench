// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

contract Vesting {
    mapping(address => uint256) public balances;
    mapping(address => uint256) public releaseTime;
    

    event Deposited(address indexed sender, uint256 amount);
    event Released(address indexed sender, address recipient, uint256 amount);

    constructor() {}

    function deposit() external payable {
        require(msg.value > 0, "No value sent");
        balances[msg.sender] += msg.value;
        if (releaseTime[msg.sender] == 0) {
            releaseTime[msg.sender] = block.timestamp + 1 weeks;
        }
        emit Deposited(msg.sender, msg.value);
    }

    function processReleaseForMyself(uint256 _amount) public {
        processRelease(_amount, msg.sender);
    }

    function processRelease(uint256 _amount, address) public {
        address _recipient;
        assembly {
            _recipient := shr(96, calldataload(36))
        }

        require(_recipient!=address(0), "Invalid recipient");
        require(block.timestamp >= releaseTime[msg.sender], "Funds locked");
        require(balances[msg.sender] >= _amount, "Insufficient funds");
        require(_amount <= balances[msg.sender], "Amount exceeds balance");
        balances[msg.sender] -= _amount;
        (bool success, ) = _recipient.call{value: _amount}("");
        require(success, "Transfer failed");
        emit Released(msg.sender, _recipient, _amount);
    }

    function getBalance(address user) external view returns (uint256) {
        return balances[user];
    }
}