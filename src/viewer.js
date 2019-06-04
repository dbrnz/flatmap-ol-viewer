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
        this._selectedFeature = null;
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

        // Setup callbacks

        this._map.on('pointermove', this.pointerMove_.bind(this));
        this._map.on('singleclick', this.singleClick_.bind(this));
    }

    disable()
    //=======
    {
        this._selectedFeature = null;
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
            if (feature !== this._selectedFeature) {
                feature.setStyle(null);
            }
        }
        this._highlightedFeatures = [];
    }

    process(remote)
    //=============
    {
        console.log(this._map.id, 'received', remote);
        if (remote.action === 'select') {
            // remote.type has class of resource
            // features = this._map.getFeaturesByType(remote.type);
            // highlight features (==> unhighlight others)
            // What about zooming to 1.4*features.extent() (20% margin all around)??
            // Activate (and raise to top??) feature.layer() ??
        }
    }

    pointerMove_(e)
    //=============
    {
        if (this._enabled) {
            const pixel = e.pixel;
            const feature = this._map.forEachFeatureAtPixel(pixel, feature => feature);

            if (feature) {
                if (!this._map.contextMenu.active) {
                    const tooltip = feature.get('name');
                    if (tooltip) {
                        this._tooltip.innerHTML = tooltip;
                        this._tooltipOverlay.setPosition(e.coordinate);
                        this._tooltip.style.display = '';
                    } else {
                        this._tooltip.style.display = 'none';
                    }
                }
            } else {
                this._map.contextMenu.close();
                this._tooltip.style.display = 'none';
            }

            if (!this._map.contextMenu.active) {
                this.clearStyle_(); // But not selected feature...
                this._map.forEachFeatureAtPixel(e.pixel, feature => {
                    feature.setStyle((...args) => styles.viewStyle(this._map, ...args));
                    this._highlightedFeatures.push(feature);
                });
            }
        }
    }

    singleClick_(e)
    //=============
    {
        const pixel = e.pixel;
        const feature = this._map.forEachFeatureAtPixel(pixel, feature => feature);

        if (feature) {
            if (this._selectedFeature) {
                this._selectedFeature.setStyle(null);
            }
            this._selectedFeature = feature;
            const id = feature.getId();
            if (id) {
                this._map.messagePasser.broadcast(feature, 'select')
            }
            // highlight feature (==> unhighlight others)
        } else {
            if (this._selectedFeature) {
                this._selectedFeature.setStyle(null);
            }
            this._selectedFeature = null;
        }
    }

}

//==============================================================================
