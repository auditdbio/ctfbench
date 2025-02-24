// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";

interface Uniswap {
    function getEthToTokenInputPrice(uint256 ethSold) external view returns (uint256 tokensBought);
}

contract OracleFlashToken is ERC20Burnable {
    Uniswap public uniswapOracle;

    constructor(address _oracle) ERC20("OracleFlashToken", "OFT") {
        uniswapOracle = Uniswap(_oracle);
    }

    function mint() external payable {
        require(msg.value > 0, "Must send ETH to mint tokens");
        uint256 tokenAmount = uniswapOracle.getEthToTokenInputPrice(msg.value);
        require(tokenAmount > 0, "Oracle returned zero tokens");
        _mint(msg.sender, tokenAmount);
    }


    function flashLoan(uint256 amount, address target, bytes calldata data) external {
        uint256 balanceBefore = balanceOf(address(this));
        _mint(target, amount);
        (bool success, ) = target.call(data);
        require(success, "Flashloan callback failed");
        uint256 balanceAfter = balanceOf(address(this));
        require(balanceAfter >= balanceBefore + amount, "Flashloan not repaid");
        _burn(address(this), amount);
    }
}