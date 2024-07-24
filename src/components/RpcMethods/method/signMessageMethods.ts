import {
  MessageTypes,
  recoverTypedSignature,
  SignTypedDataVersion,
  TypedDataV1,
  TypedMessage,
} from '@metamask/eth-sig-util';
import { createPublicClient, http } from 'viem';
import * as chains from 'viem/chains';

import { parseMessage } from '../shortcut/ShortcutType';
import { RpcRequestInput } from './RpcRequestInput';

const ethSign: RpcRequestInput = {
  method: 'eth_sign',
  params: [
    { key: 'message', required: true },
    { key: 'address', required: true },
  ],
  format: (data: Record<string, string>) => [
    data.address,
    `0x${Buffer.from(data.message, 'utf8').toString('hex')}`,
  ],
};

const personalSign: RpcRequestInput = {
  method: 'personal_sign',
  params: [
    { key: 'message', required: true },
    { key: 'address', required: true },
  ],
  format: (data: Record<string, string>) => [
    `0x${Buffer.from(data.message, 'utf8').toString('hex')}`,
    data.address,
  ],
};

const ethSignTypedDataV1: RpcRequestInput = {
  method: 'eth_signTypedData_v1',
  params: [
    { key: 'message', required: true },
    { key: 'address', required: true },
  ],
  format: (data: Record<string, string>) => [parseMessage(data.message), data.address],
};

const ethSignTypedDataV3: RpcRequestInput = {
  method: 'eth_signTypedData_v3',
  params: [
    { key: 'message', required: true },
    { key: 'address', required: true },
  ],
  format: (data: Record<string, string>) => [data.address, parseMessage(data.message)],
};

const ethSignTypedDataV4: RpcRequestInput = {
  method: 'eth_signTypedData_v4',
  params: [
    { key: 'message', required: true },
    { key: 'address', required: true },
  ],
  format: (data: Record<string, string>) => [data.address, parseMessage(data.message)],
};

export const signMessageMethods = [
  ethSign,
  personalSign,
  ethSignTypedDataV1,
  ethSignTypedDataV3,
  ethSignTypedDataV4,
];

export const verifySignMsg = async ({
  method,
  from,
  sign,
  message,
  chainId,
}: {
  method: string;
  from: string;
  sign: string;
  message: unknown;
  chainId?: number;
}) => {
  const chain = Object.values(chains).find((chain) => chain.id === chainId) || chains.mainnet;

  const publicClient = createPublicClient({
    chain: chain as chains.Chain,
    transport: http(),
  });
  switch (method) {
    case 'personal_sign': {
      const verifyResult = await publicClient.verifyMessage({
        address: from as `0x${string}`,
        message: message as string,
        signature: sign as `0x${string}`,
      });
      if (verifyResult) {
        return `SigUtil Successfully verified signer as ${from}`;
      } else {
        return `SigUtil Failed to verify signer`;
      }
    }
    case 'eth_signTypedData_v1': {
      const recoveredAddr = recoverTypedSignature({
        data: message as TypedDataV1,
        signature: sign,
        version: SignTypedDataVersion.V1,
      });
      if (recoveredAddr === from) {
        return `SigUtil Successfully verified signer as ${recoveredAddr}`;
      } else {
        return `SigUtil Failed to verify signer when comparing ${recoveredAddr} to ${from}`;
      }
    }
    case 'eth_signTypedData_v3': {
      const recoveredAddr = recoverTypedSignature({
        data: message as TypedMessage<MessageTypes>,
        signature: sign,
        version: SignTypedDataVersion.V3,
      });
      if (recoveredAddr === from) {
        return `SigUtil Successfully verified signer as ${recoveredAddr}`;
      } else {
        return `SigUtil Failed to verify signer when comparing ${recoveredAddr} to ${from}`;
      }
    }
    case 'eth_signTypedData_v4': {
      const verifyResult = await publicClient.verifyTypedData({
        address: from as `0x${string}`,
        ...(message as any),
        signature: sign as `0x${string}`,
      });

      if (verifyResult) {
        return `SigUtil Successfully verified signer as ${from}`;
      } else {
        return `SigUtil Failed to verify signer`;
      }
    }
    default:
      return null;
  }
};
