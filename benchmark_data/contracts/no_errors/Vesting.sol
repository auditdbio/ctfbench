pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract Vesting {
    using SafeERC20 for IERC20;

    IERC20 public token;
    address public beneficiary;
    uint256 public start;
    uint256 public cliff;
    uint256 public duration;
    uint256 public released;

    constructor(IERC20 _token, address _beneficiary, uint256 _start, uint256 _cliff, uint256 _duration) {
        require(_beneficiary != address(0));
        token = _token;
        beneficiary = _beneficiary;
        start = _start;
        cliff = _start + _cliff;
        duration = _duration;
    }

    function release() public {
        require(block.timestamp >= cliff);
        uint256 unreleased = releasableAmount();
        require(unreleased > 0);
        released += unreleased;
        token.safeTransfer(beneficiary, unreleased);
    }

    function vestedAmount() public view returns (uint256) {
        uint256 totalBalance = token.balanceOf(address(this)) + released;
        if (block.timestamp < cliff) {
            return 0;
        } else if (block.timestamp >= start + duration) {
            return totalBalance;
        } else {
            return totalBalance * (block.timestamp - start) / duration;
        }
    }

    function releasableAmount() public view returns (uint256) {
        return vestedAmount() - released;
    }
}
