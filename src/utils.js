import HubContract from "@circles/circles-contracts/build/contracts/Hub.json" assert { type: "json", integrity: "sha384-ABC123" };

function getAbis() {
  return {
    hubAbi: HubContract.abi,
  };
}

export { getAbis };
