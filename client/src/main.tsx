import React from "react"
import ReactDOM from "react-dom/client"
import EnhancedApp from "./app/App.enhanced"
import ConnectionManager from "./app/ConnectionManager"
import RaceSelector from "./app/RaceSelector"
import RaceCreator from "./app/RaceCreator"
import AdminConsole from "./app/AdminConsole"
import RacingView from "./app/RacingView"
import "leaflet/dist/leaflet.css"
import "./index.css"

// Check URL for view mode - for screenshots
const urlParams = new URLSearchParams(window.location.search)
const viewMode = urlParams.get('view')

// Render appropriate component based on view mode
const root = ReactDOM.createRoot(document.getElementById("root")!)

if (viewMode === 'connection') {
  root.render(<ConnectionManager onConnected={async () => {}} onRaceJoined={async () => {}} onAdminAccess={() => {}} currentUser={null} isSpectator={false} onLogout={async () => {}} />)
} else if (viewMode === 'race-selector') {
  root.render(<RaceSelector onRaceJoined={async () => {}} onCreateRace={() => {}} onSpectate={async () => {}} onBackToConnection={() => {}} />)
} else if (viewMode === 'race-creator') {
  root.render(<RaceCreator onRaceCreated={async () => {}} onCancel={() => {}} />)
} else if (viewMode === 'admin') {
  root.render(<AdminConsole onBack={() => {}} />)
} else if (viewMode === 'racing') {
  root.render(<RacingView onLeaveRace={() => {}} onSpectate={() => {}} />)
} else {
  root.render(<EnhancedApp />)
}
