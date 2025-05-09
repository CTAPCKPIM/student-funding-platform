// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

// import "hardhat/console.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

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
    using SafeERC20 for IERC20;

    /**
     * @notice All variables:
     * { amount } - amount of funding pool
     * { timestamp } - The timestamp when the project was created
     * { projectName } - The name of the project
     * { factoryAddress } - The address of the factory contract
     */
    uint256 public amount;
    uint256 public timestamp;
    string public projectName;
    address public factoryAddress;

    /**
     * @notice All events:
     */
    event contributedNative(address indexed _contributor, uint256 _amount);
    event contributedERC20(
        address indexed _contributor,
        address indexed _token,
        uint256 _amount
    );

        /**
     * @notice Check for zero address
     */
    modifier notZeroAddress(address _address) {
        require(_address != address(0), "Zero address not allowed");
        _;
    }

    /**
     * @notice Check for zero amount
     */
    modifier notZeroAmount(uint256 _amount) {
        require(_amount > 0, "Zero amount not allowed");
        _;
    }

    /**
     * @notice Check for factory address
     */
    modifier onlyFactory() {
        require(msg.sender == factoryAddress, "Only factory can call this function");
        _;
    }

    /**
     * @notice Check for limit of the amount
     */
    modifier limitAmount(uint256 _amount) {
        require(_amount <= amount, "Amount exceeds funding pool limit");
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
    ) public 
    initializer
    onlyFactory
    {
        __Ownable_init(_owner);
        __ERC20_init(_tokenName, _tokenSymbol);

        amount = _amount;
        projectName = _projectName;
        timestamp = block.timestamp;
        factoryAddress = msg.sender;
    }

    /**
     * @notice Contribute to the project with native currency
     */
    function contributeNative() external payable notZeroAmount(msg.value) limitAmount(msg.value) {
        amount -= msg.value;

        // Transfer the funds to the contract
        payable(owner()).transfer(msg.value);

        // Mint tokens to the contributor
        _mint(msg.sender, msg.value);
        emit contributedNative(msg.sender, msg.value);
    }

    /**
     * @notice Contribute to the project with ERC20 tokens
     * @param _token The address of the ERC20 token contract
     * @param _amount The amount of tokens to contribute
     */
    function contributeERC20(
        address _token,
        uint256 _amount
    ) external notZeroAmount(_amount) notZeroAddress(_token) limitAmount(_amount) {
        amount -= _amount;

        // Transfer the tokens to the contract
        IERC20(_token).safeTransferFrom(msg.sender, owner(), _amount);

        // Mint tokens to the contributor
        _mint(msg.sender, _amount);
        emit contributedERC20(msg.sender, _token, _amount);
    }

    /**
     * @notice Function to mint tokens
     * @param _amount The amount of tokens to mint
     * @param _address The address to mint the tokens to
     */
    function mint(
        uint256 _amount,
        address _address
    ) external onlyOwner notZeroAmount(_amount) notZeroAddress(_address) {
        _mint(_address, _amount);
    }

    /**
     * @notice Function to burn tokens
     * @param _amount The amount of tokens to burn
     * @param _address The address to burn the tokens from
     */
    function burn(
        uint256 _amount,
        address _address
    ) external onlyOwner notZeroAmount(_amount) notZeroAddress(_address) {
        _burn(_address, _amount);
    }

    /**
     * @notice Fallback function to accept native currency
     */
    fallback() external payable {
        revert("Wrong function called");
    }

    /**
     * @notice Receive function to accept native currency
     */
    receive() external payable {
        revert("Wrong function called");
    }
}
