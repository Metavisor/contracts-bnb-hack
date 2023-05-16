import { deployments, ethers } from "hardhat";
import {
  RICH_GUY,
  UNISWAP_FACTORY,
  USDC_ADDRESS,
  USDC_WETH_500_POOL,
  WETH_ADDRESS,
} from "./constants";
import {
  MetavisorManagedVault,
  MetavisorRegistry,
  MetavisorRegistry__factory,
  IWETH9,
  IERC20MetadataUpgradeable,
  UniswapInteractionHelper__factory,
} from "../../typechain";
import {
  loadFixture,
  impersonateAccount,
  stopImpersonatingAccount,
} from "@nomicfoundation/hardhat-network-helpers";

export const DEFAULT_TWAP_INTERVAL = 60; // 60 sec
export const DEFAULT_PRICE_THRESHOLD = 110_00; // 1.10x

export async function getTokens() {
  const WETH = <IWETH9>await ethers.getContractAt("IWETH9", WETH_ADDRESS);
  const USDC = <IERC20MetadataUpgradeable>(
    await ethers.getContractAt("IERC20MetadataUpgradeable", USDC_ADDRESS)
  );

  const [deployer] = await ethers.getSigners();

  await impersonateAccount(RICH_GUY);

  const richSigner = await ethers.getImpersonatedSigner(RICH_GUY);

  const richWETH = WETH.connect(richSigner);
  const richUSDC = USDC.connect(richSigner);

  await richWETH
    .deposit({
      value: ethers.utils.parseEther("200"),
    })
    .then((e) => e.wait());
  await richWETH
    .transfer(deployer.getAddress(), ethers.utils.parseEther("200"))
    .then((e) => e.wait());
  await richUSDC
    .transfer(deployer.getAddress(), ethers.utils.parseUnits("2000000", 6))
    .then((e) => e.wait());

  await stopImpersonatingAccount(RICH_GUY);

  return { WETH, USDC };
}

export async function deployRegistry() {
  const LibraryFactory = <UniswapInteractionHelper__factory>(
    await ethers.getContractFactory("UniswapInteractionHelper")
  );
  const Library = await LibraryFactory.deploy();

  const Factory = <MetavisorRegistry__factory>await ethers.getContractFactory("MetavisorRegistry", {
    libraries: {
      UniswapInteractionHelper: Library.address,
    },
  });

  const MetavisorRegistry = await Factory.deploy(UNISWAP_FACTORY, WETH_ADDRESS, "5000");

  await MetavisorRegistry.setFeeParameters("0x3980A73f4159f867E6EEC7555D26622e53d356B9", "2000");

  return { MetavisorRegistry };
}

export async function deployVault() {
  const { MetavisorRegistry: registry } = await loadFixture(deployRegistry);

  await registry
    .deployVault(USDC_WETH_500_POOL, 0, {
      tickSpread: 200,
      tickOpen: 20,
      twapInterval: DEFAULT_TWAP_INTERVAL,
      priceThreshold: DEFAULT_PRICE_THRESHOLD,
    })
    .then((e) => e.wait());

  const vaultAddress = await registry.deployedVaults(USDC_WETH_500_POOL, 0);
  const MetavisorManagedVault = <MetavisorManagedVault>(
    await ethers.getContractAt("MetavisorManagedVault", vaultAddress)
  );

  return { MetavisorManagedVault };
}

