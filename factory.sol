// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

contract Wallet {
    address public owner;

    constructor(address _owner) {
        owner = _owner;
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

contract WalletFactory {
    event WalletCreated(address walletAddress, address owner);

    function createWallet() external {
        Wallet newWallet = new Wallet(msg.sender);
        emit WalletCreated(address(newWallet), msg.sender);
    }
}
