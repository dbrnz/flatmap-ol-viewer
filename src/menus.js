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

import ContextMenu from 'ol-contextmenu';

//==============================================================================


//==============================================================================

export class PopupMenu
{
    constructor(map)
    {
        this._map = map;
        this._currentFeature = null;
        this._contextmenu = new ContextMenu({
            width: 170,
            defaultItems: false,
            items: []
        });

        // Only for features
        this._contextmenu.on('beforeopen', evt => {
            const feature = map.forEachFeatureAtPixel(evt.pixel, (ft, l) => ft);
            if (!this.setupMenu_(feature)) {
                if (feature) {
                    // Disable the browser's default menu if the feature
                    // doesn't have a menu...
                    //evt.preventDefault();  // We need to access the actual mouse event
                }
            }
        });

        map.addControl(this._contextmenu);
    }

    get active()
    //==========
    {
        return this._contextmenu.isOpen();
    }

    setupMenu_(feature)
    //=================
    {
        if (feature) {
            let menuItems = [];
            if (feature.getId() && feature.get('type')) {
                menuItems.push({
                    text: `Query ${feature.get('type')}`,
                    callback: this.query_.bind(this)
                });
            }
            if (this._map.options.annotate) {
                if (menuItems.length > 0) {
                    menuItems.push('-');
                }
                menuItems.push({
                    text: 'Annotate',
                    callback: this.annotate_.bind(this)
                });
            }
            if (menuItems.length > 0) {
                this._currentFeature = feature;
                this._contextmenu.clear();
                this._contextmenu.extend(menuItems);
                this._contextmenu.enable();
                return true;
            }
        }
        this._currentFeature = null;
        this._contextmenu.disable();
        return false;
    }

    annotate_(evt)
    //============
    {
        this._map.annotator.annotate(this._currentFeature);
    }

    query_(evt)
    //=========
    {
        this._map.messagePasser.broadcast(this._currentFeature, 'query');
    }

    close()
    //=====
    {
        if (this._contextmenu.isOpen()) {
            this._currentFeature = null;
            this._contextmenu.close();
        }
    }

    update(pixel, feature)
    //====================
    {
        if (this._contextmenu.isOpen()) {
            this.setupMenu_(feature);
            this._contextmenu.updatePosition(pixel);
        }
    }
}

//==============================================================================
