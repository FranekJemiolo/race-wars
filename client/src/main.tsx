import React from "react"
import ReactDOM from "react-dom/client"
import EnhancedApp from "./app/App.enhanced"
import "leaflet/dist/leaflet.css"
import "./index.css"

// Render the main application
const root = ReactDOM.createRoot(document.getElementById("root")!)
root.render(<EnhancedApp />)
