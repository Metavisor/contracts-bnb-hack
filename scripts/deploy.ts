import hre, { ethers } from "hardhat";
import { MetavisorRegistry__factory } from "../typechain";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const ImmutableFactoryABI = [
  {
    constant: true,
    inputs: [{ name: "deploymentAddress", type: "address" }],
    name: "hasBeenDeployed",
    outputs: [{ name: "", type: "bool" }],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    constant: false,
    inputs: [
      { name: "salt", type: "bytes32" },
      { name: "initializationCode", type: "bytes" },
    ],
    name: "safeCreate2",
    outputs: [{ name: "deploymentAddress", type: "address" }],
    payable: true,
    stateMutability: "payable",
    type: "function",
  },
  {
    constant: true,
    inputs: [
      { name: "salt", type: "bytes32" },
      { name: "initCode", type: "bytes" },
    ],
    name: "findCreate2Address",
    outputs: [{ name: "deploymentAddress", type: "address" }],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    constant: true,
    inputs: [
      { name: "salt", type: "bytes32" },
      { name: "initCodeHash", type: "bytes32" },
    ],
    name: "findCreate2AddressViaHash",
    outputs: [{ name: "deploymentAddress", type: "address" }],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
];

async function main() {
  await hre.run("compile");

  const [deployer] = await hre.ethers.getSigners();

  console.log("Deploying the contracts with the account:", await deployer!.getAddress());
  console.log("Deploying on chain:", await deployer!.getChainId());
  console.log("Account balance:", (await deployer!.getBalance()).toString());
  console.log("Transaction count:", await deployer?.getTransactionCount());
  console.log(">>> Connecting to Immutable Factory...");

  const factory = new ethers.Contract(
    "0x0000000000FFe8B47B3e2130213B802212439497",
    ImmutableFactoryABI,
    deployer
  );

  const expectedAddr = await factory.findCreate2Address(
    "0xd1b06ee2d69d5c03514f095204217ec7b790c9475104aa685df65e23e764e562",
    MetavisorRegistry__factory.bytecode
  );
  console.log(">>> Expected Address:", expectedAddr);

  const addr = await factory.callStatic.safeCreate2(
    "0xd1b06ee2d69d5c03514f095204217ec7b790c9475104aa685df65e23e764e562",
    MetavisorRegistry__factory.bytecode +
      "0000000000000000000000001f98431c8ad98523631ae4a59f267346ea31f984000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20000000000000000000000000000000000000000000000000000000000001388"
  );
  console.log(">>> Expected Address:", addr);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
