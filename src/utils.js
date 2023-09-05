import HubContract from "@circles/circles-contracts/build/contracts/Hub.json" assert { type: "json" };

function getAbis() {
  return {
    hubAbi: HubContract.abi,
  };
}

export { getAbis };
