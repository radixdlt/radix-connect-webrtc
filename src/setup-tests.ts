// @ts-nocheck
import { randomUUID, webcrypto } from 'node:crypto'
import { polyfillWebRTC } from './polyfill'

global.crypto.subtle = webcrypto.subtle
global.crypto.randomUUID = randomUUID

polyfillWebRTC()
