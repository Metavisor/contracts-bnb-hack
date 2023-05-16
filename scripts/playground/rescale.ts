import hre, { ethers } from "hardhat";
import {
  MetavisorRegistry,
  MetavisorManagedVault,
  IERC20MetadataUpgradeable,
  IWETH9,
} from "../../typechain";

const RICH_GUY = "0x47ac0Fb4F2D84898e4D9E7b4DaB3C24507a6D503";
const WETH_ADDRESS = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
const USDC_ADDRESS = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  // await hre.run("compile");

  const [deployer] = await hre.ethers.getSigners();

  console.log("Deploying the contracts with the account:", await deployer!.getAddress());
  console.log("Deploying on chain:", await deployer!.getChainId());
  console.log("Account balance:", (await deployer!.getBalance()).toString());
  console.log("Transaction count:", await deployer?.getTransactionCount());

  const registryDeployment = await hre.deployments.get("MetavisorRegistry");

  console.log(`Connecting to Metavisor Registry: ${registryDeployment.address}...`);
  const RegistryInterface = <MetavisorRegistry>(
    await ethers.getContractAt("MetavisorRegistry", registryDeployment.address)
  );
  console.log("> OK");

  const vaultAddress = "0x623e6F1DC3249Cc06f0d318664Eb19188d31b6F2";
  console.log(`Connecting to Metavisor Vault: ${vaultAddress}...`);
  const VaultInterface = <MetavisorManagedVault>(
    await ethers.getContractAt("MetavisorManagedVault", vaultAddress)
  );
  console.log("> OK");

  // console.log(`Setting Vault Spec...`);
  // await RegistryInterface.setVaultSpec(VaultInterface.address, {
  //   tickSpread: 25,
  //   tickOpen: 5,
  // }).then((e) => e.wait());
  // console.log("> OK");

  console.log(`Checking Parameters...`);
  const isAllowedToRescale = await RegistryInterface.isAllowedToRescale(deployer.getAddress());
  const canRescale = await VaultInterface.canRescale();
  console.log({ isAllowedToRescale, canRescale });
  console.log("> OK");

  if (canRescale && isAllowedToRescale) {
    console.log(`Rescaling...`);
    await VaultInterface.rescale({
      gasLimit: "700000",
    }).then((e) => e.wait());
    console.log("> OK");
  } else {
    console.error(`Can not rescale... aborting...`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
