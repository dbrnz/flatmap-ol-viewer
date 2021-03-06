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
//==============================================================================

import {DoubleClickZoom, DragBox, Draw, platformModifierKeyOnly, Modify, Select, Snap, Translate} from 'ol/interaction.js';
import {singleClick, pointerMove} from 'ol/events/condition.js';
import {GeoJSON, TopoJSON} from 'ol/format.js';

//==============================================================================

import {Toolbar} from './toolbar.js';

import * as styles from './styles.js';

//==============================================================================

export class Editor
{
    constructor(map)
    {
        this._map = map;
        this._toolbar = new Toolbar(map, this);
        this._map.addControl(this._toolbar);

        this._dragBoxInteraction = null;
        this._drawInteraction = null;
        this._modifyInteraction = null;
        this._selectInteraction = null;
        this._translateInteraction = null;
        this._selected = null;
        this._activeLayer = null;

        // translate
        // group/ungroup
        // lock/unlock
        // active layer
        // Select always active? Edit/draw mode and browse mode??
        this._history = [];
    }

    get mapId()
    //=========
    {
        return this._map.id;
    }

    async action(toolAction)
    //======================
    {
        if (!this._activeLayer) {
            return true;
        } else if (toolAction.startsWith('draw-')) {
            return this.drawFeature(toolAction.substring(5), 'cspline');
        } else if (toolAction === 'delete-feature') {
            this.deleteFeature();
        } else if (toolAction === 'edit-feature') {
            this.editFeature();
            return false;
        } else if (toolAction === 'move-feature') {
            this.moveFeature();
            return false;
        } else if (toolAction === 'select-feature') {
            this.selectFeature();
            return false;
        } else if (toolAction === 'layer-raise') {
            this._map.raiseActiveLayer();
        } else if (toolAction === 'layer-lower') {
            this._map.lowerActiveLayer();
        } else if (toolAction === 'save-features') {
            return this.saveFeatures();
        }
        return true;
    }

    setActiveLayer(activeLayer)
    //=========================
    {
        this._activeLayer = activeLayer;
        this.clearInteractions_();
        this._toolbar.setActive(null); // Clear active tool
        if (activeLayer) {
            this._toolbar.show();
        } else {
            this._toolbar.hide();
        }
    }

    clearInteractions_(clearSelection=true)
    //=====================================
    {
        if (this._dragBoxInteraction) {
            this._map.removeInteraction(this._dragBoxInteraction);
            this._dragBoxInteraction = null;
        }
        if (this._drawInteraction) {
            this._map.removeInteraction(this._drawInteraction);
            this._drawInteraction = null;
        }
        if (this._modifyInteraction) {
            this._map.removeInteraction(this._modifyInteraction);
            this._modifyInteraction = null;
        }
        if (clearSelection && this._selectInteraction) {
            this._map.removeInteraction(this._selectInteraction);
            this._selectInteraction = null;
        }
        if (this._translateInteraction) {
            this._map.removeInteraction(this._translateInteraction);
            this._translateInteraction = null;
        }
    }

    addSelectInteraction_()
    //=====================
    {
        if (!this._selectInteraction) {
            this._selectInteraction = new Select({
                layers: [this.featureLayer],
                style: (...args) => styles.editStyle(this._map, ...args),
                });
            this._map.addInteraction(this._selectInteraction);
        }
    }

    get featureLayer()
    //================
    {
        return this._activeLayer;
    }

    get featureSource()
    //=================
    {
        return this._activeLayer.getFeatureSource();
    }


    // Line string --> Polygon...

    async drawFeature(type, interpolation=null)
    //=========================================
    {
        this.clearInteractions_(true);

        this._drawInteraction = new Draw({
            style: (...args) => styles.interpolatedDrawingStyle(this._map, interpolation, ...args),
            type: type
        });
        this._map.addInteraction(this._drawInteraction);
        // The snap interaction must be added after the Modify and Draw interactions
        // in order for its map browser event handlers to be fired first. Its handlers
        // are responsible of doing the snapping.
        const snapInteraction = new Snap({source: this.featureSource});
        this._map.addInteraction(snapInteraction);

        return new Promise(resolve =>
            this._drawInteraction.on('drawend', e => {
                this.controlDoubleClickZoom(false);
                this._map.removeInteraction(this._drawInteraction);
                if (interpolation) {
                    e.feature.set('interpolation', interpolation);
                }
                this.featureSource.addFeature(e.feature);
                this._selected = e.feature;
                setTimeout(() => this.controlDoubleClickZoom(true), 251);
                resolve(true);
            })
        );
    }

    // From https://github.com/openlayers/openlayers/issues/3610#issuecomment-155611078
    // Control active state of double click zoom interaction
    //
    controlDoubleClickZoom(active)
    //============================
    {
        this._map.getInteractions().forEach((interaction, i, a) => {
            if (interaction instanceof DoubleClickZoom) {
                interaction.setActive(active);
            }
        });
    }


    async selectFeature()
    //===================
    {
        this.clearInteractions_(false);

        this.addSelectInteraction_();

        const selectedFeatures = this._selectInteraction.getFeatures();

        if (this._selected) {
            selectedFeatures.push(this._selected);
            this._selected = null;
        }

        // a DragBox interaction used to select features by drawing boxes
        this._dragBoxInteraction = new DragBox({condition: platformModifierKeyOnly});
        this._map.addInteraction(this._dragBoxInteraction);

        this._dragBoxInteraction.on('boxend', () => {
            // features that intersect the box are added to the collection of
            // selected features
            const extent = this._dragBoxInteraction.getGeometry().getExtent();
            this.featureSource.forEachFeatureIntersectingExtent(extent,
                feature => {
                    selectedFeatures.push(feature);
                    return false;
                })
        });

        // clear selection when drawing a new box and when clicking on the map
        this._dragBoxInteraction.on('boxstart', () => selectedFeatures.clear());

        return false;
    }


    async moveFeature()
    //=================
    {
        this.clearInteractions_(false);

        this.addSelectInteraction_();

        this._translateInteraction = new Translate({
            features: this._selectInteraction.getFeatures()
        });
        this._map.addInteraction(this._translateInteraction);

        return false;
    }


    async editFeature()
    //=================
    {
        this.clearInteractions_(false);
        this.addSelectInteraction_();

        this._modifyInteraction = new Modify({
            features: this._selectInteraction.getFeatures()
        });
        this._map.addInteraction(this._modifyInteraction);

        return false;
    }

    async deleteFeature()
    //===================
    {
        if (this._selectInteraction) {
            const features = this._selectInteraction.getFeatures();
            for (let feature of features.getArray()) {
                this.featureSource.removeFeature(feature);
            }
            features.clear();
            // rerender map??
        }

        this.clearInteractions_(true);
    }

    async saveFeatures()
    //==================
    {
        const geoJsonFormat = new GeoJSON();
        const source = this.featureSource;
        const json = geoJsonFormat.writeFeaturesObject(source.getFeatures(), {decimals: 2});

        return fetch(source.getUrl(), {    // Authentication <===========
            headers: { "Content-Type": "application/json; charset=utf-8" },
            method: 'POST',
            body: JSON.stringify(json)
        });  // alert with response (OK/error)
    }

}
