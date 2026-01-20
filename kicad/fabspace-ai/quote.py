"""
Quote module for FabSpace AI KiCad Plugin
Handles zipping KiCad project files for quote submission
"""

import os
import zipfile
import tempfile
from pathlib import Path
from datetime import datetime

try:
    import pcbnew
except ImportError:
    pcbnew = None
    print("[WARNING] pcbnew module not available")


def get_project_path():
    """Get the current KiCad project path."""
    if pcbnew is None:
        return None
    
    try:
        board = pcbnew.GetBoard()
        if board:
            filename = board.GetFileName()
            if filename:
                return os.path.dirname(filename)
    except Exception as e:
        print(f"Error getting project path: {e}")
    
    return None


def get_project_files(project_path):
    """
    Get all relevant KiCad project files for quote submission.
    
    Args:
        project_path: Path to the KiCad project directory
        
    Returns:
        List of file paths to include in the zip
    """
    if not project_path or not os.path.exists(project_path):
        return []
    
    project_files = []
    project_name = os.path.basename(project_path)
    
    # File extensions to include
    extensions = [
        '.kicad_pcb',      # PCB layout file
        '.kicad_pro',      # Project file
        '.kicad_sch',      # Schematic file
        '.kicad_prl',      # Project local settings
        '.kicad_dru',      # Design rules
        '.xml',            # BOM and other XML files
        '.csv',            # BOM CSV files
        '.pdf',            # Documentation
        '.txt',            # Text documentation
        '.md',             # Markdown documentation
        '-dxf.zip',        # DXF export
        '.step',           # 3D model
        '.wrl',            # 3D model
        '.stl',            # 3D model
        '.gbr',            # gbr model
    ]
    
    try:
        for root, dirs, files in os.walk(project_path):
            # Skip hidden directories and common non-project directories
            dirs[:] = [d for d in dirs if not d.startswith('.') and d not in ['backups', '__pycache__']]
            
            for file in files:
                # Skip hidden files
                if file.startswith('.'):
                    continue
                    
                # Check if file has a relevant extension
                if any(file.endswith(ext) for ext in extensions):
                    file_path = os.path.join(root, file)
                    project_files.append(file_path)
    
    except Exception as e:
        print(f"Error scanning project files: {e}")
    
    return project_files


def create_project_zip(project_path, output_path=None):
    """
    Create a zip file of the KiCad project for quote submission.
    
    Args:
        project_path: Path to the KiCad project directory
        output_path: Optional custom output path for the zip file.
                    If None, creates in the project directory.
    
    Returns:
        Path to the created zip file, or None on error
    """
    if not project_path or not os.path.exists(project_path):
        print(f"[ERROR] Project path does not exist: {project_path}")
        return None
    
    project_name = os.path.basename(project_path)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    
    # Determine output path - default to project directory
    if output_path is None:
        zip_filename = f"{project_name}_quote_{timestamp}.zip"
        output_path = os.path.join(project_path, zip_filename)
    
    print(f"[INFO] Creating project zip: {output_path}")
    
    try:
        # Get all project files
        project_files = get_project_files(project_path)
        
        if not project_files:
            print("[WARNING] No project files found to zip")
            return None
        
        # Create zip file
        with zipfile.ZipFile(output_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
            for file_path in project_files:
                # Calculate relative path for archive
                arcname = os.path.relpath(file_path, project_path)
                zipf.write(file_path, arcname)
                print(f"[INFO] Added to zip: {arcname}")
        
        print(f"[SUCCESS] Project zip created: {output_path}")
        print(f"[INFO] Total files: {len(project_files)}")
        print(f"[INFO] Zip size: {os.path.getsize(output_path) / 1024:.2f} KB")
        
        return output_path
    
    except Exception as e:
        print(f"[ERROR] Failed to create project zip: {e}")
        import traceback
        traceback.print_exc()
        return None


def zip_current_project(output_path=None):
    """
    Zip the current KiCad project for quote submission.
    
    Args:
        output_path: Optional custom output path for the zip file
        
    Returns:
        Path to the created zip file, or None on error
    """
    project_path = get_project_path()
    
    if not project_path:
        print("[ERROR] Could not determine current project path")
        return None
    
    return create_project_zip(project_path, output_path)


def validate_zip_contents(zip_path):
    """
    Validate that the zip file contains essential KiCad files.
    
    Args:
        zip_path: Path to the zip file to validate
        
    Returns:
        Tuple of (is_valid, missing_files)
    """
    if not os.path.exists(zip_path):
        return False, ["Zip file does not exist"]
    
    required_extensions = ['.kicad_pcb']  # At minimum, need PCB file
    recommended_extensions = ['.kicad_pro', '.kicad_sch']
    
    missing_files = []
    found_required = {ext: False for ext in required_extensions}
    found_recommended = {ext: False for ext in recommended_extensions}
    
    try:
        with zipfile.ZipFile(zip_path, 'r') as zipf:
            file_list = zipf.namelist()
            
            # Check for required files
            for ext in required_extensions:
                if any(f.endswith(ext) for f in file_list):
                    found_required[ext] = True
            
            # Check for recommended files
            for ext in recommended_extensions:
                if any(f.endswith(ext) for f in file_list):
                    found_recommended[ext] = True
        
        # Build missing files list
        for ext, found in found_required.items():
            if not found:
                missing_files.append(f"Required: *{ext}")
        
        for ext, found in found_recommended.items():
            if not found:
                missing_files.append(f"Recommended: *{ext}")
        
        is_valid = all(found_required.values())
        
        return is_valid, missing_files
    
    except Exception as e:
        print(f"[ERROR] Failed to validate zip: {e}")
        return False, [str(e)]


if __name__ == "__main__":
    # Test the zip functionality
    print("Testing KiCad project zip functionality...")
    
    # Try to zip the current project
    zip_path = zip_current_project()
    
    if zip_path:
        print(f"\n✓ Successfully created zip: {zip_path}")
        
        # Validate the zip
        is_valid, missing = validate_zip_contents(zip_path)
        
        if is_valid:
            print("✓ Zip file contains all required files")
        else:
            print("⚠ Zip file validation warnings:")
            for msg in missing:
                print(f"  - {msg}")
    else:
        print("\n✗ Failed to create project zip")
