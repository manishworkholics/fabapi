# Fabspace AI KiCad Plugin

This plugin provides a small set of tools inside KiCad to help with
manufacturing and verification workflows: an initial Login dialog, a
dashboard with shortcuts, a BOM (Bill Of Materials) viewer with a
selectable Supplier column, and a DRC automation panel.

## Features

- Login dialog (first screen shown when launching the plugin).
- Dashboard with quick actions: Automate DRC, BOM Check, AI Manufacturing Insight.
- BOM viewer: displays footprints from the open board and allows selecting
	suppliers via a dropdown in the SUPPLIER column.
- DRC panel: a UI for running checks and viewing example violations.

## Installation (KiCad)

1. Copy this plugin folder into your KiCad scripting plugins directory. Typical
	 locations:

	 - macOS: ~/Library/Application Support/kicad/ or the KiCad share/plugins path
	 - Linux: ~/.local/share/kicad/ or /usr/share/kicad/plugins

2. Make sure KiCad uses an interpreter that can import the required modules.
	 The plugin depends on PyQt6 in addition to KiCad's `pcbnew` module. Install
	 the PyQt6 package in the Python environment KiCad uses, for example:

	 ```bash
	 pip3 install PyQt6
	 ```

3. Restart KiCad. The plugin should be available via the PCB editor `Tools` ->
	 `External Plugins` menu (or registered with the ActionPlugin system).

## Running the plugin

- Launch from KiCad's plugin menu. The plugin displays a Login dialog first.
- Click `Login` to open the main Fabspace dashboard (no real authentication
	is performed by default).
- From the dashboard you can open the BOM or DRC pages.

## Developer notes

- The plugin entry point is `plugin.py` (registers the ActionPlugin). It shows
	`login.py` first; the login dialog calls `launch_ui()` in `plugin.py` which
	constructs and shows the main window defined in `fabspace_ai.py`.

- The BOM viewer (`bom_window.py`) reads footprints using KiCad's `pcbnew` API
	and populates a `QTableWidget`. The `SUPPLIER` column is implemented using a
	`QComboBox` placed via `setCellWidget()` so users can pick suppliers from a
	predefined list.

- Note: `pcbnew` and `wx` are available in KiCad's embedded Python, but may be
	reported as unresolved imports by your editor's environment. This is expected
	when editing outside KiCad.

## Extending the plugin

- To persist supplier choices you can add a Save/Export action that reads the
	`QComboBox` values and writes them into a BOM export or board metadata.
- The supplier list is currently hard-coded in `bom_window.py`. Consider
	moving it to a small JSON file or plugin settings and loading it at runtime.

## Troubleshooting

- If PyQt6 is not available, the plugin will show a warning. Install PyQt6 in
	the Python environment KiCad uses and restart KiCad.




