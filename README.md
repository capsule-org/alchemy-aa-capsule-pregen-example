# Alchemy AA + Capsule PreGen Example

This example demonstrates how to create and use Capsule's PreGen wallet on a server with Alchemy's AA libraries.

## Overview

When a POST message is received on the root path, the example will create or retrieve a new PreGen wallet. Here's how it works:

1. A wallet is pregenerated with the Capsule client, creating a wallet share.
2. The wallet share is set on the Capsule client and must be stored for future actions.
3. A Viem Client instance is created using the Capsule Client.
4. The Viem Client is passed to Alchemy to create an Alchemy client.
5. A simple userOps array is constructed and executed on a predeployed Alchemy contract.

## Important Notes

### Wallet Shares

For this simple example, we store the userShare string in a JSON file. However, best practice is to store this securely in a database.

> **Warning:** The wallet share is sensitive content encoded in base64. We recommend encrypting it before storing, following best practices.

### Custom Sign Message

In `src/clients.ts`, you'll find a `customSignMessage` function. This is a temporary fix for userOps due to the nature of DKLS signatures used by Capsule.

> **Note:** This is not a long-term solution. Keep an eye out for patch changes to Capsule libraries for fixes to this issue.

### Gas Sponsorship

Configure your Gas Manager in Alchemy's client dashboard. The policy needs to be passed into the Alchemy client when it's being created for Gas sponsorship.

## Getting Started

1. Use Yarn to install dependencies:

   ```
   yarn
   ```

2. Start the dev server:

   ```
   yarn dev
   ```

3. Use the server by sending a POST request to the root path:

   ```
   curl -X POST http://localhost:3000/ -H "Content-Type: application/json" -d '{"email": "your_test_email@your_app_domain.com"}'
   ```

   The email is used to generate the PreGen Wallet with Capsule and will be associated with that pregenerated wallet.

## Setup

1. Set all ENV variables as shown in `.env.example`.
2. Create an appropriate env file (e.g., `.env` or `.env.local`) with your API keys for Capsule and Alchemy.

## Best Practices

- Split wallet creation and retrieval as needed by your application.
- Always retrieve and set the userShare after checking if the associated email has a PreGen wallet.
- Securely encrypt and store the userShare after creation for future use.
- You can use any Capsule client (Viem, Ethers, etc.) server-side with PreGen.
- For performance, optimize by creating clients once and not on every request to the path.

> **Important:** DO NOT delete the `user_shares.json` file or its content without backing it up. Losing the userShares will result in loss of that account.

For more information on using PreGen with Capsule, visit our [documentation](https://docs.usecapsule.com/integration-guides/wallet-pregeneration).

## Additional Resources

- [Alchemy AA SDK UserOps Example](https://github.com/alchemyplatform/aa-sdk-userops)
