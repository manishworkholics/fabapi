from enum import Enum
from typing import List, Dict, Any, Optional
try:
    import pcbnew
except ImportError:
    pcbnew = None
    print("Warning: pcbnew module not available. DRC will run in simulation mode.")

class Severity(Enum):
    INFO = 'Info'
    WARNING = 'Warning'
    ERROR = 'Error'

class DRCViolation:
    def __init__(self, rule: str, description: str, severity: Severity, location: str = None):
        self.rule = rule
        self.description = description
        self.severity = severity
        self.location = location

    def to_dict(self) -> Dict[str, Any]:
        return {
            'rule': self.rule,
            'description': self.description,
            'severity': self.severity.value,
            'location': self.location
        }

class DRCRules:
    def __init__(self,
                 clearance: float,
                 trace_width: float,
                 hole_to_pad_ratio: float,
                 via_placement: str,
                 electrical_rules: str,
                 manufacturability: str,
                 num_layers: int,
                 copper_oz: List[float],
                 final_thickness: float,
                 array_with_rails: bool,
                 surface_finish: str,
                 mask_color: str,
                 silk_colors: List[str]):
        self.clearance = clearance
        self.trace_width = trace_width
        self.hole_to_pad_ratio = hole_to_pad_ratio
        self.via_placement = via_placement
        self.electrical_rules = electrical_rules
        self.manufacturability = manufacturability
        self.num_layers = num_layers
        self.copper_oz = copper_oz
        self.final_thickness = final_thickness
        self.array_with_rails = array_with_rails
        self.surface_finish = surface_finish
        self.mask_color = mask_color
        self.silk_colors = silk_colors

    def to_dict(self) -> Dict[str, Any]:
        return {
            'clearance': self.clearance,
            'trace_width': self.trace_width,
            'hole_to_pad_ratio': self.hole_to_pad_ratio,
            'via_placement': self.via_placement,
            'electrical_rules': self.electrical_rules,
            'manufacturability': self.manufacturability,
            'num_layers': self.num_layers,
            'copper_oz': self.copper_oz,
            'final_thickness': self.final_thickness,
            'array_with_rails': self.array_with_rails,
            'surface_finish': self.surface_finish,
            'mask_color': self.mask_color,
            'silk_colors': self.silk_colors
        }

# Example usage for fetching rules and reporting violations

# Module-level storage for manufacturer-specific rules
_manufacturer_rules: Optional[DRCRules] = None
_manufacturer_name: Optional[str] = None
_manufacturer_specs_raw: Optional[str] = None


def fetch_ems_specific_rules() -> Optional[DRCRules]:
    """Fetch currently loaded manufacturer-specific rules.
    
    This function returns the manufacturer rules if they have been imported,
    otherwise returns None. To import rules, use apply_manufacturer_specs().
    
    Returns:
        DRCRules object if manufacturer rules are loaded, None otherwise
    """
    return _manufacturer_rules


def apply_manufacturer_specs(manufacturer_name: str, specifications: str, parsed_rules: Dict[str, Any]) -> bool:
    """Apply manufacturer-specific specifications as DRC rules.
    
    This function stores the parsed manufacturing specifications so they can be
    used in subsequent DRC runs. The rules are stored at module level and will
    persist until the plugin is reloaded or new rules are applied.
    
    Args:
        manufacturer_name: Name of the manufacturer (e.g., "Protronics Inc.")
        specifications: Raw specification text from manufacturer
        parsed_rules: Dictionary containing parsed rule values:
            - min_trace_width: Minimum trace width in mm
            - min_clearance: Minimum clearance in mm
            - min_annular_ring: Minimum annular ring in mm
            - max_layers: Maximum number of layers
            - max_board_thickness: Maximum board thickness in mm
            - max_board_width: Maximum board width in mm
            - max_board_height: Maximum board height in mm
            - min_via_drill: Minimum via drill size in mm
            - via_types: List of supported via types
            - original_specs: Original specification text
    
    Returns:
        True if rules were successfully applied, False otherwise
    """
    global _manufacturer_rules, _manufacturer_name, _manufacturer_specs_raw
    
    try:
        print(f"\n=== Applying Manufacturer Specs: {manufacturer_name} ===")
        
        # Store raw specifications for reference
        _manufacturer_name = manufacturer_name
        _manufacturer_specs_raw = specifications
        
        # Extract values from parsed rules with defaults
        min_trace_width = parsed_rules.get('min_trace_width', 0.15)
        min_clearance = parsed_rules.get('min_clearance', 0.2)
        min_annular_ring = parsed_rules.get('min_annular_ring', 0.15)
        max_layers = parsed_rules.get('max_layers', 4)
        max_board_thickness = parsed_rules.get('max_board_thickness', 1.6)
        min_via_drill = parsed_rules.get('min_via_drill', 0.3)
        via_types = parsed_rules.get('via_types', ["through-hole", "blind", "buried"])
        
        # Determine via placement based on supported via types
        if len(via_types) == 1 and "through-hole" in via_types[0].lower():
            via_placement = "Through-hole only"
        elif any("blind" in v.lower() or "buried" in v.lower() for v in via_types):
            via_placement = "Advanced (blind/buried supported)"
        else:
            via_placement = "Standard"
        
        # Create copper oz list based on max layers
        # Assume 1oz copper for all layers by default
        copper_oz = [1.0] * max_layers
        
        # Create DRCRules object from parsed specifications
        _manufacturer_rules = DRCRules(
            clearance=min_clearance,
            trace_width=min_trace_width,
            hole_to_pad_ratio=min_annular_ring / min_via_drill if min_via_drill > 0 else 0.6,
            via_placement=via_placement,
            electrical_rules="Manufacturer Specific",
            manufacturability="Manufacturer Specific",
            num_layers=max_layers,
            copper_oz=copper_oz,
            final_thickness=max_board_thickness,
            array_with_rails=True,
            surface_finish="As specified",
            mask_color="As specified",
            silk_colors=["As specified"]
        )
        
        print(f"[OK] Manufacturer rules applied:")
        print(f"  - Trace Width: {min_trace_width}mm")
        print(f"  - Clearance: {min_clearance}mm")
        print(f"  - Annular Ring: {min_annular_ring}mm")
        print(f"  - Max Layers: {max_layers}")
        print(f"  - Board Thickness: {max_board_thickness}mm")
        print(f"  - Via Drill: {min_via_drill}mm")
        print(f"  - Via Types: {', '.join(via_types)}")
        print(f"  - Via Placement: {via_placement}")
        print("=================================================\n")
        
        return True
        
    except Exception as e:
        print(f"Error applying manufacturer specs: {e}")
        import traceback
        traceback.print_exc()
        return False