const routerABI = [
  {
    inputs: [
      { internalType: "address", name: "_factory", type: "address" },
      { internalType: "address", name: "_WETH9", type: "address" },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    inputs: [],
    name: "WETH9",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          { internalType: "bytes", name: "path", type: "bytes" },
          { internalType: "address", name: "recipient", type: "address" },
          { internalType: "uint256", name: "deadline", type: "uint256" },
          { internalType: "uint256", name: "amountIn", type: "uint256" },
          { internalType: "uint256", name: "amountOutMinimum", type: "uint256" },
        ],
        internalType: "struct ISwapRouter.ExactInputParams",
        name: "params",
        type: "tuple",
      },
    ],
    name: "exactInput",
    outputs: [{ internalType: "uint256", name: "amountOut", type: "uint256" }],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          { internalType: "address", name: "tokenIn", type: "address" },
          { internalType: "address", name: "tokenOut", type: "address" },
          { internalType: "uint24", name: "fee", type: "uint24" },
          { internalType: "address", name: "recipient", type: "address" },
          { internalType: "uint256", name: "deadline", type: "uint256" },
          { internalType: "uint256", name: "amountIn", type: "uint256" },
          { internalType: "uint256", name: "amountOutMinimum", type: "uint256" },
          { internalType: "uint160", name: "sqrtPriceLimitX96", type: "uint160" },
        ],
        internalType: "struct ISwapRouter.ExactInputSingleParams",
        name: "params",
        type: "tuple",
      },
    ],
    name: "exactInputSingle",
    outputs: [{ internalType: "uint256", name: "amountOut", type: "uint256" }],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          { internalType: "bytes", name: "path", type: "bytes" },
          { internalType: "address", name: "recipient", type: "address" },
          { internalType: "uint256", name: "deadline", type: "uint256" },
          { internalType: "uint256", name: "amountOut", type: "uint256" },
          { internalType: "uint256", name: "amountInMaximum", type: "uint256" },
        ],
        internalType: "struct ISwapRouter.ExactOutputParams",
        name: "params",
        type: "tuple",
      },
    ],
    name: "exactOutput",
    outputs: [{ internalType: "uint256", name: "amountIn", type: "uint256" }],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          { internalType: "address", name: "tokenIn", type: "address" },
          { internalType: "address", name: "tokenOut", type: "address" },
          { internalType: "uint24", name: "fee", type: "uint24" },
          { internalType: "address", name: "recipient", type: "address" },
          { internalType: "uint256", name: "deadline", type: "uint256" },
          { internalType: "uint256", name: "amountOut", type: "uint256" },
          { internalType: "uint256", name: "amountInMaximum", type: "uint256" },
          { internalType: "uint160", name: "sqrtPriceLimitX96", type: "uint160" },
        ],
        internalType: "struct ISwapRouter.ExactOutputSingleParams",
        name: "params",
        type: "tuple",
      },
    ],
    name: "exactOutputSingle",
    outputs: [{ internalType: "uint256", name: "amountIn", type: "uint256" }],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [],
    name: "factory",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes[]", name: "data", type: "bytes[]" }],
    name: "multicall",
    outputs: [{ internalType: "bytes[]", name: "results", type: "bytes[]" }],
    stateMutability: "payable",
    type: "function",
  },
  { inputs: [], name: "refundETH", outputs: [], stateMutability: "payable", type: "function" },
  {
    inputs: [
      { internalType: "address", name: "token", type: "address" },
      { internalType: "uint256", name: "value", type: "uint256" },
      { internalType: "uint256", name: "deadline", type: "uint256" },
      { internalType: "uint8", name: "v", type: "uint8" },
      { internalType: "bytes32", name: "r", type: "bytes32" },
      { internalType: "bytes32", name: "s", type: "bytes32" },
    ],
    name: "selfPermit",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "token", type: "address" },
      { internalType: "uint256", name: "nonce", type: "uint256" },
      { internalType: "uint256", name: "expiry", type: "uint256" },
      { internalType: "uint8", name: "v", type: "uint8" },
      { internalType: "bytes32", name: "r", type: "bytes32" },
      { internalType: "bytes32", name: "s", type: "bytes32" },
    ],
    name: "selfPermitAllowed",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "token", type: "address" },
      { internalType: "uint256", name: "nonce", type: "uint256" },
      { internalType: "uint256", name: "expiry", type: "uint256" },
      { internalType: "uint8", name: "v", type: "uint8" },
      { internalType: "bytes32", name: "r", type: "bytes32" },
      { internalType: "bytes32", name: "s", type: "bytes32" },
    ],
    name: "selfPermitAllowedIfNecessary",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "token", type: "address" },
      { internalType: "uint256", name: "value", type: "uint256" },
      { internalType: "uint256", name: "deadline", type: "uint256" },
      { internalType: "uint8", name: "v", type: "uint8" },
      { internalType: "bytes32", name: "r", type: "bytes32" },
      { internalType: "bytes32", name: "s", type: "bytes32" },
    ],
    name: "selfPermitIfNecessary",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "token", type: "address" },
      { internalType: "uint256", name: "amountMinimum", type: "uint256" },
      { internalType: "address", name: "recipient", type: "address" },
    ],
    name: "sweepToken",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "token", type: "address" },
      { internalType: "uint256", name: "amountMinimum", type: "uint256" },
      { internalType: "address", name: "recipient", type: "address" },
      { internalType: "uint256", name: "feeBips", type: "uint256" },
      { internalType: "address", name: "feeRecipient", type: "address" },
    ],
    name: "sweepTokenWithFee",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "int256", name: "amount0Delta", type: "int256" },
      { internalType: "int256", name: "amount1Delta", type: "int256" },
      { internalType: "bytes", name: "_data", type: "bytes" },
    ],
    name: "uniswapV3SwapCallback",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "amountMinimum", type: "uint256" },
      { internalType: "address", name: "recipient", type: "address" },
    ],
    name: "unwrapWETH9",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "amountMinimum", type: "uint256" },
      { internalType: "address", name: "recipient", type: "address" },
      { internalType: "uint256", name: "feeBips", type: "uint256" },
      { internalType: "address", name: "feeRecipient", type: "address" },
    ],
    name: "unwrapWETH9WithFee",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  { stateMutability: "payable", type: "receive" },
];

