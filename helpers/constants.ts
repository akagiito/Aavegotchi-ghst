import { BigNumber } from "ethers";
import * as ethers from "ethers";

export const PROXY_ADDRESS = "0x385Eeac5cB85A38A9a07A70c73e0a3271CfB54A7";
export const PROXY_ADMIN = "0x355b8E02e7F5301E6fac9b7cAc1D6D9c86C0343f";
export const NEW_IMPLEMENTATION_ADDRESS = "0xAa888e7bc9e38D6a78A24D219c00F3C9f0061d51";
export const OLD_IMPLEMENTATION_ADDRESS = "0x5004bc7E5B718c245cA859DB349Dd012CFD58395";

export const PERMIT_TYPEHASH = ethers.utils.hexlify("0x919bd92e51609d37df2cfed79de24828ee59d5abbbc4ab31b10422f6a05d1378");

export const PERMIT_DELEGATION_TYPEHASH = ethers.utils.keccak256(
  ethers.utils.toUtf8Bytes(
    "Delegation(address delegatee,uint256 nonce,uint256 expiry)"));

export const METATRANSACTION_TYPEHASH = ethers.utils.keccak256(
  ethers.utils.hexlify(ethers.utils.toUtf8Bytes(
    "MetaTransaction(uint256 nonce,address from,bytes functionSignature)")));

export const DOMAIN = {
  name: 'Aavegotchi GHST Token (PoS)',
  version: '1',
  verifyingContract: PROXY_ADDRESS,
  salt: ethers.utils.hexZeroPad(ethers.utils.hexValue(137), 32),
}

export const DOMAIN_TYPES = [
  {
    name: "name",
    type: "string",
  },
  {
    name: "version",
    type: "string",
  },
  {
    name: "verifyingContract",
    type: "address",
  },
  {
    name: "salt",
    type: "bytes32",
  },
];

export const PERMIT_TYPES = {
  EIP712Domain: DOMAIN_TYPES,
  Permit: [
    { name: "owner", type: "address", },
    { name: "spender", type: "address", },
    { name: "value", type: "uint256", },
    { name: "nonce", type: "uint256", },
    { name: "deadline", type: "uint256", },
  ],
};

export const METATRANSACTION_TYPES = {
  EIP712Domain: DOMAIN_TYPES,
  MetaTransaction: [
    { name: 'nonce', type: 'uint256', },
    { name: 'from', type: 'address', },
    { name: 'functionSignature', type: 'bytes', },
  ],  
}; 
export const DELEGATION_TYPES = {
  EIP712Domain: DOMAIN_TYPES,
  Delegation: [
    { name: 'delegatee', type: 'address', },
    { name: 'nonce', type: 'uint256', },
    { name: 'expiry', type: 'uint256', },
  ],
};