// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

contract PriceOracle {
    address public owner;
    mapping(string => uint256) public prices;

    event PriceUpdated(string asset, uint256 price);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not the owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function updatePrice(string memory asset, uint256 price) public onlyOwner {
        prices[asset] = price;
        emit PriceUpdated(asset, price);
    }

    function getPrice(string memory asset) public view returns (uint256) {
        return prices[asset];
    }
}
