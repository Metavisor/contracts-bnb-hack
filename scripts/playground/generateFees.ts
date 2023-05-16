import hre, { ethers } from "hardhat";
import {
  MetavisorRegistry,
  MetavisorManagedVault,
  IERC20MetadataUpgradeable,
  IWETH9,
} from "../../typechain";

const RICH_GUY = "0x47ac0Fb4F2D84898e4D9E7b4DaB3C24507a6D503";
const USDC_ADDRESS = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
const WETH_ADDRESS = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";

import { routerABI } from "./helper/uniswapAbi";

async function main() {
  await hre.run("compile");

  const [, deployer] = await hre.ethers.getSigners();

  console.log("Deploying the contracts with the account:", await deployer!.getAddress());
  console.log("Deploying on chain:", await deployer!.getChainId());
  console.log("Account balance:", (await deployer!.getBalance()).toString());
  console.log("Transaction count:", await deployer?.getTransactionCount());

  const uniswapRouter = new ethers.Contract(
    "0xE592427A0AEce92De3Edee1F18E0157C05861564",
    routerABI,
    deployer
  );

  const USDC = <IERC20MetadataUpgradeable>(
    (await ethers.getContractAt("IERC20MetadataUpgradeable", USDC_ADDRESS)).connect(deployer)
  );
  const WETH = <IWETH9>(await ethers.getContractAt("IWETH9", WETH_ADDRESS)).connect(deployer);

  if (true) {
    await USDC.approve(uniswapRouter.address, ethers.constants.MaxUint256).then((e) => e.wait());
    await WETH.approve(uniswapRouter.address, ethers.constants.MaxUint256).then((e) => e.wait());
  }

  // // Only ETH -> USD
  // for (let i = 0; i < 2; i++) {
  //   console.log(`Turn ${i + 1}...`);
  //   await WETH.deposit({
  //     value: ethers.utils.parseEther("10000"),
  //   }).then((e) => e.wait());

  //   const WETH_Bal = await WETH.balanceOf(await deployer.getAddress());
  //   const USDC_Bal = await USDC.balanceOf(await deployer.getAddress());
  //   console.log("WETH:", ethers.utils.formatUnits(WETH_Bal, 18));
  //   console.log("USDC:", ethers.utils.formatUnits(USDC_Bal, 6));

  //   await uniswapRouter
  //     .exactInputSingle({
  //       tokenIn: WETH_ADDRESS,
  //       tokenOut: USDC_ADDRESS,
  //       fee: "500",
  //       recipient: await deployer.getAddress(),
  //       deadline: Math.floor(Date.now() / 1000) + 120,
  //       amountIn: ethers.utils.parseEther("10000"),
  //       amountOutMinimum: 0,
  //       sqrtPriceLimitX96: 0,
  //     })
  //     .then((e: any) => e.wait());
  //   await uniswapRouter.refundETH().then((e: any) => e.wait());
  // }

  // // Only USD -> ETH
  // for (let i = 0; i < 2; i++) {
  //   console.log(`Turn ${i + 1}...`);

  //   const WETH_Bal = await WETH.balanceOf(await deployer.getAddress());
  //   const USDC_Bal = await USDC.balanceOf(await deployer.getAddress());
  //   console.log("WETH:", ethers.utils.formatUnits(WETH_Bal, 18));
  //   console.log("USDC:", ethers.utils.formatUnits(USDC_Bal, 6));

  //   await uniswapRouter
  //     .exactInputSingle({
  //       tokenIn: USDC_ADDRESS,
  //       tokenOut: WETH_ADDRESS,
  //       fee: "500",
  //       recipient: await deployer.getAddress(),
  //       deadline: Math.floor(Date.now() / 1000) + 120,
  //       amountIn: ethers.utils.parseUnits("100000", 6),
  //       amountOutMinimum: 0,
  //       sqrtPriceLimitX96: 0,
  //     })
  //     .then((e: any) => e.wait());
  //   await uniswapRouter.refundETH().then((e: any) => e.wait());
  // }

  await USDC.transfer(
    "0x000000000000000000000000000000000000dEaD",
    USDC.balanceOf(deployer.getAddress())
  ).then((e) => e.wait());
  await WETH.transfer(
    "0x000000000000000000000000000000000000dEaD",
    WETH.balanceOf(deployer.getAddress())
  ).then((e) => e.wait());

  // USDC <> ETH, same price end.
  for (let i = 0; i < 10; i++) {
    console.log(`Turn ${i + 1}...`);
    await WETH.deposit({
      value: ethers.utils.parseEther("10000"),
    }).then((e) => e.wait());

    const WETH_Bal_1 = await WETH.balanceOf(await deployer.getAddress());
    const USDC_Bal_1 = await USDC.balanceOf(await deployer.getAddress());
    console.log("1. WETH:", ethers.utils.formatUnits(WETH_Bal_1, 18));
    console.log("1. USDC:", ethers.utils.formatUnits(USDC_Bal_1, 6));

    await uniswapRouter
      .exactInputSingle({
        tokenIn: WETH_ADDRESS,
        tokenOut: USDC_ADDRESS,
        fee: "500",
        recipient: await deployer.getAddress(),
        deadline: Math.floor(Date.now() / 1000) + 120,
        amountIn: WETH_Bal_1,
        amountOutMinimum: 0,
        sqrtPriceLimitX96: 0,
      })
      .then((e: any) => e.wait());
    await uniswapRouter.refundETH().then((e: any) => e.wait());

    const WETH_Bal_2 = await WETH.balanceOf(await deployer.getAddress());
    const USDC_Bal_2 = await USDC.balanceOf(await deployer.getAddress());
    console.log("2. WETH:", ethers.utils.formatUnits(WETH_Bal_2, 18));
    console.log("2. USDC:", ethers.utils.formatUnits(USDC_Bal_2, 6));

    await uniswapRouter
      .exactInputSingle({
        tokenIn: USDC_ADDRESS,
        tokenOut: WETH_ADDRESS,
        fee: "500",
        recipient: await deployer.getAddress(),
        deadline: Math.floor(Date.now() / 1000) + 120,
        amountIn: USDC_Bal_2,
        amountOutMinimum: 0,
        sqrtPriceLimitX96: 0,
      })
      .then((e: any) => e.wait());
    await uniswapRouter.refundETH().then((e: any) => e.wait());

    const WETH_Bal_3 = await WETH.balanceOf(await deployer.getAddress());
    const USDC_Bal_3 = await USDC.balanceOf(await deployer.getAddress());
    console.log("3. WETH:", ethers.utils.formatUnits(WETH_Bal_3, 18));
    console.log("3. USDC:", ethers.utils.formatUnits(USDC_Bal_3, 6));

    await USDC.transfer("0x000000000000000000000000000000000000dEaD", USDC_Bal_3).then((e) =>
      e.wait()
    );
    await WETH.transfer("0x000000000000000000000000000000000000dEaD", WETH_Bal_3).then((e) =>
      e.wait()
    );
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
