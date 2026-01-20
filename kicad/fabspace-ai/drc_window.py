from PyQt6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QLabel, QPushButton, QLineEdit,
    QComboBox, QTableWidget, QTableWidgetItem, QHeaderView, QSpacerItem,
    QSizePolicy, QFrame, QStackedWidget, QMessageBox
)
from PyQt6.QtCore import Qt, QTimer
from PyQt6.QtGui import QFont
from . import data_info
import json
import urllib.request
import urllib.error

try:
    import requests
except Exception:
    requests = None

# Import drc_rules with error handling
try:
    from . import drc_rules
    print("[OK] drc_rules module imported successfully")
except ImportError as e:
    print(f"[ERROR] Failed to import drc_rules: {e}")
    import traceback
    traceback.print_exc()
    drc_rules = None

class DRCWindow(QWidget):
    # DRCWindow provides a UI to run and inspect Design Rule Checks (DRC).
    def __init__(self, controller=None):
        # optional controller allows this window to navigate back to MainWindow
        super().__init__(controller)
        self.controller = controller
        
        # Initialize suppliers list first
        self.suppliers = []
        self.all_suppliers = []  # Store all suppliers for filtering
        
        # Track if specifications have been imported
        self.specs_imported = False
        
        # Setup search timer to debounce search requests
        self.search_timer = QTimer()
        self.search_timer.timeout.connect(self.perform_search)
        self.search_timer.setSingleShot(True)
        
        # disable maximize for this window
        try:
            self.setWindowFlag(Qt.WindowType.WindowMaximizeButtonHint, False)
        except Exception:
            pass
        
        # Fetch suppliers for the manufacturer dropdown
        self.fetch_suppliers()
        self.setup_ui()

    def fetch_suppliers(self):
        """Fetch manufacturer data from the local GraphQL endpoint with authentication."""
        self.suppliers = []

        url = data_info.graphql_url
        query = '''{ 
            "query": "query GetManufacturers { emsManufacturersOnly { id name location manufacturingSpecifications assemblySpecifications capabilities equipment } }" 
        }'''

        # Get the token from login.py
        from .login import auth_token

        try:
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {auth_token}"
            }

            if requests:
                resp = requests.post(url, data=query, headers=headers, timeout=3)
                resp.raise_for_status()
                data = resp.json()
            else:
                req = urllib.request.Request(url, data=query.encode("utf-8"), headers=headers)
                with urllib.request.urlopen(req, timeout=3) as res:
                    data = json.load(res)

            # Validate the response structure
            if not isinstance(data, dict):
                raise ValueError(f"Invalid API response: Expected a dictionary, got {type(data).__name__}.")

            payload = data.get("data")
            if not isinstance(payload, dict):
                raise ValueError(f"Invalid API response: 'data' field is missing or not a dictionary.")

            manufacturers = payload.get("emsManufacturersOnly")
            if not isinstance(manufacturers, list):
                raise ValueError(f"Invalid API response: 'emsManufacturersOnly' field is missing or not a list.")

            self.suppliers = [
                {
                    "id": s.get("id"),
                    "name": s.get("name"),
                    "location": s.get("location"),
                    "manufacturingSpecifications": s.get("manufacturingSpecifications"),
                    "assemblySpecifications": s.get("assemblySpecifications"),
                    "capabilities": s.get("capabilities"),
                    "equipment": s.get("equipment")
                }
                for s in manufacturers if isinstance(s, dict) and s.get("name")
            ]

            if not self.suppliers:
                raise ValueError("No manufacturers found in API response.")
            
            # Store all suppliers for search filtering
            self.all_suppliers = self.suppliers.copy()
            print(f"[OK] Loaded {len(self.suppliers)} manufacturers from API")

        except Exception as e:
            self.suppliers = []
            self.all_suppliers = []
            print(f"Could not load manufacturers from API: {e}")
            QMessageBox.warning(
                None,
                "API Connection Error",
                f"Failed to load manufacturers from API:\n{e}\n\n"
                "Please check your internet connection and ensure the API is running."
            )

    def setup_ui(self):
        # set theme and widget styles for the DRC UI
        self.setStyleSheet("""
            QWidget {
                background-color: #0b0b16;
                color: white;
                font-family: 'Segoe UI', sans-serif;
            }
            QLabel {
                color: white;
            }
            QLineEdit, QComboBox {
                background-color: #1b1b2b;
                color: white;
                border: 1px solid #2e2e4f;
                border-radius: 6px;
                padding: 8px;
            }
            QPushButton {
                border-radius: 8px;
                padding: 10px 16px;
                font-weight: bold;
            }
            QPushButton#blueButton {
                background-color: #4c00ff;
                color: white;
            }
            QPushButton#blueButton:hover {
                background-color: #5e3dff;
            }
            QPushButton#navButton {
                background-color: transparent;
                color: #bfbfbf;
                font-weight: 500;
            }
            QPushButton#navButton:hover {
                color: white;
            }
            QTableWidget {
                background-color: #141425;
                border-radius: 8px;
            }
            QHeaderView::section {
                background-color: #1e1e2f;
                color: #bfbfbf;
                border: none;
                padding: 8px;
                font-weight: bold;
            }
        """)

        # Prevent the window from shrinking when views toggle
        try:
            self.setMinimumSize(960, 600)
        except Exception:
            pass

        main_layout = QVBoxLayout()
        main_layout.setContentsMargins(40, 20, 40, 20)
        main_layout.setSpacing(20)

        # === Top Navigation Bar ===
        nav_bar = QHBoxLayout()
        logo = QLabel("💠 Fabspace AI")
        logo.setFont(QFont("Arial", 14, QFont.Weight.Bold))
        nav_bar.addWidget(logo)

        nav_bar.addSpacerItem(QSpacerItem(40, 20, QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Minimum))

        # create nav buttons; Home is wired to controller when present
        for item in ["Home", "Projects", "Community", "Help"]:
            btn = QPushButton(item)
            btn.setObjectName("navButton")
            # connect Home button to navigate back when controller provided
            if item == "Home":
                btn.clicked.connect(self.on_home_clicked)
            nav_bar.addWidget(btn)

        profile_btn = QPushButton("👤")
        profile_btn.setObjectName("navButton")
        profile_btn.setFixedSize(30, 30)
        nav_bar.addWidget(profile_btn)
        main_layout.addLayout(nav_bar)

        line = QFrame()
        line.setFrameShape(QFrame.Shape.HLine)
        line.setStyleSheet("color: #1e1e2f;")
        main_layout.addWidget(line)

        # === Header Section ===
        header_layout = QVBoxLayout()
        title = QLabel("Automate DRC")
        title.setFont(QFont("Arial", 22, QFont.Weight.Bold))
        subtitle = QLabel("Automate your Design Rule Check with AI-powered manufacturer selection and spec importation.")
        subtitle.setStyleSheet("color: #bfbfbf; font-size: 13px;")

        header_layout.addWidget(title)
        header_layout.addWidget(subtitle)
        main_layout.addLayout(header_layout)

        # === Search and Actions Section ===
        input_layout = QHBoxLayout()
        input_layout.setSpacing(40)  # Add spacing between left and right panels
        
        left_layout = QVBoxLayout()
        left_layout.setSpacing(10)  # Add spacing between elements

        lbl_search = QLabel("Search Manufacturer")
        lbl_search.setStyleSheet("font-size: 14px; margin-bottom: 4px;")
        self.txt_search = QLineEdit()
        self.txt_search.setPlaceholderText("🔍 Search by name or location")
        self.txt_search.textChanged.connect(self.search_suppliers)

        lbl_select = QLabel("Select Manufacturer")
        lbl_select.setStyleSheet("font-size: 14px; margin-top: 12px; margin-bottom: 4px;")
        self.combo_select = QComboBox()
        self.combo_select.addItem("Select from your favorites")
        # Add suppliers from API
        for supplier in self.suppliers:
            if isinstance(supplier, dict) and supplier.get("name"):
                display_text = supplier["name"]
                if supplier.get("location"):
                    display_text += f" ({supplier['location']})"
                self.combo_select.addItem(display_text)

        import_btn = QPushButton("⬇️  Import Specs")
        import_btn.setObjectName("blueButton")
        import_btn.setFixedWidth(220)
        import_btn.setFixedHeight(44)
        import_btn.setStyleSheet("""
            QPushButton#blueButton {
                background-color: #4c00ff;
                color: white;
                font-size: 14px;
                margin-top: 16px;
            }
            QPushButton#blueButton:hover {
                background-color: #5e3dff;
            }
        """)
        import_btn.clicked.connect(self.import_specs)

        left_layout.addWidget(lbl_search)
        left_layout.addWidget(self.txt_search)
        left_layout.addWidget(lbl_select)
        left_layout.addWidget(self.combo_select)
        left_layout.addWidget(import_btn)
        input_layout.addLayout(left_layout)

        # === Right Panel: Run DRC Card ===
        right_layout = QVBoxLayout()
        right_layout.setAlignment(Qt.AlignmentFlag.AlignCenter)

        drc_card = QFrame()
        drc_card.setStyleSheet("""
            QFrame {
                background-color: #1b1b2b;
                border-radius: 12px;
                padding: 20px;
            }
        """)
        card_layout = QVBoxLayout()
        card_layout.setAlignment(Qt.AlignmentFlag.AlignCenter)

        drc_label = QLabel("Run DRC\nClick to start the Design Rule Check process.")
        drc_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        drc_label.setStyleSheet("color: #bfbfbf; font-size: 13px;")

        run_btn = QPushButton("▶️  Run DRC")
        run_btn.setObjectName("blueButton")
        run_btn.setFixedWidth(200)
        # run the DRC when the Run button is clicked
        run_btn.clicked.connect(self.run_drc)

        card_layout.addWidget(drc_label)
        card_layout.addWidget(run_btn)
        drc_card.setLayout(card_layout)

        right_layout.addWidget(drc_card)
        input_layout.addLayout(right_layout)
        main_layout.addLayout(input_layout)

        # === Violations/Results Header ===
        header_row = QHBoxLayout()
        self.lbl_violations = QLabel("Design Rule Violations")
        self.lbl_violations.setFont(QFont("Arial", 16, QFont.Weight.Bold))
        self.lbl_violations.setContentsMargins(0, 20, 0, 10)
        header_row.addWidget(self.lbl_violations)

        header_row.addSpacerItem(QSpacerItem(40, 20, QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Minimum))

        # status chip (hidden until a run occurs)
        self.drc_status_chip = QLabel("")
        self.drc_status_chip.setVisible(False)
        self.drc_status_chip.setStyleSheet(
            """
            QLabel {
                background-color: #0f5e33; /* default green-ish; overridden when needed */
                color: #e8fff3;
                border: 1px solid #1a7b48;
                border-radius: 14px;
                padding: 6px 12px;
                font-weight: 600;
            }
            """
        )
        header_row.addWidget(self.drc_status_chip)
        main_layout.addLayout(header_row)

        # === Result Card (Shown when there are NO violations) ===
        self.result_card = QFrame()
        self.result_card.setVisible(False)
        self.result_card.setStyleSheet(
            """
            QFrame {
                background-color: transparent;
                border-radius: 12px;
            }
            QPushButton#quoteButton {
                color: white;
                font-weight: 700;
                padding: 12px 20px;
                border: none;
                border-radius: 10px;
                background-color: qlineargradient(x1:0, y1:0, x2:1, y2:0,
                                                  stop:0 #4c00ff, stop:1 #a149ff);
            }
            QPushButton#quoteButton:hover {
                background-color: qlineargradient(x1:0, y1:0, x2:1, y2:0,
                                                  stop:0 #5e3dff, stop:1 #b56bff);
            }
            """
        )

        result_layout = QVBoxLayout()
        result_layout.setAlignment(Qt.AlignmentFlag.AlignCenter)

        icon_label = QLabel("✅")
        icon_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        icon_label.setFont(QFont("Arial", 40, QFont.Weight.Bold))

        title_ok = QLabel("No violations found.")
        title_ok.setFont(QFont("Arial", 18, QFont.Weight.Bold))
        title_ok.setAlignment(Qt.AlignmentFlag.AlignCenter)

        subtitle_ok = QLabel(
            "Your design has passed the Design Rule Check successfully. You can now proceed with manufacturing."
        )
        subtitle_ok.setAlignment(Qt.AlignmentFlag.AlignCenter)
        subtitle_ok.setStyleSheet("color: #bfbfbf; font-size: 13px;")

        quote_btn = QPushButton("Get Instant Quote")
        quote_btn.setObjectName("quoteButton")
        quote_btn.setFixedWidth(220)
        quote_btn.clicked.connect(self.on_get_quote_clicked)

        result_layout.addWidget(icon_label)
        result_layout.addSpacing(6)
        result_layout.addWidget(title_ok)
        result_layout.addWidget(subtitle_ok)
        result_layout.addSpacing(12)
        result_layout.addWidget(quote_btn, 0, Qt.AlignmentFlag.AlignHCenter)
        self.result_card.setLayout(result_layout)

        # Make the card naturally expand to available space
        self.result_card.setSizePolicy(QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Expanding)

        # === Violations Table ===
        self.table = QTableWidget()
        self.table.setColumnCount(3)
        self.table.setHorizontalHeaderLabels(["ISSUE", "DESCRIPTION", "LOCATION"])
        self.table.horizontalHeader().setSectionResizeMode(QHeaderView.ResizeMode.Stretch)
        self.table.verticalHeader().setVisible(False)
        self.table.setEditTriggers(QTableWidget.EditTrigger.NoEditTriggers)
        self.table.setShowGrid(False)

        issues = [
            ("Clearance Violation", "Minimum clearance between traces is violated.", "View on Canvas"),
            ("Track Width Violation", "Track width is below the minimum specified.", "View on Canvas"),
            ("Via Size Violation", "Via size does not meet the required dimensions.", "View on Canvas"),
        ]

        self.table.setRowCount(len(issues))
        for row, (issue, desc, loc) in enumerate(issues):
            self.table.setItem(row, 0, QTableWidgetItem(issue))
            self.table.setItem(row, 1, QTableWidgetItem(desc))
            link_item = QTableWidgetItem(loc)
            link_item.setForeground(Qt.GlobalColor.blue)
            self.table.setItem(row, 2, link_item)

        # === Central stack that toggles between table and result card ===
        self.result_stack = QStackedWidget()
        self.result_stack.setSizePolicy(QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Expanding)
        self.result_stack.addWidget(self.table)        # index 0
        self.result_stack.addWidget(self.result_card)  # index 1
        self.result_stack.setCurrentWidget(self.table)

        # Make the central area grow to fill space and remain stable when toggling
        main_layout.addWidget(self.result_stack, 1)
        self.setLayout(main_layout)

    def run_drc(self):
        """Run the DRC and update the UI to reflect the results.

        This placeholder simulates a successful DRC (no violations). If you
        connect to a real DRC, return a list of violations in the following
        structure and pass it to display_drc_results:
            [
                {"issue": str, "description": str, "location": str},
                ...
            ]
        """
        # Check if specifications have been imported
        if not self.specs_imported:
            QMessageBox.warning(
                self,
                "No Specifications Imported",
                "Please import manufacturer specifications before running DRC.\n\n"
                "Select a manufacturer and click 'Import Specs' to continue."
            )
            return
        
        print("Running Design Rule Check...")

        try:
            # Simulate/collect results from an actual DRC engine
            violations = self.perform_drc()
        except Exception as e:
            violations = [
                {
                    "issue": "DRC Error",
                    "description": f"An error occurred while running DRC: {e}",
                    "location": "-",
                }
            ]

        self.display_drc_results(violations)

    def perform_drc(self):
        """Placeholder for the actual DRC runner.

        Return a list of violations. An empty list means the design passed.
        """
        # TODO: Replace this with real KiCad DRC integration and parse results
        return []  # empty => no violations

    def display_drc_results(self, violations):
        """Update the header and table to show DRC results.

        If there are no violations, show a green "DRC Passed" chip and a
        single centered table row saying no violations.
        Otherwise, populate the table with the violations and set an
        appropriate failure status.
        """
        if not isinstance(violations, list):
            violations = []

        if len(violations) == 0:
            # Passed state
            self.lbl_violations.setText("DRC Result")
            self.drc_status_chip.setText("🟢 DRC Passed")
            self.drc_status_chip.setStyleSheet(
                """
                QLabel {
                    background-color: #0f5e33;
                    color: #e8fff3;
                    border: 1px solid #1a7b48;
                    border-radius: 14px;
                    padding: 6px 12px;
                    font-weight: 600;
                }
                """
            )
            self.drc_status_chip.setVisible(True)
            # Show the result card in the central stack
            try:
                self.result_stack.setCurrentWidget(self.result_card)
            except Exception:
                # fallback if stack not present
                self.result_card.setVisible(True)
                self.table.setVisible(False)
        else:
            # Failed state: show violations
            self.lbl_violations.setText("Design Rule Violations")
            self.drc_status_chip.setText("🔴 DRC Failed")
            self.drc_status_chip.setStyleSheet(
                """
                QLabel {
                    background-color: #5e0f22;
                    color: #ffe8ee;
                    border: 1px solid #7b1a31;
                    border-radius: 14px;
                    padding: 6px 12px;
                    font-weight: 600;
                }
                """
            )
            self.drc_status_chip.setVisible(True)
            # Show violations table in the central stack
            try:
                self.result_stack.setCurrentWidget(self.table)
            except Exception:
                self.result_card.setVisible(False)
                self.table.setVisible(True)
            self.table.clearContents()
            self.table.setRowCount(len(violations))
            # Clear any previous spanning
            try:
                for r in range(self.table.rowCount()):
                    for c in range(self.table.columnCount()):
                        self.table.setSpan(r, c, 1, 1)
            except Exception:
                pass

            for row, v in enumerate(violations):
                self.table.setItem(row, 0, QTableWidgetItem(v.get("issue", "-")))
                self.table.setItem(row, 1, QTableWidgetItem(v.get("description", "-")))
                loc_item = QTableWidgetItem(v.get("location", "View on Canvas"))
                loc_item.setForeground(Qt.GlobalColor.blue)
                self.table.setItem(row, 2, loc_item)

    def on_get_quote_clicked(self):
        """Handle 'Get Instant Quote' action - zip the project and prepare for quote."""
        try:
            from . import quote
            
            # Show progress message
            QMessageBox.information(
                self,
                "Preparing Quote",
                "Zipping your KiCad project files for quote submission..."
            )
            
            # Zip the current project
            zip_path = quote.zip_current_project()
            
            if zip_path:
                # Validate the zip
                is_valid, missing = quote.validate_zip_contents(zip_path)
                
                if is_valid:
                    QMessageBox.information(
                        self,
                        "Project Zipped Successfully",
                        f"Your project has been zipped successfully!\n\n"
                        f"Location: {zip_path}\n\n"
                        f"You can now upload this file to get an instant quote."
                    )
                else:
                    warning_msg = f"Project zipped, but some files may be missing:\n\n"
                    for msg in missing:
                        warning_msg += f"• {msg}\n"
                    warning_msg += f"\nLocation: {zip_path}"
                    
                    QMessageBox.warning(
                        self,
                        "Project Zipped with Warnings",
                        warning_msg
                    )
                
                # If controller has open_quote method, call it with the zip path
                if hasattr(self, "controller") and self.controller and hasattr(self.controller, "open_quote"):
                    self.controller.open_quote(zip_path)
                    return
                
                print(f"[INFO] Project zip created: {zip_path}")
            else:
                QMessageBox.critical(
                    self,
                    "Zip Failed",
                    "Failed to create project zip file.\n\n"
                    "Please make sure you have an active KiCad project open."
                )
                
        except Exception as e:
            QMessageBox.critical(
                self,
                "Quote Error",
                f"Failed to prepare quote:\n{e}"
            )
            import traceback
            traceback.print_exc()
            print(f"[ERROR] Quote preparation failed: {e}")

    def on_home_clicked(self):
        """Navigate back to the main Fabspace dashboard if a controller exists.

        Uses the controller's show_main_page() method; falls back to printing
        a message if no controller was provided (useful when the window is
        used standalone for testing).
        """
        if hasattr(self, "controller") and self.controller:
            try:
                self.controller.show_main_page()
            except Exception as e:
                # try to show a GUI warning; fall back to printing if that fails
                QMessageBox = None
                try:
                    from PyQt6.QtWidgets import QMessageBox
                    QMessageBox.warning(self, "Navigation Error", f"Failed to go Home:\n{e}")
                except Exception:
                    print(f"Navigation Error: {e}")
        else:
            # non-GUI fallback
            print("Home clicked (no controller available).")

    def search_suppliers(self, text):
        """Debounced search function that triggers after user stops typing."""
        self.search_timer.stop()
        if text.strip():
            self.search_timer.start(500)  # Wait 500ms after user stops typing
        else:
            # If search is empty, show all suppliers
            self.update_supplier_dropdown(self.all_suppliers)

    def perform_search(self):
        """Perform the actual search via GraphQL API."""
        search_text = self.txt_search.text().strip()
        if not search_text:
            return

        url = data_info.graphql_url
        query = f'''{{ 
            "query": "query SearchManufacturers {{ searchEMSManufacturers(query: \\"{search_text}\\") {{ id name location manufacturingSpecifications assemblySpecifications capabilities equipment }} }}" 
        }}'''

        # Get the token from login.py
        from .login import auth_token

        try:
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {auth_token}"
            }

            if requests:
                resp = requests.post(url, data=query, headers=headers, timeout=3)
                resp.raise_for_status()
                data = resp.json()
            else:
                req = urllib.request.Request(url, data=query.encode("utf-8"), headers=headers)
                with urllib.request.urlopen(req, timeout=3) as res:
                    data = json.load(res)

            # Validate the response structure
            if not isinstance(data, dict):
                raise ValueError(f"Invalid search response: Expected a dictionary.")

            payload = data.get("data")
            if not isinstance(payload, dict):
                raise ValueError(f"Invalid search response: 'data' field is missing.")

            search_results = payload.get("searchEMSManufacturers")
            if not isinstance(search_results, list):
                # If search returns no results, show message but don't error
                self.update_supplier_dropdown([])
                return

            # Format search results
            formatted_results = [
                {
                    "id": s.get("id"),
                    "name": s.get("name"),
                    "location": s.get("location"),
                    "manufacturingSpecifications": s.get("manufacturingSpecifications"),
                    "assemblySpecifications": s.get("assemblySpecifications"),
                    "capabilities": s.get("capabilities"),
                    "equipment": s.get("equipment")
                }
                for s in search_results if isinstance(s, dict) and s.get("name")
            ]

            self.update_supplier_dropdown(formatted_results)

        except Exception as e:
            print(f"Search failed: {e}")
            # On search failure, show all suppliers
            self.update_supplier_dropdown(self.all_suppliers)

    def update_supplier_dropdown(self, suppliers_list):
        """Update the supplier dropdown with the provided list."""
        # Clear existing items except the first one
        self.combo_select.clear()
        self.combo_select.addItem("Select from your favorites")
        
        # Add filtered suppliers
        for supplier in suppliers_list:
            if isinstance(supplier, dict) and supplier.get("name"):
                display_text = supplier["name"]
                # Add location info if available
                if supplier.get("location"):
                    display_text += f" ({supplier['location']})"
                self.combo_select.addItem(display_text)
        
        # Update the current suppliers list for import
        self.suppliers = suppliers_list

    def import_specs(self):
        """Import manufacturing specifications from the selected manufacturer."""
        try:
            # Verify drc_rules module is loaded
            if drc_rules is None:
                QMessageBox.critical(
                    self,
                    "Module Error",
                    "drc_rules module is not loaded. Cannot import specifications.\n\n"
                    "Please check the KiCad scripting console for import errors."
                )
                return
            
            if not hasattr(drc_rules, 'apply_manufacturer_specs'):
                QMessageBox.critical(
                    self,
                    "Module Error",
                    "drc_rules module is not properly loaded. The apply_manufacturer_specs function is missing."
                )
                return
            
            # Get selected manufacturer name
            selected_text = self.combo_select.currentText()
            
            if selected_text == "Select from your favorites":
                QMessageBox.warning(
                    self,
                    "No Manufacturer Selected",
                    "Please select a manufacturer first before importing specifications."
                )
                return
            
            # Extract manufacturer name (remove location if present)
            manufacturer_name = selected_text.split(" (")[0]
            
            # Find the manufacturer in the suppliers list
            selected_manufacturer = None
            for supplier in self.suppliers:
                if supplier.get("name") == manufacturer_name:
                    selected_manufacturer = supplier
                    break
            
            if not selected_manufacturer:
                QMessageBox.warning(
                    self,
                    "Manufacturer Not Found",
                    f"Could not find specifications for '{manufacturer_name}'."
                )
                return
            
            # Get manufacturing specifications
            manuf_specs = selected_manufacturer.get("manufacturingSpecifications")
            
            if not manuf_specs or manuf_specs.strip() == "":
                QMessageBox.warning(
                    self,
                    "No Specifications Available",
                    f"No manufacturing specifications available for '{manufacturer_name}'.\n\n"
                    "Please contact the manufacturer or select a different one."
                )
                return
            
            print(f"Raw specifications from {manufacturer_name}:")
            print(manuf_specs)
            print("-" * 50)
            
            # Parse the specifications string to extract DRC rules
            parsed_rules = self.parse_manufacturing_specs(manuf_specs)
            
            if not parsed_rules:
                QMessageBox.warning(
                    self,
                    "Parse Error",
                    f"Could not parse manufacturing specifications for '{manufacturer_name}'.\n\n"
                    "The specification format may be invalid."
                )
                return
            
            print(f"Parsed rules: {parsed_rules}")
            print("-" * 50)
            
            # Apply the parsed rules
            success = drc_rules.apply_manufacturer_specs(
                manufacturer_name=manufacturer_name,
                specifications=manuf_specs,
                parsed_rules=parsed_rules
            )
            
            if not success:
                QMessageBox.critical(
                    self,
                    "Application Error",
                    f"Failed to apply specifications from '{manufacturer_name}'."
                )
                return
            
            # Show success message with parsed values
            specs_summary = f"Imported specifications from: {manufacturer_name}\n\n"
            if parsed_rules.get("min_trace_width"):
                specs_summary += f"- Min Trace Width: {parsed_rules['min_trace_width']}mm\n"
            if parsed_rules.get("min_clearance"):
                specs_summary += f"- Min Clearance: {parsed_rules['min_clearance']}mm\n"
            if parsed_rules.get("min_annular_ring"):
                specs_summary += f"- Min Annular Ring: {parsed_rules['min_annular_ring']}mm\n"
            if parsed_rules.get("max_layers"):
                specs_summary += f"- Max Layers: {parsed_rules['max_layers']}\n"
            if parsed_rules.get("max_board_thickness"):
                specs_summary += f"- Max Board Thickness: {parsed_rules['max_board_thickness']}mm\n"
            
            specs_summary += "\nYou can now run DRC with these specifications."
            
            # Mark specifications as imported
            self.specs_imported = True
            
            QMessageBox.information(
                self,
                "Specs Imported Successfully",
                specs_summary
            )
            
        except Exception as e:
            QMessageBox.critical(
                self,
                "Import Error",
                f"Failed to import specifications:\n{e}"
            )
            import traceback
            traceback.print_exc()

    def parse_manufacturing_specs(self, specs_text):
        """Parse the manufacturing specifications text to extract DRC parameters."""
        import re
        
        parsed = {}
        
        try:
            # Parse minimum trace width
            match = re.search(r'Minimum trace width \(mm\):\s*([\d.]+)', specs_text)
            if match:
                parsed['min_trace_width'] = float(match.group(1))
            
            # Parse minimum clearance
            match = re.search(r'Minimum clearance \(mm\):\s*([\d.]+)', specs_text)
            if match:
                parsed['min_clearance'] = float(match.group(1))
            
            # Parse minimum annular ring
            match = re.search(r'Minimum annular ring \(mm\):\s*([\d.]+)', specs_text)
            if match:
                parsed['min_annular_ring'] = float(match.group(1))
            
            # Parse maximum layer count
            match = re.search(r'Maximum layer count:\s*(\d+)', specs_text)
            if match:
                parsed['max_layers'] = int(match.group(1))
            
            # Parse maximum board thickness
            match = re.search(r'Maximum board thickness \(mm\):\s*([\d.]+)', specs_text)
            if match:
                parsed['max_board_thickness'] = float(match.group(1))
            
            # Parse maximum board size
            match = re.search(r'Maximum board size \(mm\):\s*\(width:\s*([\d.]+),\s*height:\s*([\d.]+)\)', specs_text)
            if match:
                parsed['max_board_width'] = float(match.group(1))
                parsed['max_board_height'] = float(match.group(2))
            
            # Parse minimum via drill size
            match = re.search(r'Minimum via drill size \(mm\):\s*([\d.]+)', specs_text)
            if match:
                parsed['min_via_drill'] = float(match.group(1))
            
            # Parse supported via types
            if 'through-hole' in specs_text.lower():
                parsed['via_types'] = []
                if 'through-hole' in specs_text.lower():
                    parsed['via_types'].append('through-hole')
                if 'blind' in specs_text.lower():
                    parsed['via_types'].append('blind')
                if 'buried' in specs_text.lower():
                    parsed['via_types'].append('buried')
                if 'microvia' in specs_text.lower():
                    parsed['via_types'].append('microvia')
            
            # Store the original spec text for reference
            parsed['original_specs'] = specs_text
            
        except Exception as e:
            print(f"Error parsing specs: {e}")
        
        return parsed

    def changeEvent(self, event):
        try:
            if event.type() == Qt.EventType.WindowStateChange and self.isMaximized():
                self.showNormal()
        except Exception:
            pass
        super().changeEvent(event)