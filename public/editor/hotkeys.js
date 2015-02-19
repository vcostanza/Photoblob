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
	SetHotkey("ctrl+a", "AutoContrast");
	SetHotkey("ctrl+i", "InvertColors");
	SetHotkey("ctrl+q", "Quit");
	SetHotkey("ctrl+shift+r", "Restore");
	SetHotkey("ctrl+r", "Rotate");
	SetHotkey("ctrl+s", "SaveImage");
	SetHotkey("ctrl+w", "CloseImage");
	SetHotkey("ctrl+shift+z", "Redo");
	SetHotkey("ctrl+z", "Undo");
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
	IMGFX.Rotate();
}

function HK_SaveImage() {
	ExportImage();
}

function HK_AutoContrast() {
	IMGFX.AutoContrast();
	IMGFX.AddHistory("Auto Contrast");
}

function HK_InvertColors() {
	IMGFX.InvertColors();
	IMGFX.AddHistory("Invert Colors");
}

function HK_View3D() {
	PBOX.View3D.open();
}

// Hotkeys object
// These can be changed by the user in the Hotkeys window
HK = {
	
	// Tie functions to a name and description
	funcs: {
		SaveImage: new Hotkey(HK_SaveImage, "Save Image", "Save and export image."),
		CloseImage: new Hotkey(HK_CloseImage, "Close Image", "Close the currently opened image."),
		Quit: new Hotkey(HK_Quit, "Quit", "Used to prevent accidently closing the browser with ctrl+q."),
		Undo: new Hotkey(HK_Undo, "Undo", "Undo a change; step back in history."),
		Redo: new Hotkey(HK_Redo, "Redo", "Redo a change; step forward in history."),
		Restore: new Hotkey(HK_Restore, "Restore", "Restore the image to its original state."),
		Rotate: new Hotkey(HK_Rotate, "Rotate Image", "Rotate the image 90 degrees clockwise."),
		AutoContrast: new Hotkey(HK_AutoContrast, "Auto Contrast", "Automatic contrast and color adjustment."),
		InvertColors: new Hotkey(HK_InvertColors, "Invert Colors", "Invert the RGB colors of the image."),
		View3D: new Hotkey(HK_View3D, "3D View", "Open the 3D View window.")
	},
	
	// Temporary hotkey input
	tempKey: "",
	
	// Init keys
	keys: {
	}
};

DefaultHotkeys();
