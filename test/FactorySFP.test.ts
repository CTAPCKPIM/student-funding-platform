import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";

import { deployFixture, settingsFixture, ZERO_ADDRESS, AMOUNT } from "./Fixtures";

describe("FactorySFP", function () {
    describe("Deployment", function () {
        it("Should revert if re-initialization is attempted", async function () {
            const { factory, beaconAddress} = await loadFixture(deployFixture);

            await expect(
                factory.initialize(beaconAddress)
            ).to.be.revertedWithCustomError(
                factory,
                "InvalidInitialization"
            );
        });

        it("Should set the right owner", async function () {
            const { factory, owner } = await loadFixture(deployFixture);

            expect(await factory.owner()).to.equal(owner.address);
        });

        it("Should set the right beacon address", async function () {
            const { factory, beaconAddress } = await loadFixture(deployFixture);

            expect(await factory.beaconAddress()).to.equal(beaconAddress);
        });
    });

    // Tests for the changeBeaconAddress();
    describe("changeBeaconAddress()", function () {
        it("Only the owner can change beacon address", async function () {
            const { factory, addr1 } = await loadFixture(deployFixture);

            await expect(
                factory.connect(addr1).changeBeaconAddress(addr1.address)
            ).to.be.revertedWithCustomError(
                factory,
                "OwnableUnauthorizedAccount"
            );
        });

        it("Should revert if the address is zero", async function () {
            const { factory } = await loadFixture(deployFixture);

            await expect(factory.changeBeaconAddress(
                ZERO_ADDRESS
            )).to.be.revertedWithCustomError(
                factory,
                "ZeroAddressError"
            );
        });

        it("Should change the beacon address", async function () {
            const { factory, owner, addr1 } = await loadFixture(deployFixture);

            await factory.connect(owner).changeBeaconAddress(addr1.address);
            expect(await factory.beaconAddress()).to.equal(addr1.address);
        });

        it("Should emit BeaconAddressChanged event", async function () {
            const { factory, addr1, beaconAddress } = await loadFixture(deployFixture);

            await expect(factory.changeBeaconAddress(addr1.address))
                .to.emit(factory, "BeaconAddressChanged")
                .withArgs(beaconAddress, addr1.address);
        });
    });

    // Tests for the setWhitelistStatus(); 
    describe("setWhitelistStatus()", function () {
        it("Only the owner can set whitelist status", async function () {
            const { factory, addr1 } = await loadFixture(deployFixture);

            await expect(
                factory.connect(addr1).setWhitelistStatus(addr1.address, true)
            ).to.be.revertedWithCustomError(
                factory,
                "OwnableUnauthorizedAccount"
            );
        });

        it("Should revert if the address is zero", async function () {
            const { factory } = await loadFixture(deployFixture);

            await expect(factory.setWhitelistStatus(ZERO_ADDRESS, true)).to.be.revertedWithCustomError(
                factory,
                "ZeroAddressError"
            );
        });

        it("Should set the whitelist status", async function () {
            const { factory, addr1 } = await loadFixture(deployFixture);

            await factory.setWhitelistStatus(addr1.address, true);
            expect(await factory.whitelist(addr1.address)).to.equal(true);
        });

        it("Should update the whitelist status", async function () {
            const { factory, addr1 } = await loadFixture(deployFixture);

            await factory.setWhitelistStatus(addr1.address, true);
            expect(await factory.whitelist(addr1.address)).to.equal(true);

            await factory.setWhitelistStatus(addr1.address, false);
            expect(await factory.whitelist(addr1.address)).to.equal(false);
        });

        it("Should emit WhitelistStatusUpdated event", async function () {
            const { factory, addr1 } = await loadFixture(deployFixture);

            await expect(factory.setWhitelistStatus(addr1.address, true))
                .to.emit(factory, "WhitelistStatusUpdated")
                .withArgs(addr1.address, true);
        });
    });

    // Tests for the createProject();
    describe("createProject()", function () {
        it("Only whitelisted accounts can create projects", async function () {
            const { factory, addr1 } = await loadFixture(deployFixture);

            // Attempt to create a project without being whitelisted
            await expect(
                factory.connect(addr1).createProject(
                    1000,           // 1000 tokens amount
                    "Test Project", // Project name
                    "TT",           // Project tokens symbol
                    "Test Token"    // Project token name
                )
            ).to.be.revertedWithCustomError(
                factory,
                "NotWhitelistedError"
            );
        });

        it("Should revert if the amount is zero", async function () {
            const { factory, owner } = await loadFixture(deployFixture);

            // Whitelist the owner
            await factory.setWhitelistStatus(owner.address, true);

            // Attempt to create a project with a zero amount
            await expect(
                factory.connect(owner).createProject(
                    0,              // 0 tokens amount
                    "Test Project", // Project name
                    "TT",           // Project tokens symbol
                    "Test Token"    // Project token name
                )
            ).to.be.revertedWithCustomError(
                factory,
                "ZeroAmountError"
            );
        });

        it("Should revert if the name is empty", async function () {
            const { factory, owner } = await loadFixture(deployFixture);

            // Whitelist the owner
            await factory.setWhitelistStatus(owner.address, true);

            // Attempt to create a project with an empty name
            await expect(
                factory.connect(owner).createProject(
                    1000,           // 1000 tokens amount
                    "",             // Project name
                    "TT",           // Project tokens symbol
                    "Test Token"    // Project token name
                )
            ).to.be.revertedWithCustomError(
                factory,
                "EmptyStringError"
            );
        });

        it("Should revert if the symbol is empty", async function () {
            const { factory, owner } = await loadFixture(deployFixture);

            // Whitelist the owner
            await factory.setWhitelistStatus(owner.address, true);

            // Attempt to create a project with an empty symbol
            await expect(
                factory.connect(owner).createProject(
                    1000,           // 1000 tokens amount
                    "Test Project", // Project name
                    "",             // Project tokens symbol
                    "Test Token"    // Project token name
                )
            ).to.be.revertedWithCustomError(
                factory,
                "EmptyStringError"
            );
        });

        it("Should revert if the token name is empty", async function () {
            const { factory, owner } = await loadFixture(deployFixture);

            // Whitelist the owner
            await factory.setWhitelistStatus(owner.address, true);

            // Attempt to create a project with a name that is too long
            await expect(
                factory.connect(owner).createProject(
                    1000,           // 1000 tokens amount
                    "Test Project", // Project name
                    "TT",           // Project tokens symbol
                    ""              // Project token name
                )
            ).to.be.revertedWithCustomError(
                factory,
                "EmptyStringError"
            );
        });

        it("Should create a project", async function () {
            const { factory, owner } = await loadFixture(deployFixture);

            // Whitelist the owner
            await factory.setWhitelistStatus(owner.address, true);

            // Create a project
            await factory.connect(owner).createProject(
                1000,           // 1000 tokens amount
                "Test Project", // Project name
                "TT",           // Project tokens symbol
                "Test Token"    // Project token name
            );

            const projectAddress = await factory.projects(owner.address, 0);
            expect(projectAddress).to.not.eq(ZERO_ADDRESS);
        });

        it("Should emit ProjectCreated event", async function () {
            const { factory, owner } = await loadFixture(deployFixture);

            // Whitelist the owner
            await factory.setWhitelistStatus(owner.address, true);

            // Create a project
            await expect(
                factory.connect(owner).createProject(
                    1000,           // 1000 tokens amount
                    "Test Project", // Project name
                    "TT",           // Project tokens symbol
                    "Test Token"    // Project token name
                )
            ).to.emit(factory, "ProjectCreated")
                .withArgs(
                    1000,           // Amount of tokens
                    "Test Project", // Project name
                    "TT",           // Project token symbol
                    "Test Token",   // Project token name
                    owner.address,  // Owner address
                    anyValue
                );
        });
    });

    // Tests for the withdrawStuckTokens();
    describe("withdrawStuckTokens()", function () {
        it("Only the owner can withdraw stuck tokens", async function () {
            const { factory, addr1 } = await loadFixture(settingsFixture);

            // Attempt to withdraw stuck tokens without being the owner
            await expect(
                factory.connect(addr1).withdrawStuckTokens(addr1.address, AMOUNT)
            ).to.be.revertedWithCustomError(
                factory,
                "OwnableUnauthorizedAccount"
            );
        });

        it("Should revert if the address is zero", async function () {
            const { factory } = await loadFixture(settingsFixture);

            // Attempt to withdraw stuck tokens with a zero address
            await expect(
                factory.withdrawStuckTokens(ZERO_ADDRESS, AMOUNT)
            ).to.be.revertedWithCustomError(
                factory,
                "ZeroAddressError"
            );
        });

        it("Should revert if the amount is zero", async function () {
            const { factory, tokenAddress } = await loadFixture(settingsFixture);

            // Attempt to withdraw stuck tokens with a zero amount
            await expect(
                factory.withdrawStuckTokens(tokenAddress, 0)
            ).to.be.revertedWithCustomError(
                factory,
                "ZeroAmountError"
            );
        });

        it("Should revert if the amount is greater than the balance", async function () {
            const { factory, tokenAddress } = await loadFixture(settingsFixture);

            // Attempt to withdraw stuck tokens with an amount greater than the balance
            await expect(
                factory.withdrawStuckTokens(tokenAddress, AMOUNT * 2n)
            ).to.be.revertedWithCustomError(
                factory,
                "AmountExceedsError"
            );
        });

        it("Should withdraw stuck tokens", async function () {
            const { factory, token, factoryAddress, tokenAddress } = await loadFixture(settingsFixture);

            // Withdraw the stuck tokens
            await factory.withdrawStuckTokens(tokenAddress, AMOUNT);

            // Check the balance of the factory
            const balance = await token.balanceOf(factoryAddress);
            const ownerBalance = await token.balanceOf(factory.owner());

            expect(balance).to.equal(0);
            expect(ownerBalance).to.equal(AMOUNT*2n);
        });

        it("Should emit StuckTokensWithdrawn event", async function () {
            const { factory, tokenAddress } = await loadFixture(settingsFixture);

            // Withdraw the stuck tokens
            await expect(
                factory.withdrawStuckTokens(tokenAddress, AMOUNT)
            ).to.emit(factory, "StuckTokensWithdrawn")
                .withArgs(tokenAddress, AMOUNT);
        });
    });

    // Test for the fallback();
    describe("fallback()", function () {
        it("Should revert when called with Ether and arbitrary data", async function () {
            const { factory, owner } = await loadFixture(deployFixture);

            await expect(
                owner.sendTransaction({
                    to: await factory.getAddress(),
                    value: AMOUNT / 10n,
                    data: "0x1234567890"
                })
            ).to.be.revertedWithCustomError(
                factory,
                "FunctionCallError"
            );
        });
    });

    // Test for the receive();
    describe("receive()", function () {
        it("Should revert when receiving native currency without data", async function () {
             const { factory, owner } = await loadFixture(deployFixture);

            await expect(
                owner.sendTransaction({
                    to: await factory.getAddress(),
                    value: AMOUNT / 10n,
                    data: "0x"
                })
            ).to.be.revertedWithCustomError(
                factory,
                "FunctionCallError"
            );
        });
    });
});


