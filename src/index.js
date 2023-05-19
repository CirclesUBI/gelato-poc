import * as dotenv from "dotenv";

dotenv.config();

import { ethers } from "ethers";
import { GelatoRelay } from "@gelatonetwork/relay-sdk";

import { getAbis } from "./utils.js";

const {
  CHAIN_ID,
  RPC_URL,
  GAS_LIMIT,
  HUB_CONTRACT_ADDRESS,
  ACCOUNT_PRIVATE_ADDRESS,
  SENDER_SAFE_ADDRESS,
  DESTINATION_SAFE_ADDRESS,
  GELATO_RELAY_API_KEY,
} = process.env;
const { hubAbi } = getAbis();

(async () => {
  const relay = new GelatoRelay();
  const signer = new ethers.Wallet(
    ACCOUNT_PRIVATE_ADDRESS,
    new ethers.providers.JsonRpcProvider(RPC_URL)
  );
  const hubContract = new ethers.Contract(HUB_CONTRACT_ADDRESS, hubAbi, signer);
  const { data } = await hubContract.trust(DESTINATION_SAFE_ADDRESS, 100);
  // Populate a relay request
  const request = {
    chainId: CHAIN_ID,
    target: DESTINATION_SAFE_ADDRESS,
    data: data,
  };

  // Send the relay request using Gelato Relay!
  await Promise.all(
    // When using more than 5 it crashes, gelato just does not accept more than 5 req/min
    Array.from(Array(1).keys()).map(() =>
      relay.sponsoredCall(request, GELATO_RELAY_API_KEY).then(({ taskId }) => {
        console.log(
          `Relay Transaction Task ID: https://relay.gelato.digital/tasks/status/${taskId}`
        );
      })
    )
  ).catch((err) => console.error(err));
})();
