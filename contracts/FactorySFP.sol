// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/proxy/beacon/BeaconProxy.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./BeaconSFP.sol";
import "./lib/HelperSFP.sol";

/**
 * @title Factory of Student Funding Platform
 * @notice Contract is used to create and manage student funding projects
 * @author CTAPCKPIM
 */
contract FactorySFP is Initializable, OwnableUpgradeable {
    /**
     * @notice Connect the HelperSFP library to the this contract
     */
    using HelperSFP for address;
    using HelperSFP for uint256;
    using HelperSFP for string;

    using SafeERC20 for IERC20;

    /**
     * @notice All errors thrown:
     * - NotWhitelistedError: Thrown when a user is not whitelisted
     * - FunctionCallError: Thrown when a function is called with an invalid function signature
     * - AmountExceedsError: Thrown when the amount exceeds the balance of the address
     */
    error NotWhitelistedError();
    error FunctionCallError();
    error AmountExceedsError();

    /**
     * @notice All variables:
     * { totalProjects } - The total number of projects created
     * { beaconAddress } - The address of the beacon contract
     */
    uint256 public totalProjects;
    address public beaconAddress;

    /**
     * @notice Structure to store the `project` information
     * @param amount The amount of funding pool
     * @param timestamp The timestamp when the project was created 
     * @param name The name of the project
     * @param tokenName The name of the token
     * @param tokenSymbol The symbol of the token
     * @param projectAddress The address of the project contract
     */
    struct Project {
        uint256 amount;
        uint256 timestamp;
        string name;
        string tokenName;
        string tokenSymbol;
        address projectAddress;
    }

    /**
     * @notice All mappings:
     * { projects } - Mapping to store the `projects` of the users
     * { whitelist } - The mapping to store the `whitelisted` addresses
     */
    mapping(address => Project[]) public projects;
    mapping(address => bool) public whitelist;

    /**
     * @notice All events:
     */
    event BeaconAddressUpdated(address indexed _addressOld, address indexed _addressNew);
    event WhitelistStatusUpdated(address indexed _address, bool _status);
    event StuckTokensWithdrawn(address indexed _token, uint256 _amount);
    event ProjectCreated(
        uint256 _amount,
        string _name,
        string _tokenName,
        string _tokenSymbol,
        address indexed _owner,
        address indexed _address
    );

    /**
     * @notice Check if the address is whitelisted
     */
    modifier onlyWhitelisted() {
        if (!whitelist[msg.sender]) revert NotWhitelistedError();
        _;
    }

    /**
     * @notice Initializes the factory
     * @param _beaconAddress The address of the beacon contract
     */
    function initialize(address _beaconAddress) public initializer {
        _beaconAddress.notZeroAddress();

        __Ownable_init(msg.sender);
        beaconAddress = _beaconAddress;
    }

    /**
     * @notice Change the beacon address
     * @param _beaconAddress The address of the beacon contract
     */
    function changeBeaconAddress(address _beaconAddress) public onlyOwner {
        _beaconAddress.notZeroAddress();

        emit BeaconAddressUpdated(beaconAddress, _beaconAddress);
        beaconAddress = _beaconAddress;
    }

    /**
    * @notice Set the whitelist status for an address (add or remove)
    * @param _address The address for which to set the status
    * @param _status The status to set (true to add, false to remove)
    */
    function setWhitelistStatus(address _address, bool _status) public onlyOwner {
        _address.notZeroAddress();
        
        whitelist[_address] = _status;
        emit WhitelistStatusUpdated(_address, _status);
    }

    /**
     * @notice Creates a new project using the BeaconProxy pattern
     * @param _amount The amount of funding pool
     * @param _name The name of the project
     * @param _tokenName The name of the token
     * @param _tokenSymbol The symbol of the token
     * @return projectAddress The address of the newly created project
     */
    function createProject(
        uint256 _amount,
        string memory _name,
        string memory _tokenName,
        string memory _tokenSymbol
    ) public onlyWhitelisted returns (address) {
        // Validate the parameters
        _amount.notZeroAmount();
        _name.notZeroString();
        _tokenName.notZeroString();
        _tokenSymbol.notZeroString();

        totalProjects++;

        // Create a new BeaconProxy instance using the beacon address
        BeaconProxy project = new BeaconProxy(beaconAddress, "");
        BeaconSFP(payable(address(project))).initialize(
            _amount,
            _name,
            _tokenName,
            _tokenSymbol,
            msg.sender
        );

        // Store the project information in the projects mapping
        projects[msg.sender].push(
            Project(
                _amount,
                block.timestamp,
                _name,
                _tokenName,
                _tokenSymbol, 
                address(project)
            )
        );

        emit ProjectCreated(
            _amount,
            _name,
            _tokenName,
            _tokenSymbol,
            msg.sender,
            address(project));

        return address(project);
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