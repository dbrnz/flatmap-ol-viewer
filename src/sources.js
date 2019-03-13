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

import {loadFeaturesXhr} from 'ol/featureloader.js';
import VectorSource from 'ol/source/Vector';

//==============================================================================

export class FeatureSource extends VectorSource
{
    constructor(url, format, create=false)
    {
        super();
        this._url = url;
        this._format = format;
        this._create = create;
        if (url) {
            this.setLoader(
                loadFeaturesXhr(url, format,
                    this.success_.bind(this),
                    this.failure_.bind(this)
                )
            );
        }
    }

    getUrl()
    {
        return this._url;
    }

    success_(features)
    {
        this.addFeatures(features);
    }

    failure_()
    {
        if (this._create) {
            fetch(this._url, {    // Authentication <===========
                headers: { "Content-Type": "application/json; charset=utf-8" },
                method: 'PUT',
                body: JSON.stringify(this._format.writeFeaturesObject([]))
            });
        } else {
            console.log(`Couldn't load ${this._url}`);
        }
    }
}

//==============================================================================
