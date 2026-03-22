import { Capacitor, registerPlugin } from '@capacitor/core';
import { LocalNotifications, ScheduleOptions } from '@capacitor/local-notifications';
import { stoicQuotes } from '@/data/stoicQuotes';

// Native widget bridge plugin
interface WidgetBridgePlugin {
  setTrackingState(options: { isTracking: boolean; habitName: string; targetMinutes?: number }): Promise<void>;
  setDailyProgress(options: { progress: number; completedHabits: number; totalHabits: number }): Promise<void>;
  getTrackingState(): Promise<{ isTracking: boolean; habitName: string; targetMinutes: number; startTimeMs: number; dailyProgress: number }>;
}
const WidgetBridge = registerPlugin<WidgetBridgePlugin>('WidgetBridge');

// Notification IDs (reserved ranges)
const TRACKING_NOTIFICATION_ID = 9999;
const DAILY_QUOTE_ID = 8888;
const ROOM_ACTIVITY_BASE_ID = 7000;

let roomActivityCounter = 0;

export const notificationService = {

  // ---------- Permission ----------
  async requestPermission(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) return false;
    try {
      const perm = await LocalNotifications.checkPermissions();
      if (perm.display === 'granted') return true;
      const req = await LocalNotifications.requestPermissions();
      return req.display === 'granted';
    } catch {
      return false;
    }
  },

  // ---------- Persistent Tracking Notification ----------
  async showTrackingNotification(habitName: string, targetMinutes: number = 60): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;
    try {
      // Update widget
      await WidgetBridge.setTrackingState({ isTracking: true, habitName, targetMinutes });

      await LocalNotifications.schedule({
        notifications: [{
          id: TRACKING_NOTIFICATION_ID,
          title: '⏱️ Tracking Active',
          body: `Working on "${habitName}" — keep going! 💪`,
          ongoing: true,
          autoCancel: false,
          smallIcon: 'ic_stat_icon_config_sample',
          largeIcon: 'ic_launcher',
          channelId: 'tracking',
        }],
      });
    } catch (e) {
      console.warn('Notification error:', e);
    }
  },

  async clearTrackingNotification(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;
    try {
      // Update widget
      await WidgetBridge.setTrackingState({ isTracking: false, habitName: '' });
      await LocalNotifications.cancel({ notifications: [{ id: TRACKING_NOTIFICATION_ID }] });
    } catch {}
  },

  // ---------- Daily Stoic Quote ----------
  async scheduleDailyQuote(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;
    try {
      // Cancel any existing schedule
      await LocalNotifications.cancel({ notifications: [{ id: DAILY_QUOTE_ID }] });

      // Pick a random quote
      const quote = stoicQuotes[Math.floor(Math.random() * stoicQuotes.length)];

      // Schedule for tomorrow 8 AM
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(8, 0, 0, 0);

      await LocalNotifications.schedule({
        notifications: [{
          id: DAILY_QUOTE_ID,
          title: '🏛️ Daily Wisdom',
          body: `"${quote.text}" — ${quote.author}`,
          schedule: { at: tomorrow, every: 'day', allowWhileIdle: true },
          smallIcon: 'ic_stat_icon_config_sample',
          largeIcon: 'ic_launcher',
          channelId: 'quotes',
        }],
      });
    } catch (e) {
      console.warn('Quote schedule error:', e);
    }
  },

  // ---------- Room Activity Completion ----------
  async notifyRoomActivity(memberName: string, habitName: string, durationMinutes: number): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;
    try {
      roomActivityCounter = (roomActivityCounter + 1) % 999;
      await LocalNotifications.schedule({
        notifications: [{
          id: ROOM_ACTIVITY_BASE_ID + roomActivityCounter,
          title: '🎯 Room Activity',
          body: `${memberName} logged ${durationMinutes}m on "${habitName}"`,
          smallIcon: 'ic_stat_icon_config_sample',
          largeIcon: 'ic_launcher',
          channelId: 'room',
        }],
      });
    } catch (e) {
      console.warn('Room notification error:', e);
    }
  },

  // ---------- Create Channels (Android) ----------
  async createChannels(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;
    try {
      await LocalNotifications.createChannel({
        id: 'tracking',
        name: 'Activity Tracking',
        description: 'Ongoing notification while tracking a habit',
        importance: 4, // HIGH
        visibility: 1,
        vibration: false,
        sound: '',
      });
      await LocalNotifications.createChannel({
        id: 'quotes',
        name: 'Daily Quotes',
        description: 'Daily stoic & motivational quotes',
        importance: 3, // DEFAULT
        visibility: 1,
      });
      await LocalNotifications.createChannel({
        id: 'room',
        name: 'Room Activity',
        description: 'When room members complete activities',
        importance: 3, // DEFAULT
        visibility: 1,
      });
    } catch (e) {
      console.warn('Channel creation error:', e);
    }
  },

  // ---------- Update Widget Daily Progress ----------
  async updateDailyProgress(progress: number, completedHabits: number, totalHabits: number): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;
    try {
      await WidgetBridge.setDailyProgress({ progress, completedHabits, totalHabits });
    } catch (e) {
      console.warn('Widget progress update error:', e);
    }
  },

  // ---------- Init (call on app start) ----------
  async init(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;
    const granted = await this.requestPermission();
    if (!granted) return;
    await this.createChannels();
    await this.scheduleDailyQuote();
  },
};
