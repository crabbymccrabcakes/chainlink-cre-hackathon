import {
  bytesToHex,
  CronCapability,
  EVMClient,
  encodeCallMsg,
  getNetwork,
  handler,
  isChainSelectorSupported,
  LAST_FINALIZED_BLOCK_NUMBER,
  Runner,
  type Runtime,
} from '@chainlink/cre-sdk'
import { type Address, decodeFunctionResult, encodeFunctionData, zeroAddress } from 'viem'
import { z } from 'zod'

import { AGGREGATOR_V3_ABI } from './abi'

const configSchema = z.object({
  schedule: z.string(),
  feeds: z.array(
    z.object({
      label: z.string(),
      chainSelectorName: z.string(),
      proxyAddress: z.string(),
    }),
  ),
})

type Config = z.infer<typeof configSchema>

const onCronTrigger = (runtime: Runtime<Config>) => {
  const results: Array<{
    label: string
    answer: string
    updatedAt: string
  }> = []

  for (const feed of runtime.config.feeds) {
    if (!isChainSelectorSupported(feed.chainSelectorName)) {
      throw new Error(`Unsupported chain selector: ${feed.chainSelectorName}`)
    }

    const network = getNetwork({
      chainFamily: 'evm',
      chainSelectorName: feed.chainSelectorName,
      isTestnet: true,
    })

    if (!network) throw new Error(`Network not found: ${feed.chainSelectorName}`)

    const evmClient = new EVMClient(network.chainSelector.selector)

    const latestRoundDataCall = encodeFunctionData({
      abi: AGGREGATOR_V3_ABI,
      functionName: 'latestRoundData',
    })

    const response = evmClient
      .callContract(runtime, {
        call: encodeCallMsg({
          from: zeroAddress,
          to: feed.proxyAddress as Address,
          data: latestRoundDataCall,
        }),
        blockNumber: LAST_FINALIZED_BLOCK_NUMBER,
      })
      .result()

    const decoded = decodeFunctionResult({
      abi: AGGREGATOR_V3_ABI,
      functionName: 'latestRoundData',
      data: bytesToHex(response.data),
    }) as readonly [bigint, bigint, bigint, bigint, bigint]

    const answer = decoded[1]
    const updatedAt = decoded[3]

    runtime.log(`[${feed.label}] answer=${answer.toString()} updatedAt=${updatedAt.toString()}`)

    results.push({
      label: feed.label,
      answer: answer.toString(),
      updatedAt: updatedAt.toString(),
    })
  }

  return results
}

const initWorkflow = (config: Config) => {
  const cron = new CronCapability()
  return [handler(cron.trigger({ schedule: config.schedule }), onCronTrigger)]
}

export async function main() {
  const runner = await Runner.newRunner<Config>({ configSchema })
  await runner.run(initWorkflow)
}
