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

/**
 * Viewing mode:
 *
 *  * Features are highlighted on mouseover.
 *  * Show a tooltip with information (description + ??)
 *  * Notify listeners (other maps, scaffolds, etc) that feature is active
 *  * Context menu to perform different actions (incl. viewing details?)
 *  * Double click performs a default action
 */

//==============================================================================

'use strict';

//==============================================================================

import Overlay from 'ol/Overlay.js';

//==============================================================================

import * as styles from './styles.js';

//==============================================================================

export class Viewer
{
    constructor(map)
    {
        this._map = map;
        this._highlightedFeatures = [];
        this._enabled = false;

        // Display a tooltip at the mouse pointer

        // Each map needs its own tooltip element

        this._tooltip = document.createElement('div');
        this._tooltip.id = 'tooltip';
        this._tooltip.classList.add('tooltip');
        this._tooltipOverlay = new Overlay({
            element: this._tooltip,
            offset: [10, 0],
            positioning: 'bottom-left'
        });
        map.addOverlay(this._tooltipOverlay);

        // Setup pointer move callback

        this._map.on('pointermove', this.pointerMove_.bind(this));
    }

    disable()
    //=======
    {
        this.clearStyle_();
        this._enabled = false;
    }

    enable()
    //======
    {
        this._enabled = true;
    }

    clearStyle_()
    //===========
    {
        for (let feature of this._highlightedFeatures) {
            feature.setStyle(null);
        }
        this._highlightedFeatures = [];
    }

    pointerMove_(e)
    //=============
    {
        const pixel = e.pixel;
        const feature = this._map.forEachFeatureAtPixel(pixel, feature => feature);

        if (feature) {
            const id = feature.getId();
            if (id) {
                this._tooltip.innerHTML = id;
                this._tooltipOverlay.setPosition(e.coordinate);
                this._tooltip.style.display = '';
            } else {
                this._tooltip.style.display = 'none';
            }
        } else {
            this._tooltip.style.display = 'none';
        }

        if (this._enabled) {
            this.clearStyle_();
            this._map.forEachFeatureAtPixel(e.pixel, feature => {
                feature.setStyle((...args) => styles.viewStyle(this._map, ...args));
                this._highlightedFeatures.push(feature);
            });
        }
    }
}

//==============================================================================
