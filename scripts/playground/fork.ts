import axios from "axios";

const TENDERLY_API = "https://api.tenderly.co/api/v1";
const ACCESS_KEY = `dDvVNrymEfkOKxwpWzDD1t8Bs5rqIXXZ`;

const createFork = async (network: string): Promise<string> => {
  const forkConfig = {
    alias: `Sandbox Fork: ${Date.now()}`,
    block_number: null,
    description: "Public Sandbox Fork",
    network_id: network,
    details: {
      chain_config: {
        chain_id: "1337",
      },
    },
  };

  const forkResponse = await axios
    .post(`${TENDERLY_API}/account/sandboxes/project/sandboxes/fork`, forkConfig, {
      headers: {
        "X-ACCESS-KEY": ACCESS_KEY,
      },
    })
    .then((e) => e.data);
  console.log(forkResponse);

  return `https://rpc.tenderly.co/fork/${forkResponse.simulation_fork.id}`;
};

async function main() {
  console.log({
    ethereum: await createFork("1"),
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
