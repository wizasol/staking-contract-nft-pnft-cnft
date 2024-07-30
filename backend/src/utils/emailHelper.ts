import sgMail from '@sendgrid/mail';
import nodemailer from 'nodemailer';
// this is needed for nodemailer, some how host properties as a problem
interface MailtrapTransporter {
  host: string;
}
sgMail.setApiKey(process.env.SENDGRID_API_KEY as string);

const sendEmailSendGrid = async (
  dynamicTemplateData: any,
  emailName: string,
  emailTo: string,
  tempId: string
) =>
  sgMail.send({
    to: emailTo,
    from: {
      email: process.env.SENDGRID_FROM_EMAIL as string,
      name: emailName, // if set, this name is showed instead of the entire email
    },
    subject: dynamicTemplateData.subject,
    templateId: tempId,
    dynamicTemplateData,
  });

const sendEmailNodeMailer = async (option: any) => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    auth: {
      user: process.env.SMTP_USER, // generated user like from mailtrap or google
      pass: process.env.SMTP_PASS, // generated password like from mailtrap or google
    },
  } as MailtrapTransporter);

  const message = {
    from: process.env.SENDGRID_FROM_EMAIL, // sender address exp : '"Fred Foo 👻" <foo@example.com>'
    to: option.email, // list of receivers "bar@example.com, baz@example.com"
    subject: option.subject, // Subject line "Hello ✔"
    text: option.message, // plain text body  Hello world?
    html: option.message_html, // html body "<b>Hello world?</b>"
  };

  // send mail with defined transport object
  transporter.sendMail(message); // use await if want to get the info, otherwise just send it ...
  //    more fast without wait
};

module.exports = {
  sendEmailSendGrid,
  sendEmailNodeMailer,
};
