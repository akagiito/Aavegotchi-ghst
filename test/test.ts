import * as fs from "fs";
import * as hre from "hardhat";
import { ethers } from "hardhat";
import { 
  Signer, 
  Contract, 
  BigNumber,
  Signature,
  Wallet,
} from "ethers";
import { expect } from "chai";
import {
  PROXY_ADDRESS,
  PROXY_ADMIN,
  NEW_IMPLEMENTATION_ADDRESS,
  OLD_IMPLEMENTATION_ADDRESS,
} from "../helpers/constants";
import {
  mine,
  address,
} from "../helpers/utils";
import {
  permit,
  permitRSV,
  delegationBySig,
  delegationRSV,
  metatransaction,
  metatransactionRSV,
} from "../helpers/helpers";

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
    let depositor: Signer;
    
    before(async function() {
      proxy = await ethers.getContractAt("IUpgradeableProxy", PROXY_ADDRESS);
      ghst = await ethers.getContractAt("UChildERC20", PROXY_ADDRESS);
      await hre.network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [PROXY_ADMIN],
      });
      proxyAdmin = await hre.ethers.getSigner(PROXY_ADMIN);
      let depositorAddress = await ghst.getRoleMember(await ghst.DEPOSITOR_ROLE(), 0);
      await hre.network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [depositorAddress],
      });
      await hre.network.provider.request({
        method: "hardhat_setBalance",
        params: [depositorAddress, "0xfffffffffffffffffff"],
      })
      depositor = await hre.ethers.getSigner(depositorAddress);
    });

    it("Should swap the implementation contract", async () => {
      await proxy.connect(proxyAdmin).updateImplementation(NEW_IMPLEMENTATION_ADDRESS);
      expect(await proxy.implementation()).to.equal(NEW_IMPLEMENTATION_ADDRESS);
      await proxy.connect(proxyAdmin).updateImplementation(OLD_IMPLEMENTATION_ADDRESS);
      expect(await proxy.implementation()).to.equal(OLD_IMPLEMENTATION_ADDRESS);
    });

    describe("Check storage slots", function() {
      beforeEach(async function() {
        await proxy.connect(proxyAdmin).updateImplementation(OLD_IMPLEMENTATION_ADDRESS);
        expect(await proxy.implementation()).to.equal(OLD_IMPLEMENTATION_ADDRESS);
      });

      afterEach(async function() {
        expect(await proxy.implementation()).to.equal(NEW_IMPLEMENTATION_ADDRESS);
      })

      //Should be enough to check one non-zero balance
      it("Should have the same balances as before", async() => {
        let oldBalance = await ghst.balanceOf("0xFFfFfFffFFfffFFfFFfFFFFFffFFFffffFfFFFfF");
        await proxy.connect(proxyAdmin).updateImplementation(NEW_IMPLEMENTATION_ADDRESS);
        let newBalance = await ghst.balanceOf("0xFFfFfFffFFfffFFfFFfFFFFFffFFFffffFfFFFfF");
        expect(newBalance).to.equal(oldBalance);
        expect(newBalance).to.be.gt(0);
      });

      it("Should have the same name", async() => {
        let oldName = await ghst.name();
        await proxy.connect(proxyAdmin).updateImplementation(NEW_IMPLEMENTATION_ADDRESS);
        let newName = await ghst.name();
        expect(newName).to.equal(oldName);
      });

      it("Should have the same symbol", async() => {
        let oldSymbol = await ghst.symbol();
        await proxy.connect(proxyAdmin).updateImplementation(NEW_IMPLEMENTATION_ADDRESS);
        let newSymbol = await ghst.symbol();
        expect(newSymbol).to.equal(oldSymbol);
      });

      it("Should have the same decimals", async() => {
        let oldDecimals = await ghst.decimals();
        await proxy.connect(proxyAdmin).updateImplementation(NEW_IMPLEMENTATION_ADDRESS);
        let newDecimals = await ghst.decimals();
        expect(newDecimals).to.equal(oldDecimals);
        expect(newDecimals).to.be.gt(0);
      });

      it("Should have the same total supply", async() => {
        let oldTotalSupply = await ghst.totalSupply();
        await proxy.connect(proxyAdmin).updateImplementation(NEW_IMPLEMENTATION_ADDRESS);
        let newTotalSupply = await ghst.totalSupply();
        expect(newTotalSupply).to.equal(oldTotalSupply);
        expect(newTotalSupply).to.be.gt(0);
      });

      it("Should have the same chain ID", async() => {
        let oldChainId = await ghst.getChainId();
        await proxy.connect(proxyAdmin).updateImplementation(NEW_IMPLEMENTATION_ADDRESS);
        let newChainId = await ghst.getChainId();
        expect(newChainId).to.equal(oldChainId);
        expect(newChainId).to.be.gt(0);
      });

      it("Should have the same domain separator", async() => {
        let oldDomainSeparator = await ghst.getDomainSeperator(); // Typo in original contract
        await proxy.connect(proxyAdmin).updateImplementation(NEW_IMPLEMENTATION_ADDRESS);
        let newDomainSeparator = await ghst.getDomainSeperator();
        expect(newDomainSeparator).to.equal(oldDomainSeparator);
      });

      it("Should have the same allowances", async() => {
        await ghst.approve("0xFFfFfFffFFfffFFfFFfFFFFFffFFFffffFfFFFfF", 100);
        let oldAllowance = await ghst.allowance(await ghst.signer.getAddress(), "0xFFfFfFffFFfffFFfFFfFFFFFffFFFffffFfFFFfF");
        await proxy.connect(proxyAdmin).updateImplementation(NEW_IMPLEMENTATION_ADDRESS);
        let newAllowance = await ghst.allowance(await ghst.signer.getAddress(), "0xFFfFfFffFFfffFFfFFfFFFFFffFFFffffFfFFFfF");
        expect(oldAllowance).to.equal(newAllowance);
        expect(oldAllowance).to.be.gt(0);
      });

      it("Should have the same depositor role", async() => {
        let oldDepositorRole = await ghst.DEPOSITOR_ROLE();
        await proxy.connect(proxyAdmin).updateImplementation(NEW_IMPLEMENTATION_ADDRESS);
        let newDepositorRole = await ghst.DEPOSITOR_ROLE();
        expect(newDepositorRole).to.equal(oldDepositorRole);
      });

      it("Should still be able to deposit as depositRole", async() => {
        await proxy.connect(proxyAdmin).updateImplementation(NEW_IMPLEMENTATION_ADDRESS);

        let oldBalance = await ghst.balanceOf(await ghst.signer.getAddress());     
        await ghst.connect(depositor).deposit(
          await ghst.signer.getAddress(), 
          await ethers.utils.defaultAbiCoder.encode(["uint256"], [100])
        );
        let newBalance = await ghst.balanceOf(await ghst.signer.getAddress());
        expect(newBalance).to.equal(oldBalance + 100);
        await ghst.transfer("0xFFfFfFffFFfffFFfFFfFFFFFffFFFffffFfFFFfF", await ghst.balanceOf(await ghst.signer.getAddress()));
        expect(await ghst.balanceOf(await ghst.signer.getAddress())).to.equal(0);
      });

      it("Should have the same nonce", async() => {
        let oldNonce = await ghst.getNonce("0xfa67fc2901dd343d3324fc882fe7eb474354a6e2");
        await proxy.connect(proxyAdmin).updateImplementation(NEW_IMPLEMENTATION_ADDRESS);
        let newNonce = await ghst.getNonce("0xfa67fc2901dd343d3324fc882fe7eb474354a6e2");
        expect(newNonce).to.equal(oldNonce);
        expect(newNonce).to.be.gt(0);
      });
    });

    describe("Test new functionality", () => {
      let signers: Signer[] = [];

      before(async() => {
        signers = await hre.ethers.getSigners();
        await proxy.connect(proxyAdmin).updateImplementation(NEW_IMPLEMENTATION_ADDRESS);
        expect(await proxy.implementation()).to.equal(NEW_IMPLEMENTATION_ADDRESS);
        // Minting ghst for each signer for them to delegate
        for(let signer of signers) {
          await ghst.connect(depositor).deposit(
            await signer.getAddress(),
            await ethers.utils.defaultAbiCoder.encode(["uint256"], [100])
          )
        }
      });

      it("Should allow vote delegation to self", async() => {
        await ghst.connect(signers[0]).delegate(await signers[0].getAddress());
        await ghst.connect(signers[1]).delegate(await signers[1].getAddress());
        expect(await ghst.getVotes(await signers[0].getAddress())).to.equal(100);
        expect(await ghst.getVotes(await signers[1].getAddress())).to.equal(100);
        await mine(hre, 100);
      });

      it("Should delegate to others", async() => {
        await ghst.connect(signers[0]).delegate(await signers[1].getAddress());
        expect(await ghst.getVotes(await signers[0].getAddress())).to.equal(0);
        expect(await ghst.getVotes(await signers[1].getAddress())).to.equal(200);
        await mine(hre, 100);
      });

      it("Past votes should be different", async() => {
        expect(await ghst.getPastVotes(
          await signers[0].getAddress(), 
          await hre.ethers.provider.getBlockNumber() - 150)).to.equal(100);
        expect(await ghst.getPastVotes(
          await signers[0].getAddress(), 
          await hre.ethers.provider.getBlockNumber() - 150)).to.equal(100);
      });

      // Make sure nonce increases
      it("Should be able to permit delegation", async() => {
        await delegationBySig(
          hre, 
          ghst, 
          signers[0] as Wallet, 
          await address(signers[1]), 
          await ghst.getNonce(await signers[0].getAddress()),
          BigNumber.from(20469493830),
        );
        expect(await ghst.delegates(await signers[0].getAddress())).to.equal(await signers[1].getAddress());
      });

      it("Permit delegation should fail with an invalid signature");

      it("Should track votes from past blocks");

      // Make sure nonce increases
      it("Permit should increase allowance", async() => {
        await permit(
          hre,
          ghst,
          signers[0] as Wallet,
          await address(signers[1]),
          BigNumber.from(10000),
          await ghst.getNonce(await signers[0].getAddress()),
          BigNumber.from(20469493830),
        )
        expect(await ghst.allowance(await address(signers[0]), await address(signers[1]))).to.equal(BigNumber.from(10000));

      });

      it("Permit should fail with an invalid signature", async () => {
        const owner = await address(signers[0]);
        const spender = await address(signers[1]);
        const value = BigNumber.from(10000);
        const deadline = BigNumber.from(20469493830);
        let rsv = await permitRSV(
          hre,
          signers[0] as Wallet,
          spender,
          BigNumber.from(9999),
          await ghst.getNonce(owner),
          deadline,
        );
        await expect(ghst.connect(signers[0]).permit(
          owner,
          spender,
          value,
          deadline,
          rsv.v,
          rsv.r,
          rsv.s,
        )).to.be.revertedWith("ERC20Permit: invalid signature");
        
      });

      it("Permit should fail with an expired deadline", async() => {
        await expect(permit(
          hre,
          ghst,
          signers[0] as Wallet,
          await address(signers[1]),
          BigNumber.from(9999),
          await ghst.getNonce(await signers[0].getAddress()),
          BigNumber.from(0),
        )).to.be.revertedWith("ERC20Permit: expired deadline");
      })

    });

  });

});
