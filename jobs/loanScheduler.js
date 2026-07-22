const cron = require('node-cron');
const Loan = require('../models/Loan');
const NotificationService = require('../services/notificationService');

class LoanScheduler {
  static start() {
    // Update overdue status every hour
    cron.schedule('0 * * * *', async () => {
      console.log('Running overdue status update...');
      await this.updateOverdueStatus();
    });

    // Send due date reminders daily at 9 AM
    cron.schedule('0 9 * * *', async () => {
      console.log('Sending due date reminders...');
      await NotificationService.sendDueDateReminders();
    });

    // Send overdue notifications daily at 10 AM
    cron.schedule('0 10 * * *', async () => {
      console.log('Sending overdue notifications...');
      await NotificationService.sendOverdueNotifications();
    });

    console.log('Loan scheduler started');
  }

  static async updateOverdueStatus() {
    try {
      const result = await Loan.updateMany(
        {
          status: 'active',
          dueDate: { $lt: new Date() },
          returnDate: null
        },
        {
          $set: { status: 'overdue' }
        }
      );

      console.log(`Updated ${result.modifiedCount} loans to overdue status`);
    } catch (error) {
      console.error('Error updating overdue status:', error);
    }
  }

  static async calculateFinesForOverdueLoans() {
    try {
      const overdueLoans = await Loan.find({
        status: 'overdue',
        returnDate: null
      });

      for (const loan of overdueLoans) {
        const fine = loan.calculateFine();
        if (fine !== loan.fineAmount) {
          loan.fineAmount = fine;
          await loan.save();
        }
      }

      console.log(`Updated fines for ${overdueLoans.length} overdue loans`);
    } catch (error) {
      console.error('Error calculating fines:', error);
    }
  }
}

module.exports = LoanScheduler;