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

import Select from 'ol/interaction/Select.js';
import {singleClick, pointerMove} from 'ol/events/condition.js';

//==============================================================================

import * as styles from './styles.js';

//==============================================================================

export class Editor
{
	constructor(map)
	{
		this._map = map;
		this._selectInteraction = null;
	}

	async action(toolAction)
	{
		switch (toolAction) {
		  case 'select-feature':
			return this.select();
		}
	}

	clearSelection()
	{

	}

	async select()
	{
		if (this._selectInteraction) {
			this._map.removeInteraction(this._selectInteraction);
		}
		this._selectInteraction = new Select({
			condition: e => {
				// Need function to remove pointerMove once selected with a single click
				// This is when we would disable selection, meaning keep the selection style
				// on the feature but turn off the selection tool.
				return pointerMove(e) || singleClick(e);
			},
			style: styles.selectedStyle.bind(this._map)
			});
		this._map.addInteraction(this._selectInteraction);
		return new Promise(resolve =>
		 	this._selectInteraction.on('select', e => { return false; })
		);
	}

}
