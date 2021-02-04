import React from 'react';
import Transfer from "./classes/Transfer";

export type BufferLike = {
  _isBuffer: boolean,
  buffer: ArrayBuffer
}

export type TransferControlMessage = {
  type: string,
  [key: string]: string | number,
};

export type PropsWithTransfer = {
  transfer: Transfer,
}

export type TransferFile = {
  name: string,
  fileType: string,
  [key: string]: string | number,
}

export type ChildrenProps = {
  children: React.ReactNode
}