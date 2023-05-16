# System Design

## User Accessible Functions

### MetavisorManagedVault

The entire vault is built on top of the ERC20 standard and behaves as expected.

#### `deposit`

The deposit functions takes two parameters, `amount0` and `amount1` which represents the amount of `token0` and `token1` to be deposited in the vault. The entire amounts is _always_ transferred and liquidity is added.

The shares are always calculated with respect to `token1` and normalized to the current available reserves in the vault.

The function is payable and will accept ETH in place of WETH, the interaction is controlled by the internal function `_transferReceive`

#### `withdraw`

The exact opposite of deposit, and allows withdrawing the percentage of the pool represented by `shares`. The calculation is much simpler and only returns the exact percentage as calculated against `totalSupply()`

This function also transfers protocol fees when withdrawing.

#### `compound`

Auto compounds the fees back into the pool. The internal function `_compound` takes a parameter which allows collecting before depositing back into the vault.

The flag is only turned off when withdrawing since that's the only time we've already collected the fees.

#### `canRescale`

This functions returns if the vault can be rescaled or not.

#### `rescale`

This is a privileged function, which can be turned public by the registry, which allows the vault to be readjusted based on the current parameters as well as the strategy spacing as provided by the registry.

#### `getVaultStatus`

Returns the current reserves in the vault.

### MetavisorRegistry

The registry is responsible for deploying new vaults and keeping note of them. Each vault works independently, although specific information such as the strategy and protocol config is provided directly by the registry.

All functions are pretty self explanatory.

Inherits Ownable2Step for 2 step transfer of ownership.

### UniswapInteractionHelper

This is the library that's used for all interactions to the pool, simplifies specific actions such as minting and burning liquidity.

#### `burnLiquidity`

Burns liquidity, returning the tokens back to the vault. It can burn a percentage or `everything`. It always collections all the fees available in the pool.

#### `mintLiquidity`

Mints liquidity provided the amountsMax on how much can be added for each of the tokens.

#### `swapToken`

Swaps token between `token0` and `token1`, calculates price impact to avoid drains.

#### `getAmountsForLiquidity` and `getLiquidityForAmounts`

Returns amounts for `token0` and `token1` given liquidity, and vice-versa.

#### `computeShares`

Calculates the exact shared for a given `amount0` and `amount1`

#### `pokePosition`

Pokes with a zero burn to update fees on the LP.

#### `getLiquidityInPosition`

Returns the current liquidity available in the LP.
