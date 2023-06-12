import * as dotenv from "dotenv";

dotenv.config();

import fetch from "node-fetch";
import { ethers } from "ethers";
import Safe, {
  EthersAdapter,
  getSafeContract,
} from "@safe-global/protocol-kit";
import { GelatoRelay } from "@gelatonetwork/relay-sdk";

import { getAbis } from "./utils.js";

const {
  CHAIN_ID,
  RPC_URL,
  HUB_CONTRACT_ADDRESS,
  ACCOUNT_PRIVATE_KEY,
  SENDER_SAFE_ADDRESS,
  DESTINATION_SAFE_ADDRESS,
  GELATO_RELAY_API_KEY,
} = process.env;
const { hubAbi } = getAbis();

(async () => {
  // Prepare transaction signer.
  const signer = new ethers.Wallet(
    ACCOUNT_PRIVATE_KEY,
    new ethers.providers.JsonRpcProvider(RPC_URL)
  );
  // Create ethers signer adapter for safe-sdk.
  const ethAdapter = new EthersAdapter({
    ethers,
    signerOrProvider: signer,
  });
  // Instantiate already existing safe.
  const safeSDK = await Safe.default.create({
    ethAdapter,
    safeAddress: SENDER_SAFE_ADDRESS,
  });
  // Use contract method. In this case we use the trust method just because has complex functionality and validation.
  const hubContract = new ethers.Contract(HUB_CONTRACT_ADDRESS, hubAbi);
  const { data } = await hubContract.populateTransaction.trust(
    DESTINATION_SAFE_ADDRESS,
    100
  );
  // Create transaction through the instantiated safe.
  const safeTransaction = await safeSDK.createTransaction({
    safeTransactionData: {
      to: HUB_CONTRACT_ADDRESS,
      value: 0,
      data,
      operation: 0,
    },
  });
  // Sign transaction.
  const signedSafeTx = await safeSDK.signTransaction(safeTransaction);
  const safeSingletonContract = await getSafeContract({
    ethAdapter,
    safeVersion: await safeSDK.getContractVersion(),
  });
  // Encode transaction.
  const encodedTx = safeSingletonContract.encode("execTransaction", [
    signedSafeTx.data.to,
    signedSafeTx.data.value,
    signedSafeTx.data.data,
    signedSafeTx.data.operation,
    signedSafeTx.data.safeTxGas,
    signedSafeTx.data.baseGas,
    signedSafeTx.data.gasPrice,
    signedSafeTx.data.gasToken,
    signedSafeTx.data.refundReceiver,
    signedSafeTx.encodedSignatures(),
  ]);

  const relay = new GelatoRelay();
  // When using more than 5 requests crashes.
  // Gelato just does not accept more than 5 req/min in Free Tier.
  const numberOfRequests = 1;

  // Relaying the call with Gelato.
  await Promise.all(
    // Functionality to call gelato X times based on `numberOfRequest` variable.
    Array.from(Array(numberOfRequests).keys()).map(() =>
      // Send the relay request using Gelato Relay!
      relay
        .sponsoredCall(
          {
            target: SENDER_SAFE_ADDRESS,
            data: encodedTx,
            chainId: CHAIN_ID,
          },
          GELATO_RELAY_API_KEY
        )
        .then(({ taskId }) => {
          console.log(
            `Getting gelato task status: https://relay.gelato.digital/tasks/status/${taskId}`
          );
          return new Promise((resolve, reject) =>
            setTimeout(
              () =>
                fetch(`https://relay.gelato.digital/tasks/status/${taskId}`)
                  .then((response) => resolve(response.json()))
                  .catch(reject),
              2000
            )
          );
        })
        .then((result) => console.log(result))
    )
  ).catch((err) => console.error(err));
})();
