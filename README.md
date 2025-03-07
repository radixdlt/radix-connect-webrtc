[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)

# Radix Connect WebRTC Client

## Install

`npm install @radixdlt/radix-connect-webrtc`

```mermaid
sequenceDiagram
participant DApp as Client
participant CC as ConnectorClient
participant SC as SecretsClient
participant SS as Signaling Server
participant WR as WebRTC Connection
participant RP as Remote Peer

    %% Initialization Phase
    DApp->>CC: Initialize ConnectorClient
    CC->>SC: Create SecretsClient

    %% Connection Setup Phase
    DApp->>CC: connect()
    CC->>SS: Establish signaling connection
    CC->>WR: Create RTCPeerConnection

    %% Signaling Phase
    CC->>SS: Send connection offer
    SS->>RP: Forward offer
    RP->>SS: Send answer
    SS->>CC: Forward answer

    %% ICE Candidate Exchange
    par ICE Candidate Exchange
        CC->>SS: Send ICE candidates
        SS->>RP: Forward ICE candidates
    and
        RP->>SS: Send ICE candidates
        SS->>CC: Forward ICE candidates
    end

    %% Secure Channel Establishment
    CC->>WR: Set local/remote descriptions
    WR->>RP: Establish P2P connection

    %% Data Channel Setup
    CC->>WR: Create data channel
    WR-->>RP: Data channel established

    %% Ready State
    CC->>DApp: Connection ready

    %% Data Exchange

        Note over DApp,RP: Secure P2P Communication
        DApp->>RP: Send data
        RP->>DApp: Send data

```

# License

The Radix Connect WebRTC Client binaries are licensed under the [Radix Software EULA](http://www.radixdlt.com/terms/genericEULA).

The Radix Connect WebRTC Client code is released under [Apache 2.0 license](LICENSE).

      Copyright 2023 Radix Publishing Ltd

      Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.

      You may obtain a copy of the License at: http://www.apache.org/licenses/LICENSE-2.0

      Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.

      See the License for the specific language governing permissions and limitations under the License.
