import { task } from "hardhat/config";

task("deploy", "Deploy GHST implementation").setAction(async (_, hre) => {
  console.log("Deploying...");
  const UChildERC20 = await hre.ethers.getContractFactory("UChildERC20");
  const uChildERC20 = await UChildERC20.deploy();
  console.log("GHST Implementation: " + uChildERC20.address);
  console.log("Waiting for 60 seconds for deployment to be picked up by polygonscan for verification...");
  await sleep(60000);
  await hre.run("verify:verify", 
  {
    address: uChildERC20.address,
    constructorArguments: [],
  });
});

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
