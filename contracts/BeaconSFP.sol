// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./lib/HelperSFP.sol";

/**
 * @title Student Funding Pool Implementation
 * @notice This contract provides the upgradeable logic for a student funding pool
 *  Contributions can be made in native currency or various ERC20 tokens
 *  NOTE: The economic model for contributions and token minting is simplified for this project
 *      It assumes a 1:1 equivalence based on raw contributed amounts
 *      across all supported token types (including native),
 *      without accounting for varying market values or token decimals.
 *      This is a known simplification for the project scope.
 * @author CTAPCKPIM
 */
contract BeaconSFP is Initializable, OwnableUpgradeable, ERC20Upgradeable {
    /**
     * @notice Connect the HelperSFP library to the this contract
     */
    using HelperSFP for address;
    using HelperSFP for uint256;
    using HelperSFP for string;
    
    using SafeERC20 for IERC20;

    /**
     * @notice All errors thrown:
     * - AmountExceedsLimitError: Thrown when the amount exceeds the funding pool limit
     * - AmountExceedsError: Thrown when the amount exceeds the balance of the address
     * - FunctionCallError: Thrown when a function is called with an invalid function signature
     */
    error AmountExceedsLimitError();
    error AmountExceedsError();
    error FunctionCallError();

    /**
     * @notice All variables:
     * { amount } - amount of funding pool
     * { timestamp } - The timestamp when the project was created
     * { projectName } - The name of the project
     */
    uint256 public amount;
    uint256 public timestamp;
    string public projectName;

    /**
     * @notice All events:
     */
    event ContributedNative(address indexed _contributor, uint256 _amount);
    event StuckTokensWithdrawn(address indexed _token, uint256 _amount);
    event Minted(address indexed _address, uint256 _amount);
    event Burned(address indexed _address, uint256 _amount);
    event ContributedERC20(
        address indexed _contributor,
        address indexed _token,
        uint256 _amount
    );

    /**
     * @notice Check for limit of the amount
     */
    modifier limitAmount(uint256 _amount) {
        if (_amount > amount) revert AmountExceedsLimitError();
        _;
    }

    /**
     * @notice Initializes the beacon contract with the given parameters
     * @param _amount The amount of funding pool
     * @param _projectName The name of the project
     * @param _tokenName The name of the token
     * @param _tokenSymbol The symbol of the token
     * @param _owner The address of the owner
     */
    function initialize(
        uint256 _amount,
        string memory _projectName,
        string memory _tokenName,
        string memory _tokenSymbol,
        address _owner
    ) public initializer {
        // Validate the parameters
        _amount.notZeroAmount();
        _projectName.notZeroString();
        _tokenName.notZeroString();
        _tokenSymbol.notZeroString();
        _owner.notZeroAddress();

        __Ownable_init(_owner);
        __ERC20_init(_tokenName, _tokenSymbol);

        amount = _amount;
        projectName = _projectName;
        timestamp = block.timestamp;
    }

    /**
     * @notice Contribute to the project with native currency
     */
    function contributeNative() external payable limitAmount(msg.value) {
        msg.value.notZeroAmount();

        amount -= msg.value;
        // Mint tokens to the contributor
        _mint(msg.sender, msg.value);
        // Transfer the funds to the owner
        payable(owner()).transfer(msg.value);

        emit ContributedNative(msg.sender, msg.value);
    }

    /**
     * @notice Contribute to the project with ERC20 tokens
     * @param _token The address of the ERC20 token contract
     * @param _amount The amount of tokens to contribute
     */
    function contributeERC20(
        address _token,
        uint256 _amount
    ) external limitAmount(_amount) {
        _amount.notZeroAmount();
        _token.notZeroAddress();

        amount -= _amount;
        // Mint tokens to the contributor
        _mint(msg.sender, _amount);
        // Transfer the tokens to the contract
        IERC20(_token).safeTransferFrom(msg.sender, owner(), _amount);

        emit ContributedERC20(msg.sender, _token, _amount);
    }

    /**
     * @notice Function to mint tokens
     * @param _amount The amount of tokens to mint
     * @param _address The address to mint the tokens to
     */
    function mint(
        uint256 _amount,
        address _address
    ) external onlyOwner {
        _amount.notZeroAmount();
        _address.notZeroAddress();

        _mint(_address, _amount);
        emit Minted(_address, _amount);
    }

    /**
     * @notice Function to burn tokens
     * @param _amount The amount of tokens to burn
     * @param _address The address to burn the tokens from
     */
    function burn(
        uint256 _amount,
        address _address
    ) external onlyOwner {
        _amount.notZeroAmount();
        _address.notZeroAddress();

        if (balanceOf(_address) < _amount) revert AmountExceedsError();

        _burn(_address, _amount);
        emit Burned(_address, _amount);
    }

    /**
     * @notice Function to withdraw stuck tokens form the contract
     * @param _token The address of the token contract
     * @param _amount The amount of tokens to withdraw
     */
    function withdrawStuckTokens(
        address _token,
        uint256 _amount
    ) external onlyOwner {
        _token.notZeroAddress();
        _amount.notZeroAmount();

        if (IERC20(_token).balanceOf(address(this)) < _amount) revert AmountExceedsError();

        IERC20(_token).safeTransfer(owner(), _amount);
        emit StuckTokensWithdrawn(_token, _amount);
    }

    /**
     * @notice Fallback function to accept native currency
     */
    fallback() external payable {
        revert FunctionCallError();
    }

    /**
     * @notice Receive function to accept native currency
     */
    receive() external payable {
        revert FunctionCallError();
    }
}
