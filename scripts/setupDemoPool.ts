import { ethers } from "hardhat";
import fs from "fs";
import * as path from "path";

/**
 * @notice All variables used:
 * @param projectAmount - Amount for the project
 * @param projectName - Name of the project
 * @param tokenNameForPool - Name of the pool token
 * @param tokenSymbolForPool - Symbol of the pool token
 * @param amount - Amount of tokens
 * @param contributeAmount - Amount to contribute
 */
const projectAmount = ethers.parseEther("1000");
const projectName = "Demo Pool";
const tokenNameForPool = "DemoToken";
const tokenSymbolForPool = "DEMO";
const amount = ethers.parseEther("2000");
const contributeAmount  = amount/2n

/**
 * @notice Script for configuring a demo project pool (creation, replenishment).
 *  Script performs a sequence of actions to create and replenish a pool through a deployed Factory
 * 
 * @dev Runs by command: 
 *  - npx hardhat run scripts/setupDemoPool.ts --network <network-name>;
 *  Requires the deployment-addresses.json file from the previous deployment
 */
async function main() {
    console.log("\nSTART..");
    console.log("-".repeat(40));
    const [signer] = await ethers.getSigners();
    console.log(`Account: ${signer.address}`);

    // Get addresses of the `deployed` smart contracts
    const addressesSFPPath = path.join(__dirname, '../deployment-addresses.json');

    // Check if the file exists
    if (!fs.existsSync(addressesSFPPath)) {
        console.error("Error: file `deployment-addresses.json` not found");
        process.exit(1);
    }

    // Reading and parsing data from a file
    const deploymentAddresses = JSON.parse(fs.readFileSync(addressesSFPPath, 'utf8'));

    // Get the `contracts` addresses
    const factoryAddress = deploymentAddresses.factory;
    const tokenAddress = deploymentAddresses.token;

    if (!factoryAddress) {
        console.error("Error: Address factory not found in file `deployment-addresses.json`");
        process.exit(1);
    }

    if (!tokenAddress) {
        console.error("Error: Address token not found in file `deployment-addresses.json`");
        process.exit(1);
    }
    
    const factory = await ethers.getContractAt(
        "FactorySFP",
        factoryAddress,
        signer as unknown as import("ethers").Signer
    );

    const token = await ethers.getContractAt(
        "Token",
        tokenAddress,
        signer as unknown as import("ethers").Signer
    );

    /**
     * @notice Step 1: whitelist in the factory
     */
    await whitelist(signer, factory);

    /**
     * @notice Step 2: Create a project pool
     */
    await createProject(
        factory,
        factoryAddress,
        deploymentAddresses,
        addressesSFPPath
    );

    /**
     * @notice Step 3: Minting tokens for the signer
     */
    await mintTokens(signer, token);

    /**
     * @notice Step 4: Approving project pool as spender for tokens
     */
    const projectPoolAddress = deploymentAddresses.latestProjectPool;
    await approveFactory(signer, token, projectPoolAddress);

    /**
     * Step 5: Send tokens to the project pool
     */
    await contributeProject(signer, tokenAddress, projectPoolAddress);

    console.log("\n" + "=".repeat(40));
    console.log("Script setupDemoPool completed successfully!");
    console.log("=".repeat(40));
    console.log(`\nDemo Pool Address: ${deploymentAddresses.latestProjectPool}`);
    console.log(`Contributor Account: ${signer.address}`);
    console.log(`Contributed Amount: ${ethers.formatEther(contributeAmount)} tokens`);
    console.log("\n" + "-".repeat(40));
}

/**
 * @notice Add to the whitelist
 */
async function whitelist(signer: any, factory: any) {
    try {
        console.log(`\nSTEP 1:`);
        const whitelistTx = await factory.connect(signer).setWhitelistStatus(signer.address, true);
        await whitelistTx.wait();
        console.log(`Whitelist: ${signer.address}`);
    } catch (error) {
        console.error(`Error in Step 1:`, error);
        process.exit(1);
    }
}

/**
 * @notice Create a project pool
 */
async function createProject(
    factory: any,
    factoryAddress: string,
    deploymentAddresses: any,
    addressesSFPPath: any
) {
    try {
        console.log(`\nSTEP 2:`);

        // Викликаємо функцію createProject на екземплярі Фабрики
        const tx = await factory.createProject(
            projectAmount,
            projectName,
            tokenNameForPool,
            tokenSymbolForPool
        );
        console.log(`Transaction sent. Hash: ${tx.hash}`);

        const receipt = await tx.wait();

        let projectAddress: string | undefined;
        let projectCreatedLog: any;

        // Filter the logs in the transaction receipt by our Factory address
        const factoryLogs = receipt?.logs?.filter((log: any) =>
            (log as any).address.toLowerCase() === factoryAddress.toLowerCase()
        );

        // Go through the filtered logs and try to parse the ProjectCreated event
        if (factoryLogs && factoryLogs.length > 0) {
            for (const log of factoryLogs) {
                try {
                    // Parse the log
                    const parsedLog = factory.interface.parseLog(log as any);

                    // Check the ProjectCreated event
                    if (parsedLog && parsedLog.name === 'ProjectCreated') {
                        projectCreatedLog = parsedLog;
                        break;
                    }
                } catch (e) {
                    console.warn((e as any).message);
                }
            }
        }

        // Check if the ProjectCreated event log was found
        if (projectCreatedLog) {
            try {
                projectAddress = projectCreatedLog.args[5];

                if (projectAddress && projectAddress !== ethers.ZeroAddress) {
                    console.log(`New project have the address: ${projectAddress}`);
                } else {
                    console.error("Warning: ProjectCreated event found, but pool address not found");
                    process.exit(1);
                }

            } catch (e) {
                console.error("Error extracting address from parsed ProjectCreated event log:", e);
                process.exit(1);
            }
        } else {
            console.error("Error: ProjectCreated event log not found in transaction receipt");
            process.exit(1);
        }

        // Add the created pool address
        if (projectAddress && projectAddress !== ethers.ZeroAddress) {
            deploymentAddresses.latestProjectPool = projectAddress;

            fs.writeFileSync(addressesSFPPath, JSON.stringify(deploymentAddresses, null, 2));
        }
    } catch (error) {
        console.error(`Error in Step 2:`, error);
        process.exit(1);
    }
}

/**
 * @notice Mint the tokens
 */
async function mintTokens(signer: any, token:any) {
    try {
        console.log(`\nSTEP 3:`);
        const txMint = await token.mint(signer.address, amount);
        await txMint.wait();
        console.log(`Mint ${ethers.formatEther(amount)} tokens for ${signer.address} address`);
    } catch (error) {
        console.error(`Error in Step 3:`, error);
        process.exit(1);
    }
    
}

/**
 * @notice Approving project pool
 */
async function approveFactory(
    signer: any,
    token: any,
    projectPoolAddress: string
) {
    try{
        console.log(`\nSTEP 4:`);
        // Check address of the `project-pool`
        if (!projectPoolAddress || projectPoolAddress === ethers.ZeroAddress) {
            console.error("Error: Project pool address not found");
            process.exit(1);
        }

        const approveTx = await token.approve(projectPoolAddress, amount*2n);
        await approveTx.wait();
        console.log(`Approve amount: ${ethers.formatEther(amount*2n)} for address: ${signer.address}`)
    } catch (error) {
        console.error(`Error in Step 4:`, error);
        process.exit(1);
    }
}

/**
 * @notice Send tokens to the project pool
 */
async function contributeProject(
    signer: any,
    tokenAddress: string,
    projectPoolAddress: string
) {
    try {
        console.log(`\nSTEP 5:`);
        const projectPool = await ethers.getContractAt(
            "BeaconSFP",
            projectPoolAddress,
            signer as unknown as import("ethers").Signer
        );

        const contributeTx = await projectPool.contributeERC20(
            tokenAddress,
            contributeAmount
        );
        await contributeTx.wait();
        console.log(`Send tokens to project-pool: ${projectPoolAddress}`)
        console.log("-".repeat(40));
        
    } catch (error) {
        console.error(`Error in Step 5:`, error);
        process.exit(1);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });