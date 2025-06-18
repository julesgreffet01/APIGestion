import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
    },
});

export const sendMail = (to: string, token: string) => {
    const baseUrl = process.env.URL_SITE;
    const mailOptions = {
        from: 'Gestion Greffet <gestion.greffetjules@gmail.com>',
        to,
        subject: 'Réinitialisation de mdp',
        text: `Bonjour,\n\nVeuillez cliquer sur le lien suivant pour finaliser votre action :\n${baseUrl}?token=${token}\n\nCordialement,\nL'équipe Gestion Greffet`,
    };

    return transporter.sendMail(mailOptions);
};
