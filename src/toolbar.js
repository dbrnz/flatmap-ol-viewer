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

class Tool
{
	constructor(toolbar, tooltip, action) {
		this._toolbar = toolbar;
		this._action = action;
    	this._domElement = document.createElement('i');
		this._domElement.onclick = this.clicked.bind(this);
    	if (tooltip) {
    		this._domElement.setAttribute('title', tooltip);
    	}
	}

	get action()
	{
		return this._action;
	}

	get domElement()
	{
		return this._domElement;
	}

	clicked(toolElement)
	{
		this._toolbar.toolClicked(this);
	}

	highlight(selected)
	{
		if (selected) {
			this._domElement.classList.add('selected');
		} else {
			this._domElement.classList.remove('selected');
		}
	}
}

//==============================================================================

class StyledTool extends Tool
{
	constructor(toolbar, style, name, tooltip, action) {
		super(toolbar, tooltip, action);
    	this._domElement.classList.add(style);
    	this._domElement.classList.add(name);
	}
}

//==============================================================================

export class Toolbar
{
	constructor(domElement, editor) {
        this._domElement = domElement;
		this._editor = editor;
		this._map = null;
        this._tools = [];
        this.addStyledTool('fas', 'fa-mouse-pointer', 'Select', 'select-feature');
        this._selectTool = this._tools[0];
        this.addStyledTool('far', 'fa-hand-paper', 'Move', 'move-feature');
        this.addStyledTool('far', 'fa-edit', 'Edit', 'edit-feature');
        this.addStyledTool('far', 'fa-trash-alt', 'Delete', 'delete-feature');
        //this.addStyledTool('fas', 'fa-undo', 'Undo');
        //this.addStyledTool('fas', 'fa-redo', 'Redo');
        this.addSpacer();
        this.addStyledTool('fas', 'fa-map-marker', 'Add point', 'draw-Point');
        this.addStyledTool('fas', 'fa-pencil-alt', 'Add line', 'draw-LineString');
        //this.addStyledTool('fas', 'fa-vector-square', 'Add rectangle', 'rectangle');
        this.addStyledTool('fas', 'fa-draw-polygon', 'Add polygon', 'draw-Polygon');
        this.addSpacer();
        this.addSpacer();
        this.addStyledTool('fas', 'fa-save', 'Save changes', 'save-features');
	}

    setMap(map)
    //=========
    {
        this._map = map;
    }

	addSpacer()
	{
    	const element = document.createElement('i');
    	element.classList.add('spacer');
    	this._domElement.appendChild(element);
	}

	addStyledTool(style, name, tooltip, action=null)
	{
		const tool = new StyledTool(this, style, name, tooltip, action);
		this._domElement.appendChild(tool.domElement);
		this._tools.push(tool);
	}

	setActive(tool)
	//=============
	{
		for (let t of this._tools) {
			t.highlight(t === tool);
		}
	}

	async toolClicked(tool)
	{
		this.setActive(tool);

		if (this._editor && tool.action) {
			const clearHighlight = await this._editor.action(tool.action);
			if (clearHighlight) {
			this._map.disableViewer();
				tool.highlight(false);
				// Default back to viewing mode
				this._map.enableViewer();
			}
		}
	}
}

//==============================================================================
