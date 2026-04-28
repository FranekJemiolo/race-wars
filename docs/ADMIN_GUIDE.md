# Race Wars Admin Console Guide

## Overview

The Race Wars Admin Console provides race organizers and administrators with tools to manage sessions, monitor races, handle incidents, assign penalties, and analyze performance data.

## Accessing the Admin Console

### Login

1. Navigate to admin.racewars.com
2. Enter your admin credentials
3. Complete two-factor authentication if enabled
4. You'll be redirected to the dashboard

### Permissions

Admin roles include:
- **Super Admin**: Full access to all features
- **Race Director**: Session management, incident handling, penalties
- **Observer**: Read-only access to sessions and analytics
- **Track Marshal**: Incident reporting and resolution

## Dashboard

### Overview

The dashboard provides a high-level view of:
- Active sessions count
- Total participants today
- Recent incidents
- System health status

### Key Metrics

- **Active Sessions**: Number of currently running sessions
- **Total Participants**: Drivers currently on track
- **Incidents Today**: Number of incidents detected
- **System Status**: Health of all services

## Session Management

### Creating a Session

1. Navigate to "Sessions" → "Create New Session"
2. Fill in session details:
   - **Session Name**: e.g., "Weekend Race - Laguna Seca"
   - **Session Type**: Race, Practice, Qualifying, or Hot Lap
   - **Track**: Select from available tracks
   - **Date & Time**: Schedule the session
   - **Duration**: Set session length
   - **Laps**: For lap-based sessions
   - **Car Class**: Restrict to specific class (optional)

3. Configure rules:
   - Flag rules
   - Penalty system
   - Incident detection thresholds
   - Qualifying format (if applicable)

4. Save and publish the session

### Managing Active Sessions

1. **View Session Details**
   - Click on a session in the list
   - View live participant positions
   - Monitor session status
   - Check flag status

2. **Session Controls**
   - **Start**: Begin the session
   - **Pause**: Temporarily halt the session
   - **Resume**: Continue a paused session
   - **End**: Finish the session
   - **Cancel**: Cancel the session (emergency)

3. **Flag Management**
   - Change flag status (Green, Yellow, Red, Blue, Black)
   - Broadcast flag changes to all participants
   - View flag history

### Session Timeline

The Session Timeline provides a chronological view of all events:
- Session start/end
- Incidents
- Penalties
- Flag changes
- Checkpoint crossings

**Features:**
- Filter by event type
- Click events for details
- Export timeline data
- Share timeline link

## Incident Management

### Viewing Incidents

1. **Incident List**
   - Navigate to "Incidents"
   - View all incidents across sessions
   - Filter by type, severity, date
   - Search by driver or session

2. **Incident Details**
   - Click an incident to view details
   - See GPS data at time of incident
   - View video replay (if available)
   - Check related penalties

### Handling Incidents

1. **Review Incident**
   - Examine the incident data
   - Review position data
   - Check witness reports (if any)
   - Determine severity

2. **Assign Penalty**
   - Click "Assign Penalty"
   - Select penalty type:
     - Time penalty (seconds)
     - Grid penalty (positions)
     - Points penalty (championship points)
     - Disqualification
   - Enter penalty amount
   - Add notes explaining the decision
   - Submit the penalty

3. **Resolve Incident**
   - Mark incident as resolved
   - Add resolution notes
   - Close the incident

### Incident Types

The system automatically detects:
- **Off-track**: Driver leaves track boundaries
- **Collision**: Contact between vehicles
- **Spin**: Loss of control
- **Stall**: Vehicle stops on track
- **Speeding**: Exceeding speed limits (pit lane, yellow zones)

## Penalty Management

### Viewing Penalties

1. **Penalty List**
   - Navigate to "Penalties"
   - View all assigned penalties
   - Filter by type, status, date
   - Search by driver

2. **Penalty Details**
   - View penalty information
   - See related incident
   - Check appeal status
   - View application to final results

### Assigning Penalties

1. **Quick Assignment**
   - From the incident list, click "Quick Penalty"
   - Select penalty type and amount
   - Submit immediately

2. **Detailed Assignment**
   - Use the Penalty Assignment component
   - Select from preset penalty types
   - Add detailed notes
   - Set appeal deadline

### Penalty History

Track all penalties assigned to a driver:
- View complete penalty history
- Filter by penalty type
- Check penalty status (pending, applied, appealed)
- Export penalty reports

## Analytics Dashboard

### Session Statistics

- **Total Sessions**: Number of sessions completed
- **Average Duration**: Mean session length
- **Participant Count**: Drivers per session
- **Completion Rate**: Sessions finished vs started

### Incident Statistics

- **Total Incidents**: Number of incidents
- **By Type**: Breakdown by incident type
- **By Severity**: Distribution of severity levels
- **Trend Over Time**: Incident frequency

### Penalty Statistics

- **Total Penalties**: Number of penalties issued
- **By Type**: Breakdown by penalty type
- **By Driver**: Most penalized drivers
- **Application Rate**: Penalties applied vs issued

### Performance Metrics

- **Average Lap Times**: Per driver and per session
- **Best Laps**: Top lap times
- **Sector Analysis**: Sector split times
- **Speed Data**: Top speeds achieved

### Trend Charts

View trends over time:
- Session participation
- Incident frequency
- Penalty distribution
- Performance improvements

## Live Leaderboard

### Real-Time Position Tracking

- View current positions
- See lap counts
- Check time gaps
- Monitor interval to leader
- View last lap times