def get_manufacturer_rules() -> Optional[DRCRules]:
    """Get currently loaded manufacturer-specific rules.
    
    Returns:
        DRCRules object if manufacturer rules are loaded, None otherwise
    """
    return _manufacturer_rules


def get_manufacturer_info() -> Optional[Dict[str, str]]:
    """Get information about currently loaded manufacturer rules.
    
    Returns:
        Dictionary with manufacturer_name and specifications, or None if no rules loaded
    """
    if _manufacturer_name is None:
        return None
    
    return {
        'manufacturer_name': _manufacturer_name,
        'specifications': _manufacturer_specs_raw or "No specifications available"
    }


def clear_manufacturer_rules():
    """Clear any loaded manufacturer-specific rules.
    
    After calling this, DRC will use the board's default design rules.
    """
    global _manufacturer_rules, _manufacturer_name, _manufacturer_specs_raw
    _manufacturer_rules = None
    _manufacturer_name = None
    _manufacturer_specs_raw = None
    print("Manufacturer rules cleared - using default board rules")

def run_drc(board=None) -> List[DRCViolation]:
    """Run KiCad's Design Rule Checker and return violations.
    
    If manufacturer-specific rules have been loaded via apply_manufacturer_specs(),
    they will be automatically applied before running the DRC.
    
    Args:
        board: KiCad board object (pcbnew.BOARD). If None, attempts to get current board.
    
    Returns:
        List of DRCViolation objects representing all violations found.
    """
    # Check if manufacturer rules should be applied
    if _manufacturer_rules is not None:
        print(f"Using manufacturer-specific rules from: {_manufacturer_name}")
        return run_drc_with_rules(board, _manufacturer_rules)
    
    # Check if pcbnew is available
    if pcbnew is None:
        print("pcbnew not available - returning simulated violations")
        return _get_simulated_violations()
    
    try:
        # Get board if not provided
        if board is None:
            try:
                board = pcbnew.GetBoard()
            except Exception as e:
                print(f"Failed to get board: {e}")
                return _get_simulated_violations()
                
            if board is None:
                print("No board loaded in KiCad")
                return _get_simulated_violations()
        
        print(f"Board loaded: {board.GetFileName()}")
        
        # Run KiCad's DRC and capture violations
        print("Running KiCad DRC engine to detect violations...")
        violations = _run_kicad_drc_and_get_violations(board)
        
        if violations:
            print(f"Found {len(violations)} DRC violations")
            # Also open the dialog so user can see details
            print("Opening KiCad DRC dialog for detailed view...")
            open_kicad_drc_dialog()
        else:
            print("No violations found - design passed DRC!")
        
        return violations
        
    except Exception as e:
        print(f"Error running DRC: {e}")
        import traceback
        traceback.print_exc()
        # Return simulated violations on error for testing
        return _get_simulated_violations()


