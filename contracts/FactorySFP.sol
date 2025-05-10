// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/proxy/beacon/BeaconProxy.sol";
import "./BeaconSFP.sol";
// import "hardhat/console.sol";

/**
 * @title Factory of Student Funding Platform
 * @notice Contract is used to create and manage student funding projects
 * @author CTAPCKPIM
 */
contract FactorySFP is Initializable, OwnableUpgradeable {
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
    event ProjectCreated(
        uint256 _amount,
        string _name,
        string _tokenName,
        string _tokenSymbol,
        address indexed _owner,
        address indexed _address
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
     * @notice Ckeck for zero string
     */
    modifier notZeroString(string memory _string) {
        require(bytes(_string).length > 0, "Zero string not allowed");
        _;
    }

    /**
     * @notice Check if the address is whitelisted
     */
    modifier onlyWhitelisted() {
        require(whitelist[msg.sender], "Not whitelisted");
        _;
    }

    /**
     * @notice Initializes the factory
     * @param _beaconAddress The address of the beacon contract
     */
    function initialize(address _beaconAddress) public initializer notZeroAddress(_beaconAddress) {
        __Ownable_init(msg.sender);
        beaconAddress = _beaconAddress;
    }

    /**
     * @notice Change the beacon address
     * @param _beaconAddress The address of the beacon contract
     */
    function changeBeaconAddress(address _beaconAddress) public onlyOwner notZeroAddress(_beaconAddress) {
        emit BeaconAddressUpdated(beaconAddress, _beaconAddress);
        beaconAddress = _beaconAddress;
    }

    /**
    * @notice Set the whitelist status for an address (add or remove)
    * @param _address The address for which to set the status
    * @param _status The status to set (true to add, false to remove)
    */
    function setWhitelistStatus(address _address, bool _status) public onlyOwner notZeroAddress(_address) {
        whitelist[_address] = _status;
        emit WhitelistStatusUpdated(_address, _status);
    }

    /**
     * TODO: Finish the function after write BeaconSFP contract
     *
     * @notice Creates a new project using the BeaconProxy pattern
     * @return projectAddress The address of the newly created project
     */
    function createProject(
        uint256 _amount,
        string memory _name,
        string memory _tokenName,
        string memory _tokenSymbol
    ) public 
    onlyWhitelisted
    notZeroAmount(_amount)
    notZeroString(_name)
    notZeroString(_tokenName)
    notZeroString(_tokenSymbol)
    returns (address) {
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