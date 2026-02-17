import pcbnew
import sys
import os

class FabspaceAIPlugin(pcbnew.ActionPlugin):
    def defaults(self):
        self.name = "Fabspace AI Plugin"
        self.category = "AI Tools"
        self.description = "KiCad Co-pilot: DRC Automation, BOM Check & AI Manufacturing Insight"
        self.show_toolbar_button = True
        # Use the provided PNG icon (blue-mark.png) inside the plugin's logo/
        # directory if it exists; otherwise leave the value empty so KiCad
        # falls back to a default icon. This avoids import-time failures
        # when the icon file is missing or unreadable.
        icon_path = os.path.join(os.path.dirname(__file__), "logo", "blue-mark.png")
        if os.path.exists(icon_path):
            self.icon_file_name = icon_path
        else:
            # don't set an invalid path
            self.icon_file_name = ""

    def Run(self):
        # Import PyQt6 GUI files and show the Login UI first
        try:
            from PyQt6.QtWidgets import QApplication
            from .login import LoginUI
        except ImportError as e:
            # PyQt6 not available; print a helpful message and abort. Avoid
            # importing wx (may not be present in KiCad Python), use console
            # output instead.
            try:
                print(f"PyQt6 not found. Install using: pip install PyQt6\nError: {e}")
            except Exception:
                pass
            return

        app = QApplication.instance()
        if not app:
            app = QApplication(sys.argv)

        # Show the login UI which will call back to launch_ui() on success
        login = LoginUI()
        login.show()
        app.exec()


def launch_ui():
    """Helper to launch the main Fabspace UI (used by the Login dialog).

    This function only creates and shows the MainWindow; it does not start
    the Qt event loop (the caller is expected to have started it).
    """
    try:
        from PyQt6.QtWidgets import QApplication
        from .fabspace_ai import MainWindow
    except ImportError as e:
        # If PyQt isn't available, surface a simple print for debug (Login will handle UI errors)
        print(f"Failed to import PyQt6 or MainWindow: {e}")
        return

    app = QApplication.instance()
    if not app:
        app = QApplication(sys.argv)

    window = MainWindow()
    window.show()

try:
    FabspaceAIPlugin().register()
except Exception as e:
    # If plugin registration fails, print the error to the console so it can
    # be inspected in KiCad's scripting console or logs.
    try:
        print(f"Failed to register FabspaceAIPlugin: {e}")
    except Exception:
        pass