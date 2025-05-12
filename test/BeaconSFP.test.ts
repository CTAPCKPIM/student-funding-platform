import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";
import { tokenFixture, ZERO_ADDRESS, AMOUNT, NAME, SYMBOL } from "./Fixtures";

describe("BeaconSFP", function () {
    describe("Deployment", function () {
        it("Should revert if re-initialization of the Factory proxy is attempted", async function () {
            const { owner, beaconMock } = await tokenFixture(true);

            // Second initialization
            await expect(
                beaconMock.initialize(
                    AMOUNT,
                    NAME,
                    NAME,
                    SYMBOL,
                    owner.address
                )
            ).to.be.revertedWithCustomError(
                 beaconMock,
                 "InvalidInitialization"
            );
        });

        it("Should set the right owner", async function () {
            const { beacon, owner } = await tokenFixture(false);

            expect(await beacon.owner()).to.equal(owner.address);
        });

        it("Should revet if the beacon is deployed with a zero amount", async function () {
            const { owner, beaconMock } = await tokenFixture();

            // Init with 0 amount
            await expect(
                beaconMock.initialize(
                    0,
                    NAME,
                    NAME,
                    SYMBOL,
                    owner.address
                )
            ).to.be.revertedWithCustomError(
                beaconMock,
                "ZeroAmountError"
            );
        });

        it("Should revert if the beacon is deployed with an empty project name", async function () {
            const { owner, beaconMock } = await tokenFixture();

            // Init with empty project name
            await expect(
                beaconMock.initialize(
                    AMOUNT,
                    "",
                    NAME,
                    SYMBOL,
                    owner.address
                )
            ).to.be.revertedWithCustomError(
                beaconMock,
                "EmptyStringError"
            );
        });

        it("Should revert if the beacon is deployed with an empty token name", async function () {
            const { owner, beaconMock } = await tokenFixture();

            // Init with empty token name
            await expect(
                beaconMock.initialize(
                    AMOUNT,
                    NAME,
                    "",
                    SYMBOL,
                    owner.address
                )
            ).to.be.revertedWithCustomError(
                beaconMock,
                "EmptyStringError"
            );
        });

        it("Should revert if the beacon is deployed with an empty token symbol", async function () {
            const { owner, beaconMock } = await tokenFixture();

            // Init with empty token symbol
            await expect(
                beaconMock.initialize(
                    AMOUNT,
                    NAME,
                    NAME,
                    "",
                    owner.address
                )
            ).to.be.revertedWithCustomError(
                beaconMock,
                "EmptyStringError"
            );
        });

        it("Should revert if the beacon is deployed with a zero address as the owner", async function () {
            const { beaconMock } = await tokenFixture();

            // Init with zero address as the owner
            await expect(
                beaconMock.initialize(
                    AMOUNT,
                    NAME,
                    NAME,
                    SYMBOL,
                    ZERO_ADDRESS
                )
            ).to.be.revertedWithCustomError(
                beaconMock,
                "ZeroAddressError"
            );
        });
    });

    // Tests for the contributeNative();
    describe("contributeNative()", function () {
        it("Should revert if the contribution is zero amount", async function () {
            const { beaconMock } = await tokenFixture(true);

            // Contribute with 0 amount
            await expect(
                beaconMock.contributeNative({ value: 0 })
            ).to.be.revertedWithCustomError(
                beaconMock,
                "ZeroAmountError"
            );
        });

        it("Should revert if the contribution is greeting of contract amount", async function () {
            const { owner, beaconMock } = await tokenFixture();

            // Initialize the contract
            await beaconMock.initialize(
                AMOUNT/2n,
                NAME,
                NAME,
                SYMBOL,
                owner.address
            );

            // Contribute with greeting of contract amount
            await expect(
                beaconMock.contributeNative({ value: AMOUNT })
            ).to.be.revertedWithCustomError(
                beaconMock,
                "AmountExceedsLimitError"
            );
        });

        it("Should contribute native tokens to the contract", async function () {
            const { owner, addr1, beaconMock } = await tokenFixture(true);
            const oldBalance = await ethers.provider.getBalance(owner.address);

            // Contribute native tokens
            await expect(
                beaconMock.connect(addr1).contributeNative({ value: AMOUNT })
            ).to.emit(beaconMock, "ContributedNative")
             .withArgs(addr1.address, anyValue);

            const newBalance = await ethers.provider.getBalance(owner.address);

            // Compare the balances
            expect(newBalance).to.be.greaterThan(oldBalance);
            expect(newBalance - oldBalance).to.equal(AMOUNT);
        });

        it("Should emit ContributedNative event", async function () {
            const { addr1, beaconMock } = await tokenFixture(true);

            // Contribute native tokens
            await expect(
                beaconMock.connect(addr1).contributeNative({ value: AMOUNT })
            ).to.emit(beaconMock, "ContributedNative")
             .withArgs(addr1.address, anyValue);
        });
    });

    // Tests for the contributeERC20();
    describe("contributeERC20()", function () {
        it("Should revert if the contribution is zero amount", async function () {
            const { beaconMock, beaconMockAddress } = await tokenFixture(true);

            // Contribute with 0 amount
            await expect(
                beaconMock.contributeERC20(beaconMockAddress, 0)
            ).to.be.revertedWithCustomError(
                beaconMock,
                "ZeroAmountError"
            );
        });

        it("Should revert if the address of the token is zero", async function () {
            const { beaconMock } = await tokenFixture(true);

            // Contribute with zero address
            await expect(
                beaconMock.contributeERC20(ZERO_ADDRESS, AMOUNT)
            ).to.be.revertedWithCustomError(
                beaconMock,
                "ZeroAddressError"
            ); 
        });

        it("Should revert if the contribution is greeting of contract amount", async function () {
            const { owner, beaconMock, beaconMockAddress } = await tokenFixture();

            // Initialize the contract
            await beaconMock.initialize(
                AMOUNT/2n,
                NAME,
                NAME,
                SYMBOL,
                owner.address
            );

            // Contribute with greeting of contract amount
            await expect(
                beaconMock.contributeERC20(beaconMockAddress, AMOUNT)
            ).to.be.revertedWithCustomError(
                beaconMock,
                "AmountExceedsLimitError"
            );
        });

        it("Should revert if the contribution is not approved", async function () {
            const { owner, addr1, tokenAddress, beaconMock } = await tokenFixture();

            // Initialize the contract without approval
            await beaconMock.initialize(
                AMOUNT,
                NAME,
                NAME,
                SYMBOL,
                owner.address
            );

            // Contribute without approval
            await expect(
                beaconMock.connect(addr1).contributeERC20(tokenAddress, AMOUNT)
            ).to.be.revertedWithCustomError(
                beaconMock,
                "ERC20InsufficientAllowance"
            );
        });

        it("Should contribute tokens to the contract", async function () {
            const { token, owner, addr1, tokenAddress, beaconMock } = await tokenFixture(true);

            // Contribute tokens
            await expect(
                beaconMock.connect(addr1).contributeERC20(tokenAddress, AMOUNT)
            ).to.emit(beaconMock, "ContributedERC20")
             .withArgs(addr1.address, tokenAddress, AMOUNT);

            expect(await token.balanceOf(owner.address)).to.equal(AMOUNT);
        });

        it("Should emit ContributedToken event", async function () {
            const { addr1, tokenAddress, beaconMock } = await tokenFixture(true);

            // Contribute tokens
            await expect(
                beaconMock.connect(addr1).contributeERC20(tokenAddress, AMOUNT)
            ).to.emit(beaconMock, "ContributedERC20")
             .withArgs(addr1.address, tokenAddress, AMOUNT);
        });
    });

    // Tests for the withdrawStuckTokens();
    describe("withdrawStuckTokens()", function () {
        it("Only the owner can withdraw stuck tokens", async function () {
            const { beaconMock, addr1 } = await tokenFixture(true);

            // Attempt to withdraw stuck tokens without being the owner
            await expect(
                beaconMock.connect(addr1).withdrawStuckTokens(addr1.address, AMOUNT)
            ).to.be.revertedWithCustomError(
                beaconMock,
                "OwnableUnauthorizedAccount"
            );
        });

        it("Should revert if the address is zero", async function () {
            const { beaconMock } = await tokenFixture(true);

            // Attempt to withdraw stuck tokens with a zero address
            await expect(
                beaconMock.withdrawStuckTokens(ZERO_ADDRESS, AMOUNT)
            ).to.be.revertedWithCustomError(
                beaconMock,
                "ZeroAddressError"
            );
        });

        it("Should revert if the amount is zero", async function () {
            const { beaconMock, tokenAddress } = await tokenFixture(true);

            // Attempt to withdraw stuck tokens with a zero amount
            await expect(
                beaconMock.withdrawStuckTokens(tokenAddress, 0)
            ).to.be.revertedWithCustomError(
                beaconMock,
                "ZeroAmountError"
            );
        });

        it("Should revert if the amount is greater than the balance", async function () {
            const { beaconMock, tokenAddress } = await tokenFixture(true);

            // Attempt to withdraw stuck tokens with an amount greater than the balance
            await expect(
                beaconMock.withdrawStuckTokens(tokenAddress, AMOUNT * 2n)
            ).to.be.revertedWithCustomError(
                beaconMock,
                "AmountExceedsError"
            );
        });

        it("Should withdraw stuck tokens", async function () {
            const { beaconMock, token, factoryAddress, tokenAddress } = await tokenFixture(true);

            // Withdraw the stuck tokens
            await beaconMock.withdrawStuckTokens(tokenAddress, AMOUNT);

            // Check the balance
            const ownerBalance = await token.balanceOf(beaconMock.owner());

            expect(ownerBalance).to.equal(AMOUNT);
        });

        it("Should emit StuckTokensWithdrawn event", async function () {
            const { beaconMock, tokenAddress } = await tokenFixture(true);

            // Withdraw the stuck tokens
            await expect(
                beaconMock.withdrawStuckTokens(tokenAddress, AMOUNT)
            ).to.emit(beaconMock, "StuckTokensWithdrawn")
                .withArgs(tokenAddress, AMOUNT);
        });
    });

    // Tests for the mint();
    describe("mint()", function () {
        it("Only the owner can mint tokens", async function () {
            const { beaconMock, addr1 } = await tokenFixture(true);

            await expect(
                beaconMock.connect(addr1).mint(addr1.address, AMOUNT)
            ).to.be.revertedWithCustomError(
                beaconMock,
                "OwnableUnauthorizedAccount"
            );
        });

        it("Should revert if the recipient is the zero address", async function () {
            const { beaconMock } = await tokenFixture(true);

            await expect(
                beaconMock.mint(ZERO_ADDRESS, AMOUNT)
            ).to.be.revertedWithCustomError(
                beaconMock,
                "ZeroAddressError"
            );
        });

        it("Should revert if the amount is zero", async function () {
            const { owner, beaconMock } = await tokenFixture(true);

            await expect(
                beaconMock.mint(owner.address, 0)
            ).to.be.revertedWithCustomError(
                beaconMock,
                "ZeroAmountError"
            );
        });

        it("Should mint tokens to the recipient", async function () {
            const { owner, beaconMock } = await tokenFixture(true);

            await expect(
                beaconMock.connect(owner).mint(owner.address, AMOUNT)
            ).to.emit(beaconMock, "Transfer")
            .withArgs(ZERO_ADDRESS, owner.address, AMOUNT);

            expect(await beaconMock.balanceOf(owner.address)).to.equal(AMOUNT*2n);
        });

        it("Should emit Minted event", async function () {
            const { owner, beaconMock } = await tokenFixture(true);

            await expect(
                beaconMock.mint(owner.address, AMOUNT)
            ).to.emit(beaconMock, "Minted")
            .withArgs(owner.address, AMOUNT);
        });
    });

    // Tests for the burn();
    describe("burn()", function () {
        it("Only the owner can burn tokens", async function () {
            const { beaconMock, addr1 } = await tokenFixture(true);

            await expect(
                beaconMock.connect(addr1).burn(addr1.address, AMOUNT)
            ).to.be.revertedWithCustomError(
                beaconMock,
                "OwnableUnauthorizedAccount"
            );
        });

        it("Should revert if the recipient is the zero address", async function () {
            const { beaconMock } = await tokenFixture(true);

            await expect(
                beaconMock.burn(ZERO_ADDRESS, AMOUNT)
            ).to.be.revertedWithCustomError(
                beaconMock,
                "ZeroAddressError"
            );
        });

        it("Should revert if the amount is zero", async function () {
            const { beaconMock, owner } = await tokenFixture(true);

            await expect(
                beaconMock.connect(owner).burn(owner.address, 0)
            ).to.be.revertedWithCustomError(
                beaconMock,
                "ZeroAmountError"
            );
        });

        it("Should revert if the amount is greater than the balance", async function () {
            const { beaconMock, owner } = await tokenFixture(true);
            const balance = await beaconMock.balanceOf(owner.address);

            await expect(
                beaconMock.connect(owner).burn(owner.address, balance + 1n)
            ).to.be.revertedWithCustomError(
                beaconMock,
                "AmountExceedsError"
            );
        });

        it("Should burn tokens from the recipient", async function () {
            const { beaconMock, owner } = await tokenFixture(true);;

            await expect(
                beaconMock.connect(owner).burn(owner.address, AMOUNT)
            ).to.emit(beaconMock, "Transfer")
            .withArgs(owner.address, ZERO_ADDRESS, AMOUNT);

            expect(await beaconMock.balanceOf(owner.address)).to.equal(0);
        });

        it("Should emit Burned event", async function () {
            const { beaconMock, owner } = await tokenFixture(true);

            await expect(
                beaconMock.connect(owner).burn(owner.address, AMOUNT)
            ).to.emit(beaconMock, "Burned")
            .withArgs(owner.address, AMOUNT);
        });
    });

    // Test for the fallback();
    describe("fallback()", function () {
        it("Should revert when called with Ether and arbitrary data", async function () {
            const { beaconMock, owner } = await await tokenFixture(true);

            await expect(
                owner.sendTransaction({
                    to: await beaconMock.getAddress(),
                    value: AMOUNT / 10n,
                    data: "0x1234567890"
                })
            ).to.be.revertedWithCustomError(
                beaconMock,
                "FunctionCallError"
            );
        });
    });

    // Test for the receive();
    describe("receive()", function () {
        it("Should revert when receiving native currency without data", async function () {
             const { beaconMock, owner } = await await tokenFixture(true);

            await expect(
                owner.sendTransaction({
                    to: await beaconMock.getAddress(),
                    value: AMOUNT / 10n,
                    data: "0x"
                })
            ).to.be.revertedWithCustomError(
                beaconMock,
                "FunctionCallError"
            );
        });
    });    
});
