import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import hre from "hardhat";
import { deployFixture } from "./Fixtures";

describe("FactorySFP", function () {
    describe("Deployment", function () {
        it("Should set the right owner", async function () {
            const { factory, owner } = await loadFixture(deployFixture);

            expect(await factory.owner()).to.equal(owner.address);
        });

        it("Should set the right beacon address", async function () {
            const { factory, beaconAddress } = await loadFixture(deployFixture);

            expect(await factory.beaconAddress()).to.equal(beaconAddress);
        });
    });

    // TODO: Add tests for the functions in FactorySFP
});
