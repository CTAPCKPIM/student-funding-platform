import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { ethers, upgrades } from "hardhat";
import { expect } from "chai";

import { deployFixture, settingsFixture, ZERO_ADDRESS, AMOUNT, NAME, SYMBOL } from "./Fixtures";

describe("Token", function () {
    describe("Deployment", function () {
        it("Should revert if re-initialization is attempted", async function () {
            const { token } = await loadFixture(deployFixture);

            await expect(
                token.initialize(NAME, SYMBOL)
            ).to.be.revertedWithCustomError(
                token,
                "InvalidInitialization"
            );
        });

        it("Should revert if the token is deployed with an empty name", async function () {
            const Token = await ethers.getContractFactory("Token");

            await expect(
                upgrades.deployProxy(Token, [ "", SYMBOL ])
            ).to.be.revertedWithCustomError(
                Token,
                "EmptyStringError"
            );
        });

        it("Should revert if the token is deployed with an empty symbol", async function () {
            const Token = await ethers.getContractFactory("Token");

            await expect(
                upgrades.deployProxy(Token, [ NAME, "" ])
            ).to.be.revertedWithCustomError(
                Token,
                "EmptyStringError"
            );
        });

        it("Should set the right owner", async function () {
            const { token, owner } = await loadFixture(deployFixture);
            expect(await token.owner()).to.equal(owner.address);
        });

        it("Should set the right name and symbol", async function () {
            const { token } = await loadFixture(deployFixture);

            expect(await token.name()).to.equal(NAME);
            expect(await token.symbol()).to.equal(SYMBOL);
        });
    });

    // Tests for the mint();
    describe("mint()", function () {
        it("Only the owner can mint tokens", async function () {
            const { token, addr1 } = await loadFixture(deployFixture);

            await expect(
                token.connect(addr1).mint(addr1.address, AMOUNT)
            ).to.be.revertedWithCustomError(
                token,
                "OwnableUnauthorizedAccount"
            );
        });

        it("Should revert if the recipient is the zero address", async function () {
            const { token } = await loadFixture(deployFixture);

            await expect(
                token.mint(ZERO_ADDRESS, AMOUNT)
            ).to.be.revertedWithCustomError(
                token,
                "ZeroAddressError"
            );
        });

        it("Should revert if the amount is zero", async function () {
            const { token, owner } = await loadFixture(deployFixture);

            await expect(
                token.connect(owner).mint(owner.address, 0)
            ).to.be.revertedWithCustomError(
                token,
                "ZeroAmountError"
            );
        });

        it("Should mint tokens to the recipient", async function () {
            const { token, owner, addr1 } = await loadFixture(deployFixture);

            await expect(
                token.connect(owner).mint(addr1.address, AMOUNT)
            ).to.emit(token, "Transfer")
            .withArgs(ZERO_ADDRESS, addr1.address, AMOUNT);

            expect(await token.balanceOf(addr1.address)).to.equal(AMOUNT);
        });

        it("Should emit Minted event", async function () {
            const { token, owner, addr1 } = await loadFixture(deployFixture);

            await expect(
                token.connect(owner).mint(addr1.address, AMOUNT)
            ).to.emit(token, "Minted")
            .withArgs(addr1.address, AMOUNT);
        });
    });

    // Tests for the burn();
    describe("burn()", function () {
        it("Only the owner can burn tokens", async function () {
            const { token, addr1 } = await loadFixture(deployFixture);

            await expect(
                token.connect(addr1).burn(addr1.address, AMOUNT)
            ).to.be.revertedWithCustomError(
                token,
                "OwnableUnauthorizedAccount"
            );
        });

        it("Should revert if the recipient is the zero address", async function () {
            const { token } = await loadFixture(deployFixture);

            await expect(
                token.burn(ZERO_ADDRESS, AMOUNT)
            ).to.be.revertedWithCustomError(
                token,
                "ZeroAddressError"
            );
        });

        it("Should revert if the amount is zero", async function () {
            const { token, owner } = await loadFixture(deployFixture);

            await expect(
                token.connect(owner).burn(owner.address, 0)
            ).to.be.revertedWithCustomError(
                token,
                "ZeroAmountError"
            );
        });

        it("Should burn tokens from the recipient", async function () {
            const { token, owner } = await loadFixture(settingsFixture);

            await expect(
                token.connect(owner).burn(owner.address, AMOUNT)
            ).to.emit(token, "Transfer")
            .withArgs(owner.address, ZERO_ADDRESS, AMOUNT);

            expect(await token.balanceOf(owner.address)).to.equal(0);
        });

        it("Should emit Burned event", async function () {
            const { token, owner } = await loadFixture(settingsFixture);

            await expect(
                token.connect(owner).burn(owner.address, AMOUNT)
            ).to.emit(token, "Burned")
            .withArgs(owner.address, AMOUNT);
        });
    });

    // Test for the fallback();
    describe("fallback()", function () {
        it("Should revert when called with Ether and arbitrary data", async function () {
            const { token, owner } = await loadFixture(deployFixture);

            await expect(
                owner.sendTransaction({
                    to: await token.getAddress(),
                    value: AMOUNT / 10n,
                    data: "0x1234567890"
                })
            ).to.be.revertedWithCustomError(
                token,
                "FunctionCallError"
            );
        });
    });

    // Test for the receive();
    describe("receive()", function () {
        it("Should revert when receiving native currency without data", async function () {
             const { token, owner } = await loadFixture(deployFixture);

            await expect(
                owner.sendTransaction({
                    to: await token.getAddress(),
                    value: AMOUNT / 10n,
                    data: "0x"
                })
            ).to.be.revertedWithCustomError(
                token,
                "FunctionCallError"
            );
        });
    });
});
