/**
 * Notification Preferences Component
 * 
 * Allows users to manage their notification preferences
 * for push notifications, email notifications, and in-app notifications
 */

import React, { useState, useEffect } from 'react';

interface NotificationPreferences {
  enableEmail: boolean;
  enablePush: boolean;
  enableInApp: boolean;
  raceNotifications: boolean;
  flagNotifications: boolean;
  penaltyNotifications: boolean;
  positionNotifications: boolean;
  proximityAlerts: boolean;
}

const NotificationPreferences: React.FC = () => {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    enableEmail: true,
    enablePush: true,
    enableInApp: true,
    raceNotifications: true,
    flagNotifications: true,
    penaltyNotifications: true,
    positionNotifications: false,
    proximityAlerts: true,
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      // TODO: Load user preferences from API
      // const userPreferences = await notificationService.getUserPreferences(userId);
      // setPreferences(userPreferences);
    } catch (error) {
      console.error('Failed to load notification preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    try {
      setSaving(true);
      // TODO: Save user preferences to API
      // await notificationService.updateUserPreferences(userId, preferences);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to save notification preferences:', error);
    } finally {
      setSaving(false);
    }
  };

  const handlePreferenceChange = (key: keyof NotificationPreferences, value: boolean) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const resetToDefaults = () => {
    setPreferences({
      enableEmail: true,
      enablePush: true,
      enableInApp: true,
      raceNotifications: true,
      flagNotifications: true,
      penaltyNotifications: true,
      positionNotifications: false,
      proximityAlerts: true,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Notification Preferences</h1>
          <p className="text-gray-600 mt-2">
            Manage how you receive notifications during races and events.
          </p>
        </div>

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 0l-2 2a1 1 0 001.414 1.414L9 11.414l2.293 2.293a1 1 0 001.414-1.414L10 10.586l2.293-2.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-800">
                  Your notification preferences have been saved successfully!
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {/* Notification Channels */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Notification Channels</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label htmlFor="enableEmail" className="text-sm font-medium text-gray-700">
                    Email Notifications
                  </label>
                  <p className="text-sm text-gray-500">
                    Receive notifications via email
                  </p>
                </div>
                <button
                  id="enableEmail"
                  onClick={() => handlePreferenceChange('enableEmail', !preferences.enableEmail)}
                  className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                    preferences.enableEmail ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`translate-x-0 inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${
                      preferences.enableEmail ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label htmlFor="enablePush" className="text-sm font-medium text-gray-700">
                    Push Notifications
                  </label>
                  <p className="text-sm text-gray-500">
                    Receive push notifications on your mobile device
                  </p>
                </div>
                <button
                  id="enablePush"
                  onClick={() => handlePreferenceChange('enablePush', !preferences.enablePush)}
                  className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                    preferences.enablePush ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`translate-x-0 inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${
                      preferences.enablePush ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label htmlFor="enableInApp" className="text-sm font-medium text-gray-700">
                    In-App Notifications
                  </label>
                  <p className="text-sm text-gray-500">
                    Receive notifications within the app
                  </p>
                </div>
                <button
                  id="enableInApp"
                  onClick={() => handlePreferenceChange('enableInApp', !preferences.enableInApp)}
                  className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                    preferences.enableInApp ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`translate-x-0 inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${
                      preferences.enableInApp ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Notification Types */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Notification Types</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label htmlFor="raceNotifications" className="text-sm font-medium text-gray-700">
                    Race Notifications
                  </label>
                  <p className="text-sm text-gray-500">
                    Race starting, started, and finished notifications
                  </p>
                </div>
                <button
                  id="raceNotifications"
                  onClick={() => handlePreferenceChange('raceNotifications', !preferences.raceNotifications)}
                  className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                    preferences.raceNotifications ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`translate-x-0 inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${
                      preferences.raceNotifications ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label htmlFor="flagNotifications" className="text-sm font-medium text-gray-700">
                    Flag Notifications
                  </label>
                  <p className="text-sm text-gray-500">
                    Yellow flag, red flag, safety car, and other flag changes
                  </p>
                </div>
                <button
                  id="flagNotifications"
                  onClick={() => handlePreferenceChange('flagNotifications', !preferences.flagNotifications)}
                  className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                    preferences.flagNotifications ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`translate-x-0 inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${
                      preferences.flagNotifications ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label htmlFor="penaltyNotifications" className="text-sm font-medium text-gray-700">
                    Penalty Notifications
                  </label>
                  <p className="text-sm text-gray-500">
                    Speed violations and penalty notifications
                  </p>
                </div>
                <button
                  id="penaltyNotifications"
                  onClick={() => handlePreferenceChange('penaltyNotifications', !preferences.penaltyNotifications)}
                  className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                    preferences.penaltyNotifications ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`translate-x-0 inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${
                      preferences.penaltyNotifications ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label htmlFor="positionNotifications" className="text-sm font-medium text-gray-700">
                    Position Updates
                  </label>
                  <p className="text-sm text-gray-500">
                    Position changes during races
                  </p>
                </div>
                <button
                  id="positionNotifications"
                  onClick={() => handlePreferenceChange('positionNotifications', !preferences.positionNotifications)}
                  className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                    preferences.positionNotifications ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`translate-x-0 inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${
                      preferences.positionNotifications ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label htmlFor="proximityAlerts" className="text-sm font-medium text-gray-700">
                    Proximity Alerts
                  </label>
                  <p className="text-sm text-gray-500">
                    Dangerous proximity and closing speed alerts
                  </p>
                </div>
                <button
                  id="proximityAlerts"
                  onClick={() => handlePreferenceChange('proximityAlerts', !preferences.proximityAlerts)}
                  className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                    preferences.proximityAlerts ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`translate-x-0 inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${
                      preferences.proximityAlerts ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex justify-between">
          <button
            onClick={resetToDefaults}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Reset to Defaults
          </button>
          <div className="space-x-4">
            <button
              onClick={() => window.history.back()}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              onClick={savePreferences}
              disabled={saving}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Preferences'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationPreferences;
