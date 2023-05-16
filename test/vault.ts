import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

import {
  simulateFees,
  deployRegistry,
  deployVault,
  getTokens,
  DEFAULT_TWAP_INTERVAL,
  DEFAULT_PRICE_THRESHOLD,
} from "./helpers/fixtures";

import { ethers } from "hardhat";

describe("Metavisor Vault", function () {
  it("Deposit", async function () {
    const { MetavisorManagedVault } = await loadFixture(deployVault);
    const { WETH, USDC } = await loadFixture(getTokens);

    await USDC.approve(MetavisorManagedVault.address, ethers.constants.MaxUint256).then((e) =>
      e.wait()
    );
    await WETH.approve(MetavisorManagedVault.address, ethers.constants.MaxUint256).then((e) =>
      e.wait()
    );

    expect(await MetavisorManagedVault.totalSupply()).to.equal(ethers.BigNumber.from(0));

    await MetavisorManagedVault.deposit(
      ethers.utils.parseUnits("5349.5074", 6),
      ethers.utils.parseUnits("2", 18),
      0,
      0
    ).then((e) => e.wait());

    expect((await MetavisorManagedVault.totalSupply()).gt(ethers.BigNumber.from(0))).to.be.true;
  });

  it("Deposit + Withdraw", async function () {
    const { MetavisorManagedVault } = await loadFixture(deployVault);
    const { WETH, USDC } = await loadFixture(getTokens);
    const [deployer] = await ethers.getSigners();

    await USDC.approve(MetavisorManagedVault.address, ethers.constants.MaxUint256).then((e) =>
      e.wait()
    );
    await WETH.approve(MetavisorManagedVault.address, ethers.constants.MaxUint256).then((e) =>
      e.wait()
    );

    await MetavisorManagedVault.deposit(
      ethers.utils.parseUnits("10000", 6),
      ethers.utils.parseUnits("3", 18),
      0,
      0
    ).then((e) => e.wait());

    const WETHBalPre = await WETH.balanceOf(deployer.getAddress());
    const USDCBalPre = await USDC.balanceOf(deployer.getAddress());

    await MetavisorManagedVault.withdraw(
      await MetavisorManagedVault.balanceOf(await deployer.getAddress()),
      false,
      0,
      0
    ).then((e) => e.wait());

    const WETHBalPost = await WETH.balanceOf(deployer.getAddress());
    const USDCBalPost = await USDC.balanceOf(deployer.getAddress());

    expect(await MetavisorManagedVault.totalSupply()).to.equal(0);
    expect(USDCBalPost.sub(USDCBalPre)).to.equal(ethers.utils.parseUnits("10000", 6).sub(1));
    expect(WETHBalPost.sub(WETHBalPre)).to.equal(ethers.utils.parseUnits("3", 18).sub(1));
  });

  it("Deposit + Withdraw, with ETH", async function () {
    const { MetavisorManagedVault } = await loadFixture(deployVault);
    const { WETH, USDC } = await loadFixture(getTokens);
    const [deployer] = await ethers.getSigners();

    await USDC.approve(MetavisorManagedVault.address, ethers.constants.MaxUint256).then((e) =>
      e.wait()
    );
    // await WETH.approve(MetavisorManagedVault.address, ethers.constants.MaxUint256).then((e) =>
    //   e.wait()
    // );

    await MetavisorManagedVault.deposit(
      ethers.utils.parseUnits("10000", 6),
      ethers.utils.parseUnits("3", 18),
      0,
      0,
      {
        value: ethers.utils.parseUnits("3", 18),
      }
    ).then((e) => e.wait());

    const ETHBalPre = await deployer.getBalance();
    const USDCBalPre = await USDC.balanceOf(deployer.getAddress());

    await MetavisorManagedVault.withdraw(
      await MetavisorManagedVault.balanceOf(await deployer.getAddress()),
      true,
      0,
      0
    ).then((e) => e.wait());

    const ETHBalPost = await deployer.getBalance();
    const USDCBalPost = await USDC.balanceOf(deployer.getAddress());

    expect(await MetavisorManagedVault.totalSupply()).to.equal(0);
    expect(USDCBalPost.sub(USDCBalPre)).to.equal(ethers.utils.parseUnits("10000", 6).sub(1));
    expect(ETHBalPost.sub(ETHBalPre)).to.be.gt(ethers.utils.parseUnits("2.9", 18)); // We can't quite get a perfect number because of gas used.

    await expect(
      deployer.sendTransaction({
        to: MetavisorManagedVault.address,
        value: ethers.utils.parseUnits("1", 18),
      })
    ).to.be.reverted;
  });

  it("Withdraw with Fees, without rescaling", async function () {
    const { MetavisorManagedVault } = await loadFixture(deployVault);
    const { WETH, USDC } = await loadFixture(getTokens);
    const [deployer] = await ethers.getSigners();

    await WETH.approve(MetavisorManagedVault.address, ethers.constants.MaxUint256).then((e) =>
      e.wait()
    );
    await USDC.approve(MetavisorManagedVault.address, ethers.constants.MaxUint256).then((e) =>
      e.wait()
    );

    await MetavisorManagedVault.deposit(
      ethers.utils.parseUnits("10000", 6),
      ethers.utils.parseUnits("3", 18),
      0,
      0
    ).then((e) => e.wait());

    const USDCBal_2 = await USDC.balanceOf(deployer.getAddress());
    const WETHBal_2 = await WETH.balanceOf(deployer.getAddress());

    const vaultStatus1 = await MetavisorManagedVault.callStatic.getVaultStatus();
    expect(vaultStatus1.fees0.eq(0) && vaultStatus1.fees1.eq(0)).to.be.true;

    await simulateFees();

    const vaultStatus2 = await MetavisorManagedVault.callStatic.getVaultStatus();
    expect(vaultStatus2.fees0.gt(0) && vaultStatus2.fees1.gt(0)).to.be.true;

    await MetavisorManagedVault.withdraw(
      MetavisorManagedVault.balanceOf(deployer.getAddress()),
      false,
      0,
      0
    ).then((e) => e.wait());

    const USDCBal_3 = await USDC.balanceOf(deployer.getAddress());
    const WETHBal_3 = await WETH.balanceOf(deployer.getAddress());

    const USDC_CHANGE = USDCBal_3.sub(USDCBal_2);
    const WETH_CHANGE = WETHBal_3.sub(WETHBal_2);

    // console.log({
    //   USDC: ethers.utils.formatUnits(USDC_CHANGE, 6),
    //   WETH: ethers.utils.formatUnits(WETH_CHANGE, 18),
    // });

    expect(await MetavisorManagedVault.totalSupply()).to.equal(0);
    expect(USDC_CHANGE).to.be.gt(ethers.utils.parseUnits("10000", 6));
    expect(WETH_CHANGE).to.be.gt(ethers.utils.parseUnits("3", 18));
  });

  it("Rescale - failure", async function () {
    const { MetavisorManagedVault } = await loadFixture(deployVault);
    const { WETH, USDC } = await loadFixture(getTokens);

    await WETH.approve(MetavisorManagedVault.address, ethers.constants.MaxUint256).then((e) =>
      e.wait()
    );
    await USDC.approve(MetavisorManagedVault.address, ethers.constants.MaxUint256).then((e) =>
      e.wait()
    );

    await MetavisorManagedVault.deposit(
      ethers.utils.parseUnits("10000", 6),
      ethers.utils.parseUnits("3", 18),
      0,
      0
    ).then((e) => e.wait());

    expect(MetavisorManagedVault.rescale(1e5 / 2)).to.be.reverted;
  });

  it("Rescale - success", async function () {
    const { MetavisorRegistry } = await loadFixture(deployRegistry);
    const { MetavisorManagedVault } = await loadFixture(deployVault);
    const { WETH, USDC } = await loadFixture(getTokens);

    await WETH.approve(MetavisorManagedVault.address, ethers.constants.MaxUint256).then((e) =>
      e.wait()
    );
    await USDC.approve(MetavisorManagedVault.address, ethers.constants.MaxUint256).then((e) =>
      e.wait()
    );

    await MetavisorManagedVault.deposit(
      ethers.utils.parseUnits("10000", 6),
      ethers.utils.parseUnits("3", 18),
      0,
      0
    ).then((e) => e.wait());

    await MetavisorRegistry.setVaultSpec(MetavisorManagedVault.address, {
      tickSpread: 250,
      tickOpen: 250,
      twapInterval: DEFAULT_TWAP_INTERVAL,
      priceThreshold: DEFAULT_PRICE_THRESHOLD,
    });

    const vaultStatus1 = await MetavisorManagedVault.callStatic.getVaultStatus();
    await MetavisorManagedVault.rescale(1e5 / 2);
    const vaultStatus2 = await MetavisorManagedVault.callStatic.getVaultStatus();

    // The entered liquidity is imbalanced, so this should add more liquidity.
    expect(vaultStatus2.liquidity.gt(vaultStatus1.liquidity)).to.be.true;
  });

  it("Compound", async function () {
    const { MetavisorRegistry } = await loadFixture(deployRegistry);
    const { MetavisorManagedVault } = await loadFixture(deployVault);
    const { WETH, USDC } = await loadFixture(getTokens);

    await WETH.approve(MetavisorManagedVault.address, ethers.constants.MaxUint256).then((e) =>
      e.wait()
    );
    await USDC.approve(MetavisorManagedVault.address, ethers.constants.MaxUint256).then((e) =>
      e.wait()
    );

    await MetavisorManagedVault.deposit(
      ethers.utils.parseUnits("10000", 6),
      ethers.utils.parseUnits("3", 18),
      0,
      0
    ).then((e) => e.wait());
    await MetavisorRegistry.setVaultSpec(MetavisorManagedVault.address, {
      tickSpread: 250,
      tickOpen: 250,
      twapInterval: DEFAULT_TWAP_INTERVAL,
      priceThreshold: DEFAULT_PRICE_THRESHOLD,
    });
    await MetavisorManagedVault.rescale(1e5 / 2);

    const vaultStatus1 = await MetavisorManagedVault.callStatic.getVaultStatus();
    expect(vaultStatus1.fees0.eq(0) && vaultStatus1.fees1.eq(0)).to.be.true;

    await simulateFees();

    const vaultStatus2 = await MetavisorManagedVault.callStatic.getVaultStatus();
    expect(vaultStatus2.fees0.gt(0) && vaultStatus2.fees1.gt(0)).to.be.true;

    await MetavisorManagedVault.compound();

    const vaultStatus3 = await MetavisorManagedVault.callStatic.getVaultStatus();
    expect(vaultStatus3.fees0.eq(0) && vaultStatus3.fees1.eq(0)).to.be.true;
    expect(vaultStatus3.liquidity.gt(vaultStatus2.liquidity)).to.be.true;
  });
});
