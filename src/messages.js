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

class MessageManager_
{
    constructor()
    {
        this._clients = new Map();
        console.log('New message manager...');
    }

    connect(clientId, callback)
    {
        if (!this._clients.has(clientId)) {
            this._clients.set(clientId, new MessageClient_(clientId, callback, this))
        }
        return this._clients.get(clientId);
    }

    disconnect(clientId)
    {
        this._clients.delete(clientId);
    }

    broadcast(senderId, json)
    {
        for (const [id, client] of this._clients) {
            if (id !== senderId) {
                client.callback(json);
            }
        }
    }

}

//==============================================================================

export const MessageManager = new MessageManager_();

//==============================================================================

class MessageClient_
{
    constructor(id, callback, manager)
    {
        this._id = id;
        this._callback = callback;
        this._manager = manager;
    }

    callback(...args) {
        this._callback(...args);
    }

    send(resource, action, data='')
    {
        this._manager.broadcast(this._id, {
            "sender": this._id,
            "resource": resource.getId(),
            "type": resource.get('type') || '',
            "action": action,
            "data": data
        });
    }
}

//==============================================================================
