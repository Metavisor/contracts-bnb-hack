import hre, { ethers } from "hardhat";
import {
  MetavisorRegistry,
  MetavisorManagedVault,
  IERC20MetadataUpgradeable,
  IWETH9,
} from "../typechain";

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

  const vaultAddress = await RegistryInterface.getAllVaults().then((e) => e[0]);
  console.log(`Connecting to Metavisor Vault: ${vaultAddress}...`);
  const VaultInterface = <MetavisorManagedVault>(
    await ethers.getContractAt("MetavisorManagedVault", vaultAddress)
  );
  console.log("> OK");

  // const USDC = <IERC20MetadataUpgradeable>(
  //   (await ethers.getContractAt("IERC20MetadataUpgradeable", USDC_ADDRESS)).connect(deployer)
  // );
  // const WETH = <IWETH9>(await ethers.getContractAt("IWETH9", WETH_ADDRESS)).connect(deployer);

  // console.log(
  //   ethers.utils.formatUnits(
  //     (await USDC.balanceOf("0xd1B06EE2D69D5C03514F095204217EC7B790C947")).toString(),
  //     6
  //   )
  // );
  // console.log(
  //   ethers.utils.formatUnits(
  //     (await WETH.balanceOf("0xd1B06EE2D69D5C03514F095204217EC7B790C947")).toString(),
  //     18
  //   )
  // );

  for (let i = 0; i < 5; i++) {
    const BAL_Pre = await VaultInterface.balanceOf(deployer.getAddress());
    await VaultInterface.deposit(
      ethers.utils.parseUnits("15441.42029", 6),
      ethers.utils.parseUnits("10", 18)
    );
    const BAL_Post = await VaultInterface.balanceOf(deployer.getAddress());
    console.log(BAL_Post.sub(BAL_Pre).toString());
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
