import hre, { ethers } from "hardhat";
import {
  MetavisorRegistry,
  MetavisorManagedVault,
  IERC20MetadataUpgradeable,
  IWETH9,
} from "../../typechain";

const RICH_GUY = "0xF977814e90dA44bFA03b6295A0616a897441aceC";
const WETH_ADDRESS = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
const USDC_ADDRESS = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";

async function main() {
  await hre.run("compile");

  const [deployer] = await hre.ethers.getSigners();

  console.log("Deploying the contracts with the account:", await deployer!.getAddress());
  console.log("Deploying on chain:", await deployer!.getChainId());
  console.log("Account balance:", (await deployer!.getBalance()).toString());
  console.log("Transaction count:", await deployer?.getTransactionCount());

  await hre.deployments.run();

  const registryDeployment = await hre.deployments.get("MetavisorRegistry");

  console.log(`Connecting to Metavisor Registry: ${registryDeployment.address}...`);
  const RegistryInterface = <MetavisorRegistry>(
    await ethers.getContractAt("MetavisorRegistry", registryDeployment.address)
  );
  console.log("> OK");

  // console.log(`Deploying pool...`);
  // await RegistryInterface.deployVault("0x88e6A0c2dDD26FEEb64F039a2c41296FcB3f5640", 0, {
  //   tickSpread: 100,
  //   tickOpen: 10,
  //   twapInterval: 60,
  //   priceThreshold: 110,
  // }).then((e) => e.wait());
  // console.log("> OK");

  const vaultAddress = "0x760BE08FEb7aF83d6e7EdaE6EF39B7643550F97C"; //await RegistryInterface.getAllVaults().then((e) => e[0]);
  console.log(`Connecting to Metavisor Vault: ${vaultAddress}...`);
  const VaultInterface = <MetavisorManagedVault>(
    await ethers.getContractAt("MetavisorManagedVault", vaultAddress)
  );
  console.log(await VaultInterface.name());
  console.log("> OK");

  // console.log(`Impersonating Rich Signer: ${RICH_GUY}...`);
  // await ethers.provider.send("hardhat_impersonateAccount", [RICH_GUY]);
  // const richSigner = await ethers.getImpersonatedSigner(RICH_GUY);
  // console.log("> OK");

  // console.log(`Transferring *some* USDC...`);
  const USDC = <IERC20MetadataUpgradeable>(
    await ethers.getContractAt("IERC20MetadataUpgradeable", USDC_ADDRESS)
  );
  // await USDC.connect(richSigner)
  //   .transfer(deployer.getAddress(), ethers.utils.parseUnits("2000000", await USDC.decimals()))
  //   .then((e) => e.wait());
  // console.log("> OK");

  console.log(`Depositing WETH...`);
  const WETH = <IWETH9>await ethers.getContractAt("IWETH9", WETH_ADDRESS);
  await WETH.deposit({
    value: ethers.utils.parseEther("200"),
  }).then((e) => e.wait());
  console.log("> OK");

  console.log(`Balance before Deposit...`);
  await VaultInterface.balanceOf(await deployer.getAddress()).then((e) =>
    console.log(ethers.utils.formatUnits(e, 18))
  );
  console.log("> OK");

  console.log(`Depositing in Vault...`);
  await USDC.approve(VaultInterface.address, ethers.constants.MaxUint256).then((e) => e.wait());
  await WETH.approve(VaultInterface.address, ethers.constants.MaxUint256).then((e) => e.wait());
  await VaultInterface.deposit(
    await USDC.balanceOf(await deployer.getAddress()),
    await WETH.balanceOf(await deployer.getAddress()),
    0,
    0
  ).then((e) => e.wait());
  console.log("> OK");

  console.log(`Balance after Deposit...`);
  await VaultInterface.balanceOf(await deployer.getAddress()).then((e) =>
    console.log(ethers.utils.formatUnits(e, 18))
  );
  console.log("> OK");

  // await WETH.approve(VaultInterface.address, 0).then((e) => e.wait());
  // await USDC.approve(VaultInterface.address, 0).then((e) => e.wait());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
