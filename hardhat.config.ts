import "dotenv/config";
import "@typechain/hardhat";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-chai-matchers";
import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-etherscan";
import "@openzeppelin/hardhat-upgrades";
import "hardhat-gas-reporter";
import "hardhat-contract-sizer";
import "hardhat-abi-exporter";
import "hardhat-deploy";

import { HardhatUserConfig } from "hardhat/config";
import { SolcUserConfig } from "hardhat/types";
import { ethers } from "ethers";

const mnemonic =
  process.env.HARDHAT_MNEMONIC || "test test test test test test test test test test test junk";

const COMPILER_SETTINGS: SolcUserConfig[] = [
  {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true,
      metadata: {
        bytecodeHash: "none",
      },
    },
  },
];

const config: HardhatUserConfig = {
  defaultNetwork: "arbitrum",
  abiExporter: {
    path: "./abi",
  },
  paths: {
    artifacts: "./artifacts",
    cache: "./cache",
    sources: "./contracts",
    deploy: "./deploy",
  },
  typechain: {
    outDir: "./typechain",
    target: "ethers-v5",
  },
  namedAccounts: {
    deployer: 1,
  },
  gasReporter: {
    enabled: true,
    currency: "USD",
    token: "ETH",
    // coinmarketcap: "",
  },
  networks: {
    hardhat: {
      forking: {
        url: "https://rpc.ankr.com/eth",
        // blockNumber: 16547700,
      },
      chainId: 1,
      autoImpersonate: true,
      accounts: {
        mnemonic,
        // accountsBalance: ethers.utils.parseEther("10000").toString(),
      },
      // saveDeployments: true,
    },
    goerli: {
      url: "https://goerli.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161",
      accounts: {
        mnemonic,
      },
    },
    ethereum: {
      url: "https://rpc.ankr.com/eth",
      accounts: {
        mnemonic,
      },
    },
    optimism: {
      url: "https://rpc.ankr.com/optimism",
      accounts: {
        mnemonic,
      },
    },
    arbitrum: {
      url: "https://arb1.arbitrum.io/rpc",
      accounts: {
        mnemonic,
      },
    },
    polygon: {
      url: "https://polygon-rpc.com",
      accounts: {
        mnemonic,
      },
    },
    bsc: {
      url: "https://rpc.ankr.com/bsc",
      accounts: {
        mnemonic,
      },
    },
    anvil: {
      url: "http://127.0.0.1:8545/",
      timeout: 0,
      accounts: {
        mnemonic,
      },
    },
  },
  solidity: {
    compilers: COMPILER_SETTINGS,
  },
  contractSizer: {
    alphaSort: true,
    runOnCompile: true,
    disambiguatePaths: false,
  },
  mocha: {
    timeout: 0,
  },
};

export default config;
