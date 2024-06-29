// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

contract Wallet {
    address public owner;

    constructor() {
        owner = msg.sender;
    }

    receive() external payable {}

    function withdraw(uint _amount) external {
        require(msg.sender == owner, "Only owner can withdraw");
        payable(owner).transfer(_amount);
    }

    function getBalance() external view returns (uint) {
        return address(this).balance;
    }
}