### Leaderboard Features

- **Auto-refresh**: Updates every second
- **Sort Options**: By position, laps, lap time
- **Filter Options**: Show/hide retired drivers
- **Summary Statistics**: Total participants, laps completed

### Driver Details

Click a driver to see:
- Current position
- Lap times
- Sector splits
- Top speed
- Status (on track, in pits, retired)

## Spectator Features

### Replay Mode

1. **Session Playback**
   - Select a completed session
   - Use timeline scrubber to navigate
   - Control playback speed (0.5x, 1x, 2x, 4x)
   - Play, pause, step through

2. **Replay Features**
   - View participant positions over time
   - See incident markers
   - Track flag changes
   - Select specific participants to follow

### Multi-Camera View

1. **Layout Options**
   - Single view
   - Split screen (2x2)
   - Grid (3x3)
   - Custom layout

2. **Camera Types**
   - Track overview
   - Car-follow camera
   - Pit lane camera
   - Start/finish line
   - Sector cameras

3. **Controls**
   - Add/remove cameras
   - Switch layouts
   - Fullscreen mode
   - Quick layout presets

## User Management

### Managing Users

1. **User List**
   - View all registered users
   - Filter by role, status
   - Search by name or email
   - View user details

2. **User Roles**
   - Assign roles (Driver, Admin, Observer)
   - Set permissions
   - Manage access levels

3. **User Actions**
   - Suspend user account
   - Reset user password
   - View user activity
   - Delete user account

### Car Profiles

1. **View Car Profiles**
   - Browse all registered cars
   - Filter by class, make, model
   - View car specifications

2. **Manage Profiles**
   - Approve/reject pending profiles
   - Update car classifications
   - View car history

## Track Management

### Managing Tracks

1. **Track List**
   - View all available tracks
   - See track details (length, layout)
   - Check track status (active/inactive)

2. **Add New Track**
   - Enter track name
   - Upload track layout (GPX file)
   - Set track boundaries
   - Define sectors
   - Configure pit lane

3. **Track Configuration**
   - Set speed limits
   - Define yellow zones
   - Configure incident detection zones
   - Set pit lane rules

## System Monitoring

### Health Status

Monitor system components:
- **API Server**: Response time, error rate
- **Database**: Connection status, query performance
- **Redis**: Memory usage, hit rate
- **WebSocket**: Connection count, message rate
- **Message Queue**: Queue depth, processing rate

### Metrics

View system metrics:
- CPU usage
- Memory usage
- Disk space
- Network traffic
- Request rate

### Logs

Access application logs:
- Filter by log level
- Search by keyword
- View real-time logs
- Export log data

## Settings

### General Settings

- **Organization Name**: Your organization's name
- **Timezone**: Default timezone for sessions
- **Date Format**: Display format for dates
- **Language**: Interface language

### Notification Settings

- **Email Notifications**: Enable/disable email alerts
- **SMS Notifications**: Enable/disable SMS alerts
- **Push Notifications**: Enable/disable push notifications
- **Notification Types**: Select which events trigger notifications

### Integration Settings

- **OAuth Providers**: Configure Google/Apple OAuth
- **Sentry**: Configure error tracking
- **Prometheus**: Configure metrics export
- **Jaeger**: Configure distributed tracing

## Troubleshooting

### Common Issues

**Problem: Session not starting**
- Check session configuration
- Verify track is active
- Ensure no conflicting sessions
- Check system status

**Problem: GPS data not appearing**
- Verify participant has connected
- Check WebSocket connection
- Review GPS accuracy settings
- Check participant's device status

**Problem: Incidents not being detected**
- Review detection thresholds
- Check track boundary configuration
- Verify GPS data quality
- Check system logs

**Problem: Penalties not applying**
- Verify penalty configuration
- Check session status
- Review penalty rules
- Check system logs

## Best Practices

### Session Management

- Test session configuration before going live
- Have a backup plan for technical issues
- Communicate clearly with participants
- Monitor session throughout

### Incident Handling

- Review incidents promptly
- Be consistent with penalty decisions
- Document all decisions thoroughly
- Allow for appeals when appropriate

### System Maintenance

- Monitor system health regularly
- Review logs for errors
- Keep software updated
- Test disaster recovery procedures

## Security

### Access Control

- Use strong passwords
- Enable two-factor authentication
- Review user access regularly
- Revoke access for former staff

### Data Protection

- Regularly backup data
- Encrypt sensitive information
- Follow privacy regulations
- Monitor for unauthorized access

## Support

### Getting Help

- **Email**: admin-support@racewars.com
- **Documentation**: docs.racewars.com/admin
- **Community**: admin-community.racewars.com
- **Emergency**: Emergency hotline for critical issues

### Reporting Issues

When reporting issues, include:
- Your admin account
- Steps to reproduce
- Screenshots if applicable
- Browser and version
- Time of occurrence

## FAQ

**Q: Can I manage multiple sessions simultaneously?**
A: Yes, you can monitor and manage multiple active sessions.

**Q: How do I export session data?**
A: Use the export button on the session details page to download CSV or JSON data.

**Q: Can I customize penalty types?**
A: Yes, contact support to add custom penalty types for your organization.

**Q: How accurate is the incident detection?**
A: Detection accuracy depends on GPS quality and configuration. Review thresholds for your tracks.

**Q: Can spectators view sessions?**
A: Yes, use the spectator features to enable public viewing of sessions.

---

**Version**: 1.0  
**Last Updated**: January 28, 2024
