import hre, { ethers } from "hardhat";
import { MetavisorRegistry__factory } from "../../typechain";

async function main() {
  console.log(">>> Make sure to run compile before this!");

  console.log(ethers.utils.keccak256(MetavisorRegistry__factory.bytecode));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
