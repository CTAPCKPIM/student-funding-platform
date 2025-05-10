/**
 * @notice Write fixtures for the tests
 * @dev This file contains the fixtures for the tests
 */
import { ethers, upgrades } from "hardhat";

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

    // Deploy the BeaconSFP contract
    const beacon = await upgrades.deployBeacon(BeaconSFP);
    await beacon.waitForDeployment();
    const beaconAddress = await beacon.getAddress();

    // Deploy the FactorySFP contract
    const factory = await upgrades.deployProxy(FactorySFP, [ beaconAddress ]);
    await factory.waitForDeployment();
    const factoryAddress = await factory.getAddress();

    return {
        owner,
        factory,
        beacon,
        factoryAddress,
        beaconAddress,
        ...rest
    };
}
