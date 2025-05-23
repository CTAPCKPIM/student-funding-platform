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
export const NAME = "Ukraine University";
export const SYMBOL = "UU";

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
 * @notice Get the deployed Token contract
 * @param initialized - boolean to check if the token is deployed and initialized
 */
export const tokenFixture = async ( initialized: boolean = false ) => {
    const { owner, addr1, token, tokenAddress, ...rest } = await deployFixture();
    const Beacon = await ethers.getContractFactory("BeaconSFP");
    const beaconMock = await Beacon.deploy();

    await beaconMock.waitForDeployment();
    const beaconMockAddress = await beaconMock.getAddress();

    // Init the beaconMock contract, approval and mint tokens
    if ( initialized ) {
        await beaconMock.initialize(
                AMOUNT,
                NAME,
                NAME,
                SYMBOL,
                owner.address
            );
        await token.connect(addr1).approve(beaconMockAddress, AMOUNT);
        await token.connect(owner).mint(addr1.address, AMOUNT);
        await token.connect(owner).mint(beaconMockAddress, AMOUNT);
        await beaconMock.connect(owner).mint(owner.address, AMOUNT);
    }

    return {
        token,
        beaconMock,
        beaconMockAddress,
        tokenAddress,
        owner,
        addr1,
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

    // Mint the token to FactorySFP, owner and addr1
    await token.connect(owner).mint(factoryAddress, AMOUNT);
    await token.connect(owner).mint(owner.address, AMOUNT);

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
