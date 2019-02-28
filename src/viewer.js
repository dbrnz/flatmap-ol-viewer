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

import {Select} from 'ol/interaction.js';
import {pointerMove} from 'ol/events/condition.js';

//==============================================================================

import * as styles from './styles.js';

//==============================================================================

export class Viewer
{
    constructor(map)
    {
        this._map = map;
        this._highlightedFeatures = [];
    }

    disable()
    //=======
    {
        this._map.un('pointermove', this.pointerMove_.bind(this));
        this.clearStyle_();
    }

    enable()
    //======
    {
        this._map.on('pointermove', this.pointerMove_.bind(this));
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
        this.clearStyle_();
        this._map.forEachFeatureAtPixel(e.pixel, feature => {
            feature.setStyle((...args) => styles.viewStyle(this._map, ...args));
            this._highlightedFeatures.push(feature);
        });
    }
}

//==============================================================================
