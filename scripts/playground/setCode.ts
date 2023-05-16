import hre, { ethers } from "hardhat";
import { MetavisorRegistry } from "../../typechain";

import artifactVault from "../../artifacts/contracts/vaults/MetavisorManagedVault.sol/MetavisorManagedVault.json";

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("Deploying the contracts with the account:", await deployer!.getAddress());
  console.log("Deploying on chain:", await deployer!.getChainId());
  console.log("Account balance:", ethers.utils.formatEther(await deployer!.getBalance()));
  console.log("Transaction count:", await deployer?.getTransactionCount());

  const registryDeployment = await hre.deployments.get("MetavisorRegistry");

  console.log(`Connecting to Metavisor Registry: ${registryDeployment.address}...`);
  const RegistryInterface = <MetavisorRegistry>(
    await ethers.getContractAt("MetavisorRegistry", registryDeployment.address)
  );
  console.log("> OK");

  const masterAddress = await RegistryInterface.vaultMaster();
  console.log(">>> Make sure to run compile before this!");

  await ethers.provider.send("hardhat_setCode", [masterAddress, artifactVault.deployedBytecode]);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
