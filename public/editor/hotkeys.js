/* Photoblob Image/Texture Editor and 3D Model Viewer (http://photo.blob.software/)
 * Copyright (C) 2015 Vincent Costanza
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

/* Generic Hotkey class */
Hotkey = Class.extend({
	init: function(func, name, desc) {
		
		if(!name) name = "Unknown";
		if(!desc) desc = "This hotkey doesn't have a description.";
		
		this.func = func;
		this.name = name;
		this.desc = desc;
	},
});

/* Hotkey functions */

function SetHotkey(key, func) {	
	if(!func || !HK.funcs[func]) return;
	
	// Check if a hotkey is already assigned to the command then remove it
	for(var i in HK.keys) {
		if(HK.keys[i] == HK.funcs[func]) {
			delete HK.keys[i];
		}
	}
		
	HK.keys[key] = HK.funcs[func];
}

// Set default hotkeys
function DefaultHotkeys() {
	SetHotkey("ctrl+3", "View3D");
	SetHotkey("ctrl+i", "InvertColors");
	SetHotkey("ctrl+q", "Quit");
	SetHotkey("ctrl+shift+r", "Restore");
	SetHotkey("ctrl+r", "Rotate");
	SetHotkey("ctrl+s", "SaveImage");
	SetHotkey("ctrl+w", "CloseImage");
	SetHotkey("ctrl+shift+z", "Redo");
	SetHotkey("ctrl+z", "Undo");
	SetHotkey("ctrl+=", "ZoomIn");
	SetHotkey("ctrl+-", "ZoomOut");
	SetHotkey("ctrl+9", "ZoomFit");
	SetHotkey("ctrl+0", "ResetZoom");
	SetHotkey("ctrl+a", "SelectAll");
	SetHotkey("ctrl+b", "BoxSelect");
	SetHotkey("ctrl+shift+a", "SelectNone");
	SetHotkey("ctrl+shift+i", "InvertSelect");
	SetHotkey("delete", "Clear");
}

function HK_CloseImage() {
	CloseImage();
}

function HK_Quit() {
	CL("Blocked quit hotkey.");
}

function HK_Undo() {
	IMGFX.Undo();
}

function HK_Redo() {
	IMGFX.Redo();
}

function HK_Restore() {
	IMGFX.LoadHistory(0, true);
}

function HK_Rotate() {
	if(ToolBox.get() == "UV Edit")
		UVMap.toggleRotation();
	else
		IMGFX.Rotate();
}

function HK_SaveImage() {
	if(ToolBox.get() == "UV Edit")
		UVMap.toggleScale();
	else
		PBOX.Save.open();
}

function HK_InvertColors() {
	IMGFX.InvertColors();
	IMGFX.AddHistory("Invert Colors");
}

function HK_View3D() {
	PBOX.View3D.open();
}

function HK_ZoomIn() {
	ImageArea.setZoom("in");
}

function HK_ZoomOut() {
	ImageArea.setZoom("out");
}

function HK_ZoomFit() {
	ImageArea.setZoom("fit");
}

function HK_ResetZoom() {
	ImageArea.off_x = ImageArea.off_y = 0;
	ImageArea.setZoom(1);
}

function HK_SelectAll() {
	if(ToolBox.get() == "UV Edit")
		UVMap.select(1);
	else
		IMGFX.SEL_All();
}

function HK_SelectNone() {
	if(ToolBox.get() == "UV Edit")
		UVMap.select(0);
	else
		IMGFX.SEL_Clear();
}

function HK_InvertSelect() {
	if(ToolBox.get() == "UV Edit")
		UVMap.select(-1);
	else
		IMGFX.SEL_Invert();
}

function HK_BoxSelect() {
	if(ToolBox.get() == "UV Edit")
		UVMap.boxSelect();
	else {
		ToolBox.setTool("Box Select", true);
		EditArea.detect(MouseX, MouseY, "down");
	}
}

function HK_ClearPixels() {
	IMGFX.Clear();
}

// Hotkeys object
// These can be changed by the user in the Hotkeys window
HK = {
	
	// Tie functions to a name and description
	funcs: {
		SaveImage: new Hotkey(HK_SaveImage, "Save/Scale", "Save and export image or scale UVs."),
		CloseImage: new Hotkey(HK_CloseImage, "Close Image", "Close the currently opened image."),
		Quit: new Hotkey(HK_Quit, "Quit", "Prevent accidently closing the browser with ctrl+q."),
		Undo: new Hotkey(HK_Undo, "Undo", "Undo a change; step back in history."),
		Redo: new Hotkey(HK_Redo, "Redo", "Redo a change; step forward in history."),
		Restore: new Hotkey(HK_Restore, "Restore", "Restore the image to its original state."),
		Rotate: new Hotkey(HK_Rotate, "Rotate", "Rotate the image or rotate selected UVs."),
		InvertColors: new Hotkey(HK_InvertColors, "Invert Colors", "Invert the RGB colors of the image."),
		View3D: new Hotkey(HK_View3D, "3D View", "Open the 3D View window."),
		ZoomIn: new Hotkey(HK_ZoomIn, "Zoom In", "Zoom into the image more."),
		ZoomOut: new Hotkey(HK_ZoomOut, "Zoom Out", "Zoom into the image less."),
		ZoomFit: new Hotkey(HK_ZoomFit, "Zoom Fit", "Zoom the image so it fits nicely on the screen."),
		ResetZoom: new Hotkey(HK_ResetZoom, "Reset Zoom", "Reset zoom to 100%."),
		SelectAll: new Hotkey(HK_SelectAll, "Select All", "Select entire image or select all UVs."),
		SelectNone: new Hotkey(HK_SelectNone, "Select None", "Remove selection or select no UVs."),
		InvertSelect: new Hotkey(HK_InvertSelect, "Invert Select", "Invert the current selection."),
		BoxSelect: new Hotkey(HK_BoxSelect, "Box Select", "Start box selecting."),
		Clear: new Hotkey(HK_ClearPixels, "Clear", "Erase pixels within the selection.")
	},
	
	// Temporary hotkey input
	tempKey: "",
	
	// Init keys
	keys: {
	}
};

DefaultHotkeys();
