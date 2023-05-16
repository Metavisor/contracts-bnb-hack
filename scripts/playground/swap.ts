import hre, { ethers } from "hardhat";
import { IWETH9 } from "../../typechain";

const WETH = "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1";

const TOKEN0_ADDRESS: string = WETH; // WETH
const TOKEN1_ADDRESS: string = "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8"; // USDC

import { routerABI } from "./helper/uniswapAbi";

async function main() {
  await hre.run("compile");

  const [deployer] = await hre.ethers.getSigners();

  console.log("*********************************");
  console.log("Deploying the contracts with the account:", await deployer!.getAddress());
  console.log("Deploying on chain:", await deployer!.getChainId());
  console.log("Account balance:", (await deployer!.getBalance()).toString());
  console.log("Transaction count:", await deployer?.getTransactionCount());
  console.log("*********************************");

  const uniswapRouter = new ethers.Contract(
    "0xE592427A0AEce92De3Edee1F18E0157C05861564",
    routerABI,
    deployer
  );

  const Token0 = <IWETH9>(await ethers.getContractAt("IWETH9", TOKEN0_ADDRESS)).connect(deployer);
  const Token1 = <IWETH9>(await ethers.getContractAt("IWETH9", TOKEN1_ADDRESS)).connect(deployer);

  if (true) {
    await Token0.approve(uniswapRouter.address, ethers.constants.MaxUint256).then((e) => e.wait());
    await Token1.approve(uniswapRouter.address, ethers.constants.MaxUint256).then((e) => e.wait());
  }

  const targetAmount = ethers.utils.parseUnits("100", await Token0.decimals());

  for (let i = 0; i < 1; i++) {
    console.log(`Turn ${i + 1}...`);
    if (TOKEN0_ADDRESS === WETH) {
      await Token0.deposit({
        value: targetAmount,
      }).then((e) => e.wait());
    }

    console.log(
      "Token0:",
      await Token0.symbol(),
      ethers.utils.formatUnits(
        await Token0.balanceOf(await deployer.getAddress()),
        await Token0.decimals()
      )
    );
    console.log(
      "Token1:",
      await Token1.symbol(),
      ethers.utils.formatUnits(
        await Token1.balanceOf(await deployer.getAddress()),
        await Token1.decimals()
      )
    );

    await uniswapRouter
      .exactInputSingle({
        tokenIn: TOKEN0_ADDRESS,
        tokenOut: TOKEN1_ADDRESS,
        fee: "3000",
        recipient: await deployer.getAddress(),
        deadline: Math.floor(Date.now() / 1000) + 120,
        amountIn: targetAmount,
        amountOutMinimum: 0,
        sqrtPriceLimitX96: 0,
      })
      .then((e: any) => e.wait());
    await uniswapRouter.refundETH().then((e: any) => e.wait());

    console.log(
      "Token0:",
      await Token0.symbol(),
      ethers.utils.formatUnits(
        await Token0.balanceOf(await deployer.getAddress()),
        await Token0.decimals()
      )
    );
    console.log(
      "Token1:",
      await Token1.symbol(),
      ethers.utils.formatUnits(
        await Token1.balanceOf(await deployer.getAddress()),
        await Token1.decimals()
      )
    );
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