export async function simulateFees() {
  const USDC = <IERC20MetadataUpgradeable>(
    await ethers.getContractAt("IERC20MetadataUpgradeable", USDC_ADDRESS)
  );
  const WETH = <IWETH9>await ethers.getContractAt("IWETH9", WETH_ADDRESS);

  await impersonateAccount(RICH_GUY);
  const richSigner = await ethers.getImpersonatedSigner(RICH_GUY);
  const richUSDC = USDC.connect(richSigner);
  const richWETH = WETH.connect(richSigner);

  const uniswapRouter = new ethers.Contract(
    "0xE592427A0AEce92De3Edee1F18E0157C05861564",
    routerABI,
    richSigner
  );

  await richUSDC.approve(uniswapRouter.address, ethers.constants.MaxUint256).then((e) => e.wait());
  await richWETH.approve(uniswapRouter.address, ethers.constants.MaxUint256).then((e) => e.wait());

  await richWETH
    .deposit({
      value: ethers.utils.parseEther("11000"),
    })
    .then((e) => e.wait());

  for (let i = 0; i < 5; i++) {
    console.log(`Turn ${i + 1}...`);

    await uniswapRouter
      .exactInputSingle({
        tokenIn: WETH_ADDRESS,
        tokenOut: USDC_ADDRESS,
        fee: "500",
        recipient: await richSigner.getAddress(),
        deadline: Math.floor(Date.now() / 1000) + 120,
        amountIn: ethers.utils.parseEther("10000"),
        amountOutMinimum: 0,
        sqrtPriceLimitX96: 0,
      })
      .then((e: any) => e.wait());
    await uniswapRouter.refundETH().then((e: any) => e.wait());

    await uniswapRouter
      .exactOutputSingle({
        tokenIn: USDC_ADDRESS,
        tokenOut: WETH_ADDRESS,
        fee: "500",
        recipient: await richSigner.getAddress(),
        deadline: Math.floor(Date.now() / 1000) + 120,
        amountOut: ethers.utils.parseEther("10000"),
        amountInMaximum: await USDC.balanceOf(await richSigner.getAddress()),
        sqrtPriceLimitX96: 0,
      })
      .then((e: any) => e.wait());
    await uniswapRouter.refundETH().then((e: any) => e.wait());
  }

  await stopImpersonatingAccount(RICH_GUY);
}
