/**
 * @notice Write fixtures for the tests
 * @dev This file contains the fixtures for the tests
 */
import { ethers, upgrades } from "hardhat";

/**
 * @notice All variables used in the tests
 */
export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
export const AMOUNT = ethers.parseEther("1000");

/**
 * @notice Get addresses of the signers
 */
export const getAddress = async () => {
    const [ owner, addr1, addr2 ] = await ethers.getSigners();

    return { owner, addr1, addr2 };
}

/**
 * @notice Get and deploy the contract with initial values
 */
export const deployFixture = async () => {
    const { owner, ...rest } = await getAddress();

    // Get contracts factories
    const FactorySFP = await ethers.getContractFactory("FactorySFP");
    const BeaconSFP = await ethers.getContractFactory("BeaconSFP");
    const Token = await ethers.getContractFactory("Token");

    // Deploy the BeaconSFP contract
    const beacon = await upgrades.deployBeacon(BeaconSFP);
    await beacon.waitForDeployment();
    const beaconAddress = await beacon.getAddress();

    // Deploy the FactorySFP contract
    const factory = await upgrades.deployProxy(FactorySFP, [ beaconAddress ]);
    await factory.waitForDeployment();
    const factoryAddress = await factory.getAddress();

    // Deploy the Token contract
    const token = await upgrades.deployProxy(Token, [ "Ukraine University", "UU" ]);
    await token.waitForDeployment();
    const tokenAddress = await token.getAddress();

    return {
        owner,
        factory,
        beacon,
        token,
        factoryAddress,
        beaconAddress,
        tokenAddress,
        ...rest
    };

}

/**
 * @notice Set and get settings contracts
 */
export const settingsFixture = async () => {
    const { owner, addr1, factory, factoryAddress, token, tokenAddress, ...rest } = await deployFixture();

    // Whitelist the adddress
    await factory.setWhitelistStatus(owner.address, true);
    await factory.setWhitelistStatus(addr1.address, true);

    // Mint the token to FactorySFP
    await token.connect(owner).mint(factoryAddress, AMOUNT);

    return {
        owner,
        addr1,
        factory,
        factoryAddress,
        token,
        tokenAddress,
        ...rest
    };
};
