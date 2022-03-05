import * as fs from "fs";
import * as hre from "hardhat";
import { ethers } from "hardhat";
import { 
  Signer, 
  Contract, 
  BigNumber 
} from "ethers";
import { expect } from "chai";
import {
  PROXY_ADDRESS,
  PROXY_ADMIN,
  NEW_IMPLEMENTATION_ADDRESS,
  OLD_IMPLEMENTATION_ADDRESS,
} from "../helpers/constants";

describe("Test GHST Implementation", function () {

  /**
   * Want to rely on openzeppelin's hardhat-upgrade package to
   * test whether the contracts are upgrade safe.
   * However, the proxy deployed for GHST are not standard and
   * so do not work with the hardhat-upgrade package. So we
   * deploy a new proxy to test the upgrade.
   */
  describe("Testing upgrading with Openzeppelin", function() {

    let proxy: Contract;
    let ghst: Contract;

    before(async function () {
      const ProxyAdmin = await ethers.getContractFactory("ProxyAdmin");
      const TransparentUpgradeableProxy = await ethers.getContractFactory("TransparentUpgradeableProxy");
      let proxyAdmin = await ProxyAdmin.deploy();
      proxy = await TransparentUpgradeableProxy.deploy(OLD_IMPLEMENTATION_ADDRESS, proxyAdmin.address, []);
      await proxy.deployed();
      
    });
  
    it("Should swap the implementation contract", async () => {
      const UChildERC20 = await ethers.getContractFactory("UChildERC20");
      const OldUChildERC20 = await ethers.getContractFactory("OldUChildERC20");
      await hre.upgrades.forceImport(proxy.address, OldUChildERC20);
      await hre.upgrades.upgradeProxy(
        proxy.address, 
        UChildERC20, 
        // These are all flaws of the previous implementation that will carry forward to the new implementation
        {
          unsafeAllow: ['state-variable-immutable', 'constructor', 'state-variable-assignment']
        }
      );
      ghst = await ethers.getContractAt("UChildERC20", proxy.address);
    });
  });

  describe("Testing upgrading the real contract", function() {

    let proxy: Contract;
    let ghst: Contract;
    let proxyAdmin: Signer;
    
    before(async function() {
      proxy = await ethers.getContractAt("IUpgradeableProxy", PROXY_ADDRESS);
      ghst = await ethers.getContractAt("UChildERC20", PROXY_ADDRESS);
      await hre.network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [PROXY_ADMIN],
      });
      proxyAdmin = await hre.ethers.getSigner(PROXY_ADMIN);
    });

    it("Should swap the implementation contract", async () => {
      await proxy.connect(proxyAdmin).updateImplementation(NEW_IMPLEMENTATION_ADDRESS);
      expect(await proxy.implementation()).to.equal(NEW_IMPLEMENTATION_ADDRESS);
      
    });

    describe("Check storage slots", function() {

      //Should be enough to check one non-zero balance
      it("Should have the same balances as before");

      it("Should have the same name");

      it("Should have the same symbol");

      it("Should have the same decimals");

      it("Should have the same chain ID");

      it("Should have the same allowances");

      it("Should have the same depositor role");

      it("Should still be able to deposit as depositRole");

      it("Should have the same nonce");
    });

    describe("Test new functionality", function() {

      it("Should have no votes before delegation");

      it("Should allow vote delegation");

      it("Should have votes after delegation");

      // Make sure nonce increases
      it("Should be able to permit delegation");

      it("Permit delegation should fail with an invalid signature");

      it("Should track votes from past blocks");

      // Make sure nonce increases
      it("Permit should increase allowance");

      it("Permit should fail with an invalid signature");

    });

  });

});
