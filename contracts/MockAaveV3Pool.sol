// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./IAaveV3Pool.sol";

contract MockAaveV3Pool is IAaveV3Pool {
    mapping(address => mapping(address => uint256)) public supplied; // user => asset => amount

    function supply(address asset, uint256 amount, address onBehalfOf, uint16) external override {
        supplied[onBehalfOf][asset] += amount;
    }

    function withdraw(address asset, uint256 amount, address to) external override returns (uint256) {
        uint256 bal = supplied[msg.sender][asset];
        uint256 withdrawAmount = amount > bal ? bal : amount;
        supplied[msg.sender][asset] -= withdrawAmount;
        return withdrawAmount;
    }
} 