const nodemailer = require('nodemailer');
const Loan = require('../models/Loan');

class NotificationService {
  constructor() {
    this.transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  async sendDueDateReminder(loan) {
    try {
      const mailOptions = {
        from: process.env.FROM_EMAIL || 'library@example.com',
        to: loan.user.email,
        subject: 'Library Book Due Date Reminder',
        html: `
          <h2>Book Due Date Reminder</h2>
          <p>Dear ${loan.user.name},</p>
          <p>This is a reminder that the following book is due soon:</p>
          <ul>
            <li><strong>Title:</strong> ${loan.book.title}</li>
            <li><strong>Author:</strong> ${loan.book.author}</li>
            <li><strong>Due Date:</strong> ${loan.dueDate.toLocaleDateString()}</li>
          </ul>
          <p>Please return the book by the due date to avoid late fees.</p>
          <p>You can renew the book online if you need more time (up to 2 renewals).</p>
          <p>Thank you!</p>
        `
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`Due date reminder sent to ${loan.user.email}`);
    } catch (error) {
      console.error('Error sending due date reminder:', error);
    }
  }

  async sendOverdueNotification(loan) {
    try {
      const fine = loan.calculateFine();
      
      const mailOptions = {
        from: process.env.FROM_EMAIL || 'library@example.com',
        to: loan.user.email,
        subject: 'Library Book Overdue Notice',
        html: `
          <h2>Overdue Book Notice</h2>
          <p>Dear ${loan.user.name},</p>
          <p>The following book is now overdue:</p>
          <ul>
            <li><strong>Title:</strong> ${loan.book.title}</li>
            <li><strong>Author:</strong> ${loan.book.author}</li>
            <li><strong>Due Date:</strong> ${loan.dueDate.toLocaleDateString()}</li>
            <li><strong>Current Fine:</strong> $${fine.toFixed(2)}</li>
          </ul>
          <p>Please return the book as soon as possible to minimize additional fees.</p>
          <p>Late fees are $0.50 per day.</p>
          <p>Thank you!</p>
        `
      };

      await this.transporter.sendMail(mailOptions);
      loan.notificationsSent += 1;
      await loan.save();
      
      console.log(`Overdue notification sent to ${loan.user.email}`);
    } catch (error) {
      console.error('Error sending overdue notification:', error);
    }
  }

  async sendDueDateReminders() {
    try {
      // Send reminders 3 days before due date
      const reminderDate = new Date();
      reminderDate.setDate(reminderDate.getDate() + 3);
      
      const upcomingDueLoans = await Loan.find({
        status: 'active',
        dueDate: {
          $gte: new Date(reminderDate.getFullYear(), reminderDate.getMonth(), reminderDate.getDate()),
          $lt: new Date(reminderDate.getFullYear(), reminderDate.getMonth(), reminderDate.getDate() + 1)
        },
        notificationsSent: 0
      }).populate('user', 'name email').populate('book', 'title author');

      for (const loan of upcomingDueLoans) {
        await this.sendDueDateReminder(loan);
        loan.notificationsSent = 1;
        await loan.save();
      }

      console.log(`Sent ${upcomingDueLoans.length} due date reminders`);
    } catch (error) {
      console.error('Error sending due date reminders:', error);
    }
  }

  async sendOverdueNotifications() {
    try {
      const overdueLoans = await Loan.find({
        status: { $in: ['active', 'overdue'] },
        dueDate: { $lt: new Date() },
        returnDate: null,
        notificationsSent: { $lt: 5 } // Max 5 notifications
      }).populate('user', 'name email').populate('book', 'title author');

      for (const loan of overdueLoans) {
        // Send notifications every 7 days
        const daysSinceLastNotification = loan.notificationsSent === 0 ? 999 : 
          Math.floor((new Date() - loan.updatedAt) / (1000 * 60 * 60 * 24));
        
        if (daysSinceLastNotification >= 7) {
          await this.sendOverdueNotification(loan);
        }
      }

      console.log(`Processed ${overdueLoans.length} overdue loans for notifications`);
    } catch (error) {
      console.error('Error sending overdue notifications:', error);
    }
  }
}

module.exports = new NotificationService();