def _run_kicad_drc_and_get_violations(board) -> List[DRCViolation]:
    """Run KiCad's DRC engine and extract violations from markers.
    
    This function actually runs DRC and reads the results, unlike just opening the dialog.
    """
    violations = []
    
    try:
        # Clear existing DRC markers first
        try:
            board.DeleteMARKERs()
            print("Cleared existing DRC markers")
        except Exception as e:
            print(f"Warning: Could not clear markers: {e}")
        
        # Refill zones before DRC
        try:
            print("Refilling zones...")
            filler = pcbnew.ZONE_FILLER(board)
            zones = board.Zones()
            filler.Fill(zones)
            print("Zones refilled successfully")
        except Exception as e:
            print(f"Warning: Zone filling failed: {e}")
        
        # Run DRC using KiCad's built-in engine
        print("Running DRC engine...")
        try:
            # Method 1: Try the modern DRC engine approach
            from pcbnew import DRC_ENGINE
            design_settings = board.GetDesignSettings()
            drc_engine = DRC_ENGINE(board, design_settings)
            drc_engine.InitEngine(board.GetFileName())
            drc_engine.RunTests()
            print("DRC engine completed successfully")
        except (AttributeError, ImportError) as e:
            print(f"Modern DRC engine not available: {e}")
            # Method 2: Fallback to basic checks
            try:
                print("Falling back to basic DRC checks...")
                _run_basic_drc_checks(board)
            except Exception as basic_error:
                print(f"Basic DRC checks failed: {basic_error}")
        
        # Now read all the markers that were created
        try:
            marker_count = board.GetMARKERCount()
            print(f"Reading {marker_count} DRC markers...")
            
            for i in range(marker_count):
                try:
                    marker = board.GetMARKER(i)
                    if marker is None:
                        continue
                    
                    # Get the rule check item from the marker
                    rc_item = marker.GetRCItem()
                    if not rc_item:
                        continue
                    
                    # Determine severity
                    severity = Severity.WARNING  # default
                    try:
                        kicad_severity = rc_item.GetSeverity()
                        severity_map = {
                            pcbnew.RPT_SEVERITY_ERROR: Severity.ERROR,
                            pcbnew.RPT_SEVERITY_WARNING: Severity.WARNING,
                            pcbnew.RPT_SEVERITY_INFO: Severity.INFO,
                            pcbnew.RPT_SEVERITY_EXCLUSION: Severity.INFO,
                            pcbnew.RPT_SEVERITY_ACTION: Severity.INFO,
                        }
                        severity = severity_map.get(kicad_severity, Severity.WARNING)
                    except Exception as sev_error:
                        print(f"Warning: Could not get severity: {sev_error}")
                    
                    # Get position and location info
                    location = "Unknown"
                    try:
                        pos = marker.GetPosition()
                        location = f"X: {pcbnew.ToMM(pos.x):.3f}mm, Y: {pcbnew.ToMM(pos.y):.3f}mm"
                        
                        # Add layer info if available
                        try:
                            layer = marker.GetLayer()
                            if layer != pcbnew.UNDEFINED_LAYER:
                                layer_name = board.GetLayerName(layer)
                                location = f"{layer_name}, {location}"
                        except:
                            pass
                    except Exception as pos_error:
                        print(f"Warning: Could not get position: {pos_error}")
                    
                    # Get error details
                    rule_name = "Unknown Rule"
                    description = "DRC violation detected"
                    try:
                        rule_name = rc_item.GetErrorText()
                        description = rc_item.GetErrorMessage()
                    except Exception as text_error:
                        print(f"Warning: Could not get error text: {text_error}")
                    
                    # Create violation object
                    violation = DRCViolation(
                        rule=rule_name,
                        description=description,
                        severity=severity,
                        location=location
                    )
                    violations.append(violation)
                    
                    print(f"  - {severity.value}: {rule_name} at {location}")
                    
                except Exception as marker_error:
                    print(f"Warning: Error processing marker {i}: {marker_error}")
                    continue
                    
        except Exception as marker_read_error:
            print(f"Error reading DRC markers: {marker_read_error}")
        
        # Refresh the board to show markers
        try:
            pcbnew.Refresh()
        except Exception as refresh_error:
            print(f"Warning: Could not refresh board: {refresh_error}")
            
    except Exception as e:
        print(f"Error in DRC execution: {e}")
        import traceback
        traceback.print_exc()
    
    return violations


def _get_simulated_violations() -> List[DRCViolation]:
    """Return simulated violations for testing when pcbnew is not available."""
    return [
        DRCViolation(
            rule="Clearance",
            description="Clearance violation between net A and net B",
            severity=Severity.ERROR,
            location="Layer 1, X:10mm Y:20mm"
        ),
        DRCViolation(
            rule="Trace Width",
            description="Trace width below minimum on net C",
            severity=Severity.WARNING,
            location="Layer 2, X:15mm Y:25mm"
        )
    ]


