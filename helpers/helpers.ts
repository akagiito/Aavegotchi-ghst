import { BigNumber, Signer, Wallet, Contract, BytesLike } from "ethers";
import * as ethers from "ethers";
import * as hre from "hardhat";
import {
  HardhatRuntimeEnvironment,
} from "hardhat/types";
import {
  PROXY_ADDRESS,
  DOMAIN,
  PERMIT_TYPES,
  DELEGATION_TYPES,
  METATRANSACTION_TYPES,
} from "./constants";
import {
  address
} from "./utils";

export async function permit(
  hre: HardhatRuntimeEnvironment,
  token: Contract,
  owner: Wallet,
  spender: string,
  value: BigNumber,
  nonce: BigNumber,
  deadline: BigNumber) {
    const sig = await permitRSV(
      hre,
      owner,
      spender,
      value,
      nonce,
      deadline,
    );
    return await token.connect(owner).permit(
      await address(owner),
      spender,
      value,
      deadline,
      sig.v,
      sig.r,
      sig.s,
    )
}

export async function metatransaction(
  hre: HardhatRuntimeEnvironment,
  token: Contract,
  owner: Wallet,
  nonce: BigNumber,
  functionSignature: BytesLike) { 
    const sig = await metatransactionRSV(
      hre,
      nonce,
      owner,
      functionSignature,
    );
    return await token.connect(owner).executeMetaTransaction(
      nonce,
      await address(owner),
      functionSignature,
      sig.v,
      sig.r,
      sig.s,
    );
};

export async function delegationBySig(
  hre: HardhatRuntimeEnvironment,
  token: Contract,
  owner: Wallet,
  delegatee: string,
  nonce: BigNumber,
  expiry: BigNumber) {
    const sig = await delegationRSV(
      hre,
      owner,
      delegatee,
      nonce,
      expiry,
    );
    return await token.connect(owner).delegateBySig(
      delegatee,
      nonce,
      expiry,
      sig.v,
      sig.r,
      sig.s,
    );
}

export async function permitRSV(
  hre: HardhatRuntimeEnvironment,
  owner: Wallet,
  spender: string,
  value: BigNumber,
  nonce: BigNumber,
  deadline: BigNumber
) {
  const message = {
    owner: await address(owner),
    spender: spender,
    value: ethers.utils.hexValue(value),
    nonce: ethers.utils.hexValue(nonce),
    deadline: ethers.utils.hexValue(deadline),
  }

  const typedData = {
    types: PERMIT_TYPES,
    primaryType: "Permit",
    domain: DOMAIN,
    message: message,
  };

  const result = await hre.network.provider.send(
    "eth_signTypedData_v4", 
    [await address(owner), typedData]);
  
  const r = result.slice(0, 66);
  const s = "0x" + result.slice(66, 130);
  const v = Number("0x" + result.slice(130, 132));
  return {v, r, s};
};

export async function metatransactionRSV(
  hre: HardhatRuntimeEnvironment,
  nonce: BigNumber,
  owner: Wallet,
  functionSignature: BytesLike
) {
  const message = {
    nonce: ethers.utils.hexValue(nonce),
    from: await address(owner),
    functionSignature: ethers.utils.hexValue(functionSignature),
  }

  const typedData = {
    types: METATRANSACTION_TYPES,
    primaryType: "MetaTransaction",
    domain: DOMAIN,
    message: message,
  };

  const result = await hre.network.provider.send(
    "eth_signTypedData_v4", 
    [await address(owner), typedData]);
  
  const r = result.slice(0, 66);
  const s = "0x" + result.slice(66, 130);
  const v = Number("0x" + result.slice(130, 132));
  return {v, r, s};
};

export async function delegationRSV(
  hre: HardhatRuntimeEnvironment,
  owner: Wallet,
  delegatee: string,
  nonce: BigNumber,
  expiry: BigNumber,
) {
  const message = {
    delegatee: delegatee,
    nonce: ethers.utils.hexValue(nonce),
    expiry: ethers.utils.hexValue(expiry),
  }

  const typedData = {
    types: DELEGATION_TYPES,
    primaryType: "Delegation",
    domain: DOMAIN,
    message: message,
  };

  const result = await hre.network.provider.send(
    "eth_signTypedData_v4", 
    [await address(owner), typedData]);
  
  const r = result.slice(0, 66);
  const s = "0x" + result.slice(66, 130);
  const v = Number("0x" + result.slice(130, 132));
  return {v, r, s};
};