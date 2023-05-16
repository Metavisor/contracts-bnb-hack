import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { ethers } from "hardhat";

import {
  UNISWAP_FACTORY,
  USDC_ADDRESS,
  USDC_WETH_500_POOL,
  WETH_ADDRESS,
} from "./helpers/constants";
import { deployRegistry, deployVault, getTokens } from "./helpers/fixtures";

describe("Metavisor Deploy", function () {
  it("Deploy Registry", async function () {
    const { MetavisorRegistry } = await loadFixture(deployRegistry);

    expect(await MetavisorRegistry.uniswapFactory()).to.equal(UNISWAP_FACTORY);
    expect(await MetavisorRegistry.weth()).to.equal(WETH_ADDRESS);
  });

  it("Deploy Vault", async function () {
    const { MetavisorManagedVault } = await loadFixture(deployVault);

    expect(await MetavisorManagedVault.pool()).to.equal(USDC_WETH_500_POOL);
    expect(await MetavisorManagedVault.token0()).to.equal(USDC_ADDRESS);
    expect(await MetavisorManagedVault.token1()).to.equal(WETH_ADDRESS);
  });

  it("Verify Params", async function () {
    const { MetavisorManagedVault } = await loadFixture(deployVault);

    expect(await MetavisorManagedVault.name()).to.equal("Metavisor USDC/WETH-500 Vault A");
    expect(await MetavisorManagedVault.symbol()).to.equal("MVR-USDC/WETH-500-A");
  });
});
