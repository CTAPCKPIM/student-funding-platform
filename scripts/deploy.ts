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

  // Deploy the `beacon` contract
  console.log("Deploying the Beacon contract...");
  const beaconAddress = await deployContract("BeaconSFP", [], true);
  console.log(`Beacon contract deployed at: ${beaconAddress}`);

  // Deploy the proxy `factory` contract
  console.log("Deploying Factory SFP Proxy...");
  const factoryAddress = await deployContract("FactorySFP", [ beaconAddress ]);
  console.log(`Factory SFP Proxy deployed at: ${factoryAddress}`);

  // Deploy the proxy `token` contract
  console.log("Deploying the token...");
  const tokenAddress = await deployContract("Token", [ tokenName, tokenSymbol ]);
  console.log(`Token deployed at: ${tokenAddress}`);


  // Control logs after deployment
  console.log(
    "-".repeat(40) +
    "\nDeployment process complete!" +
    "\n" + "-".repeat(40)
  );
  console.log(
    `FACTORY address: ${factoryAddress}
    \nBEACON address: ${beaconAddress}
    \nTOKEN address: ${tokenAddress}\n` +
    "-".repeat(40));

  fs.writeFileSync('deployment-addresses.json', JSON.stringify({
    factory: factoryAddress,
    beacon: beaconAddress,
    token: tokenAddress
  }, null, 2));
  console.log("The addresses of deployed contracts are stored in deployment-addresses.json");
}

/**
 * @notice Help deploy the contracts
 * @param contractName - Name of the contract
 * @param args - Arguments for the contract initialization
 * @param isBeacon - Boolean to check if the contract is a beacon
 */
async function deployContract(
    contractName: string,
    args: any[] = [],
    isBeacon: boolean = false
) : Promise<string> {
  const Contract = await ethers.getContractFactory(contractName);
  let address;

  // Check if the contract is a beacon or a proxy contract
  if (isBeacon) {
    const beacon = await upgrades.deployBeacon(Contract);

    await beacon.waitForDeployment();
    address = await  beacon.getAddress();
  } else {
    const contract = await upgrades.deployProxy(Contract, args);

    await contract.waitForDeployment();
    address = await contract.getAddress();
  }

  return address;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });