import hre, { ethers } from "hardhat";
import {
  MetavisorRegistry,
  MetavisorManagedVault,
  IERC20MetadataUpgradeable,
  IWETH9,
} from "../../typechain";
import { VaultSpecStruct } from "../../typechain/contracts/MetavisorRegistry";

type VaultDefinition = {
  pool: string;
  type: 0 | 1;
  spec: VaultSpecStruct;
};

const poolsToDeploy: VaultDefinition[] = [
  {
    pool: "0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640", // USDC-WETH 0.05%
    type: 0,
    spec: {
      tickSpread: 100,
      tickOpen: 10,
      twapInterval: 60,
      priceThreshold: 102_50,
    },
  },
  // {
  //   pool: "0x88e6A0c2dDD26FEEb64F039a2c41296FcB3f5640", // USDC-WETH 0.05%
  //   type: 1,
  //   spec: {
  //     tickSpread: 200,
  //     tickOpen: 20,
  //     twapInterval: 60,
  //     priceThreshold: 110,
  //   },
  // },
  // {
  //   pool: "0x11b815efb8f581194ae79006d24e0d814b7697f6", // WETH-USDT 0.05%
  //   type: 0,
  //   spec: {
  //     tickSpread: 100,
  //     tickOpen: 10,
  //     twapInterval: 60,
  //     priceThreshold: 110,
  //   },
  // },
  // {
  //   pool: "0x11b815efb8f581194ae79006d24e0d814b7697f6", // WETH-USDT 0.05%
  //   type: 1,
  //   spec: {
  //     tickSpread: 200,
  //     tickOpen: 20,
  //     twapInterval: 60,
  //     priceThreshold: 110,
  //   },
  // },
  // {
  //   pool: "0xd8de6af55f618a7bc69835d55ddc6582220c36c0", // DYDX-WETH 0.3%
  //   type: 0,
  //   spec: {
  //     tickSpread: 15,
  //     tickOpen: 3,
  //     twapInterval: 60,
  //     priceThreshold: 110,
  //   },
  // },
  // {
  //   pool: "0xd8de6af55f618a7bc69835d55ddc6582220c36c0", // DYDX-WETH 0.3%
  //   type: 1,
  //   spec: {
  //     tickSpread: 30,
  //     tickOpen: 4,
  //     twapInterval: 60,
  //     priceThreshold: 110,
  //   },
  // },
  // {
  //   pool: "0x4c83a7f819a5c37d64b4c5a2f8238ea082fa1f4e", // WETH-CRV 1%
  //   type: 0,
  //   spec: {
  //     tickSpread: 8,
  //     tickOpen: 2,
  //     twapInterval: 60,
  //     priceThreshold: 110,
  //   },
  // },
  // {
  //   pool: "0xac4b3dacb91461209ae9d41ec517c2b9cb1b7daf", // APE-WETH 0.3%
  //   type: 0,
  //   spec: {
  //     tickSpread: 12,
  //     tickOpen: 2,
  //     twapInterval: 60,
  //     priceThreshold: 110,
  //   },
  // },
  // {
  //   pool: "0xac4b3dacb91461209ae9d41ec517c2b9cb1b7daf", // APE-WETH 0.3%
  //   type: 1,
  //   spec: {
  //     tickSpread: 20,
  //     tickOpen: 3,
  //     twapInterval: 60,
  //     priceThreshold: 110,
  //   },
  // },
  // {
  //   pool: "0x4585fe77225b41b697c938b018e2ac67ac5a20c0", // WBTC-WETH 0.05%
  //   type: 0,
  //   spec: {
  //     tickSpread: 12,
  //     tickOpen: 2,
  //     twapInterval: 60,
  //     priceThreshold: 110,
  //   },
  // },
  // {
  //   pool: "0xa3f558aebaecaf0e11ca4b2199cc5ed341edfd74", // LDO-WETH 0.3%
  //   type: 0,
  //   spec: {
  //     tickSpread: 40,
  //     tickOpen: 4,
  //     twapInterval: 60,
  //     priceThreshold: 110,
  //   },
  // },
  // {
  //   pool: "0xa3f558aebaecaf0e11ca4b2199cc5ed341edfd74", // LDO-WETH 0.3%
  //   type: 1,
  //   spec: {
  //     tickSpread: 60,
  //     tickOpen: 6,
  //     twapInterval: 60,
  //     priceThreshold: 110,
  //   },
  // },
  // {
  //   pool: "0x290a6a7460b308ee3f19023d2d00de604bcf5b42", // MATIC-WETH 0.3%
  //   type: 1,
  //   spec: {
  //     tickSpread: 10,
  //     tickOpen: 2,
  //     twapInterval: 60,
  //     priceThreshold: 110,
  //   },
  // },
  // {
  //   pool: "0x69d91b94f0aaf8e8a2586909fa77a5c2c89818d5", // HEX-USDC 0.3%
  //   type: 1,
  //   spec: {
  //     tickSpread: 40,
  //     tickOpen: 3,
  //     twapInterval: 60,
  //     priceThreshold: 110,
  //   },
  // },
];

async function main() {
  await hre.run("compile");

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

  for (let i = 0; i < poolsToDeploy.length; i++) {
    const single = poolsToDeploy[i];
    console.log(`Deploying vault with pool: ${single.pool}...`);
    const vaultExists = await RegistryInterface.deployedVaults(single.pool, single.type).then(
      (e) => e !== ethers.constants.AddressZero
    );
    if (!vaultExists) {
      await RegistryInterface.deployVault(single.pool, single.type, single.spec).then((e) =>
        e.wait()
      );
    } else {
      console.log("> Vault Already Exists.");
    }
    console.log("> OK");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
