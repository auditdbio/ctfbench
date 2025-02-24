// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract SimpleUniswapV1 {
    IERC20 public token; 
    
    uint256 public totalLiquidity; 
    mapping(address => uint256) public liquidity; 

    constructor(address token_addr) {
        token = IERC20(token_addr);
    }
    
    function init(uint256 tokens) public payable returns (uint256) {
        require(totalLiquidity == 0, "Pool already initialized");
        totalLiquidity = address(this).balance;
        liquidity[msg.sender] = totalLiquidity;
        require(token.transferFrom(msg.sender, address(this), tokens), "Token transfer failed");
        return totalLiquidity;
    }
    

    function price(uint256 inputAmount, uint256 inputReserve, uint256 outputReserve) public pure returns (uint256) {
        uint256 inputAmountWithFee = inputAmount * 997; 
        uint256 numerator = inputAmountWithFee * outputReserve;
        uint256 denominator = inputReserve * 1000 + inputAmountWithFee;
        return numerator / denominator;
    }
    

    function ethToToken() public payable {
        uint256 tokenReserve = token.balanceOf(address(this));
        uint256 tokensBought = price(msg.value, address(this).balance - msg.value, tokenReserve);
        require(token.transfer(msg.sender, tokensBought), "Token transfer failed");
    }
    
    function tokenToEth(uint256 tokensSold) public {
        uint256 tokenReserve = token.balanceOf(address(this));
        uint256 ethBought = price(tokensSold, tokenReserve, address(this).balance);
        require(token.transferFrom(msg.sender, address(this), tokensSold), "Token transfer failed");
        (bool success, ) = msg.sender.call{value: ethBought}("");
        require(success, "ETH transfer failed");
    }
    

    function deposit() public payable {
        uint256 ethReserve = address(this).balance - msg.value; 
        uint256 tokenReserve = token.balanceOf(address(this));
        uint256 tokenAmount = (msg.value * tokenReserve) / ethReserve;
        uint256 liquidityMinted = (msg.value * totalLiquidity) / ethReserve;
        liquidity[msg.sender] += liquidityMinted;
        totalLiquidity += liquidityMinted;
        require(token.transferFrom(msg.sender, address(this), tokenAmount), "Token transfer failed");
    }
    

    function withdraw(uint256 amount) public {
        require(amount <= liquidity[msg.sender], "Insufficient liquidity");
        uint256 ethAmount = (amount * address(this).balance) / totalLiquidity;
        uint256 tokenReserve = token.balanceOf(address(this));
        uint256 tokenAmount = (amount * tokenReserve) / totalLiquidity;
        liquidity[msg.sender] -= amount;
        totalLiquidity -= amount;
        (bool success, ) = msg.sender.call{value: ethAmount}("");
        require(success, "ETH transfer failed");
        require(token.transfer(msg.sender, tokenAmount), "Token transfer failed");
    }
    
}