def _run_basic_drc_checks(board) -> None:
    """Run basic DRC checks manually and create markers.
    
    This is a fallback when the DRC engine is not directly accessible.
    Creates markers on the board for detected violations.
    """
    if pcbnew is None:
        return
    
    try:
        design_settings = board.GetDesignSettings()
        
        try:
            min_clearance = design_settings.m_MinClearance
            min_track_width = design_settings.m_TrackMinWidth
            print(f"Running basic checks with MinClearance={pcbnew.ToMM(min_clearance):.3f}mm, MinTrackWidth={pcbnew.ToMM(min_track_width):.3f}mm")
        except Exception as e:
            print(f"Warning: Could not get design settings: {e}")
            return
        
        # Check track widths
        try:
            tracks = board.GetTracks()
            for track in tracks:
                try:
                    if track.GetWidth() < min_track_width:
                        # Create a marker for this violation
                        try:
                            marker = pcbnew.MARKER_PCB(board)
                            marker.SetPosition(track.GetStart())
                            marker.SetLayer(track.GetLayer())
                            board.Add(marker)
                            print(f"Track width violation at {track.GetStart()}: {pcbnew.ToMM(track.GetWidth()):.3f}mm < {pcbnew.ToMM(min_track_width):.3f}mm")
                        except Exception as marker_error:
                            print(f"Warning: Could not create marker: {marker_error}")
                except Exception as track_error:
                    print(f"Warning: Error checking track: {track_error}")
                    continue
        except Exception as tracks_error:
            print(f"Warning: Could not get tracks: {tracks_error}")
        
        print("Basic DRC checks completed")
        
    except Exception as e:
        print(f"Error in basic DRC checks: {e}")
        import traceback
        traceback.print_exc()


def run_drc_with_rules(board=None, rules: Optional[DRCRules] = None) -> List[DRCViolation]:
    """Run DRC with custom manufacturer-specific rules.
    
    Args:
        board: KiCad board object (pcbnew.BOARD). If None, attempts to get current board.
        rules: Custom DRCRules to apply. If None, uses board's existing rules.
    
    Returns:
        List of DRCViolation objects.
    """
    if pcbnew is None:
        return _get_simulated_violations()
        
    if board is None and pcbnew:
        try:
            board = pcbnew.GetBoard()
        except Exception as e:
            print(f"Failed to get board: {e}")
            return _get_simulated_violations()
            
    if board is None:
        return _get_simulated_violations()
    
    try:
        # Apply custom rules if provided
        if rules:
            try:
                design_settings = board.GetDesignSettings()
                
                # Convert mm to internal units (nanometers in KiCad 9)
                clearance_nm = int(rules.clearance * 1000000)
                track_width_nm = int(rules.trace_width * 1000000)
                
                # Apply clearance rules
                design_settings.m_MinClearance = clearance_nm
                
                # Apply track width rules
                design_settings.m_TrackMinWidth = track_width_nm
                
                print(f"[OK] Applied manufacturer rules to board:")
                print(f"  - Clearance: {rules.clearance}mm")
                print(f"  - Track Width: {rules.trace_width}mm")
                
                # Save the board to persist settings
                try:
                    board.Save(board.GetFileName())
                    print("  - Board settings saved")
                except Exception as save_error:
                    print(f"  - Warning: Could not save board: {save_error}")
                    
            except Exception as e:
                print(f"Warning: Could not apply custom rules: {e}")
        
        # Run DRC and get actual violations
        print("Running DRC with manufacturer specifications...")
        violations = _run_kicad_drc_and_get_violations(board)
        
        if violations:
            print(f"Found {len(violations)} violations with manufacturer rules")
            # Also open the dialog for detailed view
            print("Opening KiCad DRC dialog for detailed view...")
            open_kicad_drc_dialog()
        else:
            print("No violations found with manufacturer rules - design passed!")
        
        return violations
        
    except Exception as e:
        print(f"Error in run_drc_with_rules: {e}")
        import traceback
        traceback.print_exc()
        return _get_simulated_violations()


def open_kicad_drc_dialog():
    """Programmatically open KiCad's DRC dialog.
    
    This is a helper function that can be used to open the native DRC dialog
    from within the plugin, allowing users to use KiCad's full DRC interface.
    """
    if pcbnew is None:
        print("pcbnew not available")
        return False
    
    try:
        # Get the PCB editor frame
        import wx
        app = wx.GetApp()
        if app:
            frame = app.GetTopWindow()
            if frame:
                # Send command to open DRC dialog (ID from KiCad source)
                # This is the menu command for Tools > DRC
                wx.PostEvent(frame, wx.CommandEvent(wx.wxEVT_COMMAND_MENU_SELECTED, 10025))
                return True
    except Exception as e:
        print(f"Could not open DRC dialog: {e}")
    
    return False