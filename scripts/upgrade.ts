import { ethers, upgrades } from "hardhat";
import fs from 'fs';
import * as path from 'path';

/**
 * @notice Upgrade the contracts of the SFP
 * NOTE: Need the `deployment-addresses.json` file
 */
async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("\n" + "-".repeat(40));
    console.log(`Updating contracts from an account: ${deployer.address}`);

    // Get addresses of the deployed smart contracts from `deployment-addresses.json`
    const addressesSFPPath = path.join(__dirname, '../deployment-addresses.json');

    // Check if the file exists
    if (!fs.existsSync(addressesSFPPath)) {
        console.error("Error: file `deployment-addresses.json` not found");
        console.error("Please run: npx hardhat run scripts/deploy.ts --network <network-name>");
        process.exit(1);
    }

    // Reading and parsing data from a file
    const deploymentAddresses = JSON.parse(fs.readFileSync(addressesSFPPath, 'utf8'));

    // Get the contracts addresses
    const beaconAddress = deploymentAddresses.beacon;
    const factoryAddress = deploymentAddresses.factory;
    const tokenAddress = deploymentAddresses.token;

    if (!beaconAddress && !factoryAddress && !tokenAddress) {
        console.error("Error: Addresses not found in file deployment-addresses.json");
        process.exit(1);
    }
    
    console.log("-".repeat(40) + 
        `\nBeacon address loaded: ${beaconAddress}
        \nFactory address loaded: ${factoryAddress}
        \nToken address loaded: ${tokenAddress}\n` +
        "-".repeat(40));

    await upgradeContract("BeaconSFP", beaconAddress, true);
    await upgradeContract("FactorySFP", factoryAddress);
    await upgradeContract("Token", tokenAddress);

    console.log("Update process complete!")
}

/**
 * @notice Help upgrade the contracts
 * @param contractName - Name of the contract
 * @param address - Address of the deployed contract V1
 * @param isBeacon - Boolean to check if the contract is a beacon
 */
async function upgradeContract(
    contractName: string,
    address: any = "",
    isBeacon: boolean = false
) {
    const ContractV2 = await ethers.getContractFactory(contractName);

    // Check if the contract is a beacon or a proxy contract
    if (isBeacon) {
        const beaconV2 = await upgrades.upgradeBeacon(address, ContractV2);;
        await beaconV2.waitForDeployment();
    } else {
        const contract = await upgrades.upgradeProxy(address, ContractV2);
        await contract.waitForDeployment();
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
