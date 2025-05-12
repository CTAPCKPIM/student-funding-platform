// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "../lib/HelperSFP.sol";

/**
 * @title Token ERC20 Standerd
 * @notice This contract provides the logic for a token
 * @author CTAPCKPIM
 */
contract Token is Initializable, OwnableUpgradeable, ERC20Upgradeable {
    /**
     * @notice Connect the HelperSFP library to the this contract
     */
    using HelperSFP for address;
    using HelperSFP for uint256;
    using HelperSFP for string;

    /**
     * @notice All events:
     */
    event Minted(address indexed _address, uint256 _amount);
    event Burned(address indexed _address, uint256 _amount);

    /**
     * @notice Initializes the contract
     * @param _name The name of the token
     * @param _symbol The symbol of the token
     */
    function initialize(string memory _name, string memory _symbol) public initializer {
        __Ownable_init(msg.sender);
        __ERC20_init(_name, _symbol);
    }

    /**
     * @notice Mints tokens to the specified address
     * @param _address The address to mint tokens to
     * @param _amount The amount of tokens to mint
     */
    function mint(address _address, uint256 _amount) external onlyOwner {
        _address.notZeroAddress();
        _amount.notZeroAmount();

        _mint(_address, _amount);

        emit Minted(_address, _amount);
    }

    /**
     * @notice Burns tokens from the specified address
     */
    function burn(address _address, uint256 _amount) external onlyOwner {
        _address.notZeroAddress();
        _amount.notZeroAmount();

        _burn(_address, _amount);

        emit Burned(_address, _amount);
    }
}
