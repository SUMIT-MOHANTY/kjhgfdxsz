const nodemailer = require('nodemailer');
const Loan = require('../models/Loan');

class NotificationService {
  constructor() {
    this.transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      }
    });
  }
  
  async sendOverdueNotification(loan) {
    try {
      const overdueDays = Math.ceil(
        (new Date() - new Date(loan.dueDate)) / (1000 * 60 * 60 * 24)
      );
      
      const mailOptions = {
        from: process.env.SMTP_FROM,
        to: loan.user.email,
        subject: 'Overdue Book Reminder - Library Management System',
        html: `
          <h3>Book Overdue Notice</h3>
          <p>Dear ${loan.user.name},</p>
          <p>This is a reminder that the following book is overdue:</p>
          <ul>
            <li><strong>Title:</strong> ${loan.book.title}</li>
            <li><strong>Author:</strong> ${loan.book.author}</li>
            <li><strong>Due Date:</strong> ${loan.dueDate.toDateString()}</li>
            <li><strong>Days Overdue:</strong> ${overdueDays}</li>
            <li><strong>Fine Amount:</strong> $${loan.calculateFine().toFixed(2)}</li>
          </ul>
          <p>Please return the book as soon as possible to avoid additional fines.</p>
          <p>Thank you,<br/>Library Management Team</p>
        `
      };
      
      await this.transporter.sendMail(mailOptions);
      console.log(`Overdue notification sent to ${loan.user.email}`);
      
    } catch (error) {
      console.error('Failed to send overdue notification:', error.message);
    }
  }
  
  async sendDueSoonNotification(loan) {
    try {
      const daysUntilDue = Math.ceil(
        (new Date(loan.dueDate) - new Date()) / (1000 * 60 * 60 * 24)
      );
      
      if (daysUntilDue <= 2 && daysUntilDue > 0) {
        const mailOptions = {
          from: process.env.SMTP_FROM,
          to: loan.user.email,
          subject: 'Book Due Soon - Library Management System',
          html: `
            <h3>Book Due Soon Reminder</h3>
            <p>Dear ${loan.user.name},</p>
            <p>This is a reminder that the following book is due soon:</p>
            <ul>
              <li><strong>Title:</strong> ${loan.book.title}</li>
              <li><strong>Author:</strong> ${loan.book.author}</li>
              <li><strong>Due Date:</strong> ${loan.dueDate.toDateString()}</li>
              <li><strong>Days Until Due:</strong> ${daysUntilDue}</li>
            </ul>
            <p>Please return the book by the due date or renew it if needed.</p>
            <p>Thank you,<br/>Library Management Team</p>
          `
        };
        
        await this.transporter.sendMail(mailOptions);
        console.log(`Due soon notification sent to ${loan.user.email}`);
      }
      
    } catch (error) {
      console.error('Failed to send due soon notification:', error.message);
    }
  }
  
  async checkAndSendNotifications() {
    try {
      // Get all active loans
      const activeLoans = await Loan.find({ isReturned: false })
        .populate(['user', 'book']);
      
      for (const loan of activeLoans) {
        if (loan.isOverdue()) {
          await this.sendOverdueNotification(loan);
        } else {
          await this.sendDueSoonNotification(loan);
        }
      }
      
    } catch (error) {
      console.error('Failed to check and send notifications:', error.message);
    }
  }
}

module.exports = new NotificationService();