import { 
  BigNumber,
  Contract,
  Signer,
 } from "ethers";
import * as ethers from "ethers";

export async function mine(hre: any, count: number) {
  await hre.ethers.provider.send("hardhat_mine", [ethers.utils.hexlify(count)]);
}

export async function address(signer: Contract | Signer) {
  if(signer instanceof Contract) {
    return signer.address;
  }
  return signer.getAddress();
}