// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IPriceOracle {
    function getPrice() external view returns (uint256);
}


contract MinimalLending {
    address public owner;
    IERC20 public token;
    IPriceOracle public oracle;
    

    uint256 public constant MIN_COLLATERAL_RATIO = 150;   
    uint256 public constant LIQUIDATION_THRESHOLD = 110;    
    uint256 public constant INTEREST_RATE_PER_SECOND = 3170979198; 

    struct Loan {
        uint256 collateral; 
        uint256 principal; 
        uint256 startTime; 
    }
    
    mapping(address => Loan) public loans;
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    constructor(address _token, address _oracle) {
        owner = msg.sender;
        token = IERC20(_token);
        oracle = IPriceOracle(_oracle);
    }
    
    function depositLiquidity(uint256 amount) external onlyOwner {
        require(token.transferFrom(msg.sender, address(this), amount), "Transfer failed");
    }
    
    function borrow(uint256 borrowAmount) external payable {
        require(msg.value > 0, "Collateral required");
        require(loans[msg.sender].principal == 0, "Existing loan exists");
        
        uint256 price = oracle.getPrice();
        uint256 collateralValue = (msg.value * price) / 1e18;
        require(collateralValue * 100 >= borrowAmount * MIN_COLLATERAL_RATIO, "Insufficient collateral");
        
        loans[msg.sender] = Loan({
            collateral: msg.value,
            principal: borrowAmount,
            startTime: block.timestamp
        });
        
        require(token.transfer(msg.sender, borrowAmount), "Token transfer failed");
    }
    
    function getCurrentDebt(address borrower) public view returns (uint256) {
        Loan memory loan = loans[borrower];
        if (loan.principal == 0) return 0;
        uint256 timeElapsed = block.timestamp - loan.startTime;
        uint256 scale = 1e18;

        uint256 x = INTEREST_RATE_PER_SECOND * timeElapsed / scale;
        
        uint256 x2 = (x * x) / scale;
        uint256 x3 = (x2 * x) / scale;
        
        uint256 expApprox = scale + x + (x2 / 2) + (x3 / 6);
        
        return (loan.principal * expApprox) / scale;
    }

    
    function repayLoan() external {
        Loan memory loan = loans[msg.sender];
        require(loan.principal > 0, "No active loan");
        uint256 debt = getCurrentDebt(msg.sender);
        uint256 collateral = loan.collateral;
        delete loans[msg.sender];

        require(token.transferFrom(msg.sender, address(this), debt), "Token transfer failed");
        (bool success, ) = msg.sender.call{value: collateral}("");
        require(success, "ETH refund failed");
    }
    }
    
    function isLiquidatable(address borrower) public view returns (bool) {
        Loan memory loan = loans[borrower];
        if (loan.principal == 0) return false;
        uint256 debt = getCurrentDebt(borrower);
        uint256 price = oracle.getPrice();
        uint256 collateralValue = (loan.collateral * price) / 1e18;
        return (debt * 100) >= (collateralValue * LIQUIDATION_THRESHOLD);
    }
    
    function liquidate(address borrower) external {
        require(isLiquidatable(borrower), "Loan not liquidatable");
        Loan memory loan = loans[borrower];
        uint256 debt = getCurrentDebt(borrower);
        uint256 collateral = loan.collateral;
        delete loans[borrower];
        require(token.transferFrom(msg.sender, address(this), debt), "Token transfer failed");
        (bool success, ) = msg.sender.call{value: collateral}("");
        require(success, "Collateral transfer failed");
    }
    
}