/******************************************************************************

Flatmap viewer and annotation tool

Copyright (c) 2019  David Brooks

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

******************************************************************************/

'use strict';

//==============================================================================

import BroadcastChannel from 'broadcast-channel';

//==============================================================================

const SPARC_CHANNEL = 'sparc-portal';

//==============================================================================

export class MessagePasser
{
    constructor(id, callback)
    {
        this._id = id;
        this._channel = new BroadcastChannel(SPARC_CHANNEL);
        this._channel.addEventListener('message', callback);
    }

    broadcast(resource, action, data='')
    {
        this._channel.postMessage({
            "sender": this._id,
            "resource": resource.getId(),
            "type": resource.get('type') || '',
            "action": action,
            "data": data
        });
    }
}

//==============================================================================
