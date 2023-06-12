# Gelato PoC

The primary key of this proof of concept is test sponsored transactions with Gelato Relay funcionality.

The proof consists in calling a contract method that uses the msg.sender attribute (assuring that everything works as it should and the address is not a proxy contract) between 2 signed Gnosis Safes and check that all gas is being sponsored by a Gelato Relay with 1Balance method.

Requirements:

- 2 gnosis safes to be able to trust one another
- Private key of the safe's owner that is going to trust
- A Gelato API key

Bibliography:

- https://docs.safe.global/learn/safe-core/safe-core-account-abstraction-sdk/protocol-kit
- https://github.com/safe-global/safe-core-sdk/blob/main/guides/integrating-the-safe-core-sdk.md
- https://github.com/safe-global/safe-core-sdk/tree/main/packages/protocol-kit
- https://docs.gelato.network/developer-services/relay/non-erc-2771/sponsoredcall
