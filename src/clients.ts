import {
  Capsule,
  WalletType,
  PregenIdentifierType,
  Wallet,
} from "@usecapsule/server-sdk"
import {
  createCapsuleViemClient,
  createCapsuleAccount,
} from "@usecapsule/viem-v2-integration"
import { createModularAccountAlchemyClient } from "@alchemy/aa-alchemy"
import {
  WalletClientSigner,
  arbitrumSepolia,
  LocalAccountSigner,
} from "@alchemy/aa-core"
import { http, WalletClientConfig, WalletClient } from "viem"
import {
  CAPSULE_API_KEY,
  CAPSULE_ENVIRONMENT,
  ALCHEMY_RPC_URL,
  ALCHEMY_API_KEY,
  ALCHEMY_GAS_POLICY_ID,
  PRIVATE_KEY,
} from "./constants"
import { getUserShareFromDatabase, storeUserShare } from "./database"

export async function initializeCapsule() {
  return new Capsule(CAPSULE_ENVIRONMENT, CAPSULE_API_KEY)
}

export async function createOrGetPregenWallet(
  capsule: Capsule,
  email: string
): Promise<Wallet | undefined> {
  const hasWallet = await capsule.hasPregenWallet(
    email,
    PregenIdentifierType.EMAIL
  )
  let pregenWallet: Wallet | undefined
  let userShare: string

  if (!hasWallet) {
    pregenWallet = await capsule.createWalletPreGen(
      WalletType.EVM,
      email,
      PregenIdentifierType.EMAIL
    )
    userShare = (await capsule.getUserShare()) ?? ""

    await storeUserShare(email, userShare)
  } else {
    userShare = (await getUserShareFromDatabase(email)) ?? ""
    if (!userShare) {
      throw new Error("User share not found for existing wallet")
    }
    await capsule.setUserShare(userShare)
    pregenWallet = Object.values(await capsule.getWallets())[0]
  }

  return pregenWallet
}

export function createViemClient(capsule: Capsule): WalletClient {
  const walletClientConfig: WalletClientConfig = {
    chain: arbitrumSepolia,
    transport: http(ALCHEMY_RPC_URL),
  }

  const viemClient = createCapsuleViemClient(capsule, walletClientConfig)

  return viemClient
}

export async function createAlchemyClient(viemClient: WalletClient) {
  const walletClientSigner: WalletClientSigner = new WalletClientSigner(
    viemClient,
    "capsule" // signerType
  )

  const client = await createModularAccountAlchemyClient({
    apiKey: ALCHEMY_API_KEY,
    chain: arbitrumSepolia,
    signer: walletClientSigner,
    // signer: LocalAccountSigner.privateKeyToAccountSigner(`0x${PRIVATE_KEY}`),
    gasManagerConfig: {
      policyId: ALCHEMY_GAS_POLICY_ID,
    },
  })

  const isDeployed = await client.account.isAccountDeployed()
  console.log("Is account deployed:", isDeployed)

  const initCode = isDeployed ? "0x" : await client.account.getInitCode()
  console.log("InitCode:", initCode)

  const nonce = isDeployed ? await client.account.getNonce() : 0n
  console.log("Nonce:", nonce.toString())

  return client
}
