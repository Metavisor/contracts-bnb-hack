import { DeployFunction } from "hardhat-deploy/types";
import { MetavisorRegistry } from "../typechain";

interface IConfig {
  uniswapFactory: string;
  wethAddress: string;
}

type ISupportedChains =
  | 1 // Ethereum Mainnet
  | 56 // BSC
  | 137 // Polygon
  | 42161 // Arbitrum
  | 10; // Optimism

const deploymentConfig: Record<ISupportedChains, IConfig> = {
  1: {
    uniswapFactory: "0x1F98431c8aD98523631AE4a59f267346ea31F984",
    wethAddress: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
  },
  56: {
    uniswapFactory: "0xdB1d10011AD0Ff90774D0C6Bb92e5C5c8b4461F7",
    wethAddress: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
  },
  137: {
    uniswapFactory: "0x1F98431c8aD98523631AE4a59f267346ea31F984",
    wethAddress: "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270",
  },
  42161: {
    uniswapFactory: "0x1F98431c8aD98523631AE4a59f267346ea31F984",
    wethAddress: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1",
  },
  10: {
    uniswapFactory: "0x1F98431c8aD98523631AE4a59f267346ea31F984",
    wethAddress: "0x4200000000000000000000000000000000000006",
  },
};

const main: DeployFunction = async ({ deployments, ethers, network }) => {
  const { deploy } = deployments;
  const [deployer] = await ethers.getSigners();

  const chainId = await deployer!.getChainId();
  const feeData = await deployer?.getFeeData();

  console.log(">>>>>>>>>");
  console.log("Deployer:", await deployer!.getAddress());
  console.log("Chain ID:", await deployer!.getChainId());
  console.log("Transaction Count:", await deployer?.getTransactionCount());
  console.log(
    "Current Network Fee:",
    ethers.utils.formatUnits(feeData.lastBaseFeePerGas ?? 0, 9),
    "gwei",
    ethers.utils.formatUnits(feeData.maxFeePerGas ?? 0, 9),
    "gwei"
  );
  console.log(">>>>>>>>>");
  console.log("Account balance:", ethers.utils.formatUnits(await deployer!.getBalance(), 18));
  console.log(">>>>>>>>>");

  if (["hardhat", "anvil"].includes(network.name)) {
    await deployments.delete("UniswapInteractionHelper");
    await deployments.delete("MetavisorRegistry");
  }

  const library = await deploy("UniswapInteractionHelper", {
    from: await deployer!.getAddress(),
    log: true,
    args: [],
  });

  const chainConfig = deploymentConfig[chainId as ISupportedChains];

  const result = await deploy("MetavisorRegistry", {
    from: await deployer!.getAddress(),
    log: true,
    args: [chainConfig.uniswapFactory, chainConfig.wethAddress, "5000"],
    libraries: {
      UniswapInteractionHelper: library.address,
    },
    // maxPriorityFeePerGas: ethers.utils.parseUnits("31", "gwei"),
  });

  const contract = <MetavisorRegistry>(
    await ethers.getContractAt("MetavisorRegistry", result.address)
  );

  await contract.setFeeParameters(deployer.getAddress(), "2000");

  console.log(">>>>>>>>>");
  console.log("Deployed to:", result.address);
  console.log(">>>>>>>>>");
  console.log("Account balance:", ethers.utils.formatUnits(await deployer!.getBalance(), 18));
  console.log(">>>>>>>>>");
};

export default main;

export const tags = ["Factory"];
