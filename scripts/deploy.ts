import { ethers, upgrades } from "hardhat";
import fs from 'fs';

/**
 * @notice All variables:
 * @param tokenName - Name of the token
 * @param tokenSymbol - Symbol of the token
 */
const tokenName = "Ukraine University";
const tokenSymbol = "UU";

async function main() {
  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("\n" + "-".repeat(40));
  console.log(`Deploying contracts from an account: ${deployer.address}`);

  // Get the contract factories
  const FactorySFP = await ethers.getContractFactory("FactorySFP");
  const BeaconSFP = await ethers.getContractFactory("BeaconSFP");
  const Token = await ethers.getContractFactory("Token");

  // Deploy the `beacon` contract
  console.log("Deploying the Beacon contract...");
  const beacon = await upgrades.deployBeacon(BeaconSFP);
  await beacon.waitForDeployment();
  const beaconAddress = await beacon.getAddress();
  console.log(`Beacon contract deployed at: ${beaconAddress}`);

  // Deploy the proxy `factory` contract
  console.log("Deploying Factory SFP Proxy...");
  const factory = await upgrades.deployProxy(FactorySFP, [ beaconAddress ]);
  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();
  console.log(`Factory SFP Proxy deployed at: ${factoryAddress}`);

  // Deploy the proxy `token` contract
  console.log("Deploying the token...");
  const token = await upgrades.deployProxy(Token, [ tokenName, tokenSymbol ]); 
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();
  console.log(`Token deployed at: ${tokenAddress}`);


  // Control logs after deployment
  console.log("-".repeat(40));
  console.log("\nDeployment process complete!");
  console.log("-".repeat(40));
  console.log(`Factory address: ${factoryAddress}`);
  console.log(`Beacon address: ${beaconAddress}`);
  console.log(`Token address: ${tokenAddress}`);
  console.log("-".repeat(40));

  fs.writeFileSync('deployment-addresses.json', JSON.stringify({
    factory: factoryAddress,
    beacon: beaconAddress,
    token: tokenAddress
  }, null, 2));
  console.log("The addresses of deployed contracts are stored in deployment-addresses.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });