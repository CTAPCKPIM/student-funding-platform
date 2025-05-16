# Student Funding Platform

![Code Coverage](https://img.shields.io/badge/coverage-100%25-brightgreen) ![License](https://img.shields.io/badge/License-MIT-blue.svg)

### Student Funding Platform (SFP)
This is a decentralized platform solution for creating and managing decentralized funding pools for educational initiatives. The platform supports user whitelisting, creating upgradeable pools based on the Beacon Proxy pattern, and accepting contributions in specified ERC20/Native tokens.

#### Contracts Deployed on Sepolia

Below are the addresses of the key smart contracts of the project, deployed on the Sepolia testnet. You can view their verified source code on Etherscan via the links:

* **FactorySFP Proxy**: [0xF6f3a0e656Ef35e43cCD2cA88bb4f8412Cb6653e](https://sepolia.etherscan.io/address/0xF6f3a0e656Ef35e43cCD2cA88bb4f8412Cb6653e)
* **Beacon**: [0xd4E0569809010C5D0bD4C3b3a5aA1c77Ee895e7A](https://sepolia.etherscan.io/address/0xd4E0569809010C5D0bD4C3b3a5aA1c77Ee895e7A)
* **Token Proxy**: [0x905990A8CAF6399DE34FA8A1E80A6a88fF3de402](https://sepolia.etherscan.io/address/0x905990A8CAF6399DE34FA8A1E80A6a88fF3de402)

> *Note: The FactorySFP contract creates new project pools as instances of Beacon Proxy. Each pool has a unique address. The address of the demo pool created by the `setupDemoPool.ts` script is here: [0x4787EB6782943a0d420B83436ceECD77B9E2F207](https://sepolia.etherscan.io/address/0x4787EB6782943a0d420B83436ceECD77B9E2F207)*

## Features

* **Whitelisting System**: Ability to add/remove addresses that have the right to create projects.
* **Creation of Project-Funding Pools**: Whitelisted users can create new pools with a specified fundraising goal _(amount, project name, pool token name/symbol)_.
* **Usage of Beacon Proxy Pattern**: Pools are created as proxies that point to a single logic _(implementation)_ via a beacon.
* **Contract Upgradeability**: Thanks to the Beacon Proxy pattern, the logic of the pools can be updated.
* **Contributions in ERC20 tokens**: Ability to fund pools using a specific ERC20 token.
* **Contributions in Native tokens**: Ability to fund pools using the native network token.

## Technologies Used

| Technology                | Description                                                                     |
|---------------------------|---------------------------------------------------------------------------------|
| **Solidity** | Programming language for writing smart contracts.                               |
| **Hardhat** | Development, testing, deployment, and debugging framework for smart contracts.    |
| **Ethers.js** | Library for interacting with the Ethereum blockchain and smart contracts.         |
| **OpenZeppelin Contracts**| Library of standard, secure, and audited smart contracts.                       |
| **OpenZeppelin Hardhat Upgrades**| Plugin for Hardhat that simplifies deploying and managing upgradeable contracts.|
| **Hardhat Etherscan** | Plugin for Hardhat allowing contract verification on Block Explorers.             |
| **Node.js and npm** | JavaScript runtime environment and package manager.                             |

## Setup

To run the project locally or prepare it for deployment, follow these steps:

1.  **Clone the repository:**
    Open your terminal and execute the command to clone your repository from GitHub:
    ```bash
    git clone <URL_of_your_GitHub_repository>
    ```
    Navigate into the project directory:
    ```bash
    cd <project_directory_name> # Usually the name of your repository
    ```

2.  **Install dependencies:**
    Install the necessary Node.js packages listed in `package.json`:
    ```bash
    npm install
    # Or, if you are using Yarn
    # yarn install
    ```

3.  **Configure environment variables:**
    Create a `.env` file in the root directory of the project by copying the content from the `.env.example` file. Provide the required data:
    * `PRIVATE_KEY`: Private key of the account for deployment and signing transactions.
    * `SEPOLIA_RPC_URL`: RPC URL for the Sepolia network (e.g., from Infura or Alchemy).
    * `ETHERSCAN_API_KEY`: API key from Etherscan for contract verification (needed for verification on Sepolia).

    Example `.env` file structure:
    ```env
    PRIVATE_KEY="0x..."
    SEPOLIA_RPC_URL="[https://sepolia.infura.io/v3/](https://sepolia.infura.io/v3/)..."
    ETHERSCAN_API_KEY="YourEtherscanApiKey"
    ```

## Deployment

Before deploying, ensure you have followed all steps in the [Setup](#setup) section and configured environment variables in the `.env` file.

1.  **Compile contracts:**
    Compile the smart contracts to generate ABI and bytecode:
    ```bash
    npx hardhat compile
    # Or, if you are using a script in package.json
    # npm run build
    ```

2.  **Deploy to Hardhat local network (`localhost`):**
    * Start the Hardhat local test network in the first terminal:
        ```bash
        npx hardhat node
        ```
    * Open a second terminal, navigate to the project directory, and deploy the contracts by running the deployment script:
        ```bash
        npx hardhat run scripts/deploy.ts --network localhost
        # Or, if you added a script in package.json
        # npm run deploy:localhost
        ```

3.  **Deploy to Sepolia network:**
    * Ensure that the account whose private key is specified in your `.env` file has enough Sepolia ETH for gas fees.
    * Deploy the contracts by running the deployment script, specifying the `sepolia` network:
        ```bash
        npx hardhat run scripts/deploy.ts --network sepolia
        # Or, if you added a script in package.json
        # npm run deploy:sepolia
        ```

After successful deployment on any network, the addresses of the deployed contracts _(Factory, Beacon, Token)_ will be automatically saved in the `deployment-addresses.json` file in the root directory of the project. This file is used by other scripts to interact with the contracts.

## Contract Verification (Sepolia)

Verifying smart contracts on Block Explorers _(e.g., [Sepolia Etherscan](https://sepolia.etherscan.io/))_ makes their source code public and verified. This increases trust in your project and allows other users to interact with the contracts via the explorer's web interface.

**Ensure:**

* Your `.env` file contains the correct `ETHERSCAN_API_KEY`.
* Your `hardhat.config.ts` file is configured with the `hardhat-etherscan` plugin.
* You have successfully deployed the contracts on the Sepolia network, and the `deployment-addresses.json` file contains the current addresses.

Use the following commands to verify each contract. Replace the contract addresses with your actual addresses from the `deployment-addresses.json` file.

1.  **Verify Beacon:**
    This command verifies the Beacon contract and its BeaconSFP implementation.
    ```bash
    npx hardhat verify --network sepolia --contract contracts/BeaconSFP.sol:BeaconSFP <YOUR_BEACON_ADDRESS>
    ```

2.  **Verify Factory SFP Proxy:**
    This command verifies the Factory proxy and its FactorySFP implementation.
    ```bash
    npx hardhat verify --network sepolia --contract contracts/FactorySFP.sol:FactorySFP <YOUR_FACTORY_ADDRESS> <YOUR_BEACON_ADDRESS>
    ```

3.  **Verify Token Proxy:**
    This command verifies the Token proxy and its Token implementation.
    ```bash
    npx hardhat verify --network sepolia --contract contracts/token/Token.sol:Token <YOUR_TOKEN_ADDRESS>
    ```

4.  **Verify Project Pool Proxy:**
    This command verifies the project pool contract proxy. Note that the pool address is generated during the execution of the `setupDemoPool.ts` script.
    ```bash
    npx hardhat verify --network sepolia --contract contracts/BeaconSFP.sol:BeaconSFP <PROJECT_POOL_ADDRESS_FROM_SETUP_SCRIPT_OUTPUT> <YOUR_BEACON_ADDRESS> ""
    ```
    > *⚠️ Note: When verifying the pool proxy, you might see a "Bytecode does not match..." message. This is related to the nuances of verifying standard `BeaconProxy` code, but the important part is that the proxy will be successfully linked to the verified BeaconSFP implementation, allowing you to view the logic code via the "Read as Proxy" function on Etherscan.*

## Usage Demonstration (Setup Script)

After successfully deploying the contracts, you can run the `scripts/setupDemoPool.ts` script to demonstrate the platform's core functionality: user whitelisting, creation of a new project pool, minting of test tokens, approving them, and funding the created pool with these tokens.

**Ensure:**

* Contracts are successfully deployed on the selected network _(local or Sepolia)_, and the `deployment-addresses.json` file contains the current addresses.
* The account used by the script _(your `signer`)_ has enough native tokens _(ETH)_ to cover gas fees on the selected network.

Use the following commands to run the script:

* **Hardhat local network (`localhost`):**
    _(Ensure the Hardhat local node is running in a parallel terminal: `npx hardhat node`)_
    ```bash
    npx hardhat run scripts/setupDemoPool.ts --network localhost
    # Or, if you added a script in package.json
    # npm run setup:localhost
    ```

* **Sepolia network:**
    ```bash
    npx hardhat run scripts/setupDemoPool.ts --network sepolia
    # Or, if you added a script in package.json
    # npm run setup:sepolia
    ```

After successful execution, the script will print the address of the created demo pool and a summary of the actions performed.
