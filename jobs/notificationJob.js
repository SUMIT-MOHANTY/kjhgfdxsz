const cron = require('node-cron');
const notificationService = require('../services/notificationService');

// Run notification check daily at 9 AM
const scheduleNotifications = () => {
  cron.schedule('0 9 * * *', async () => {
    console.log('Running daily notification check...');
    await notificationService.checkAndSendNotifications();
  }, {
    scheduled: true,
    timezone: 'America/New_York'
  });
  
  console.log('Notification job scheduled to run daily at 9 AM');
};

module.exports = {
  scheduleNotifications
};