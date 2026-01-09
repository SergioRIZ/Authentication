import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.FROM_EMAIL || 'onboarding@resend.dev';
const APP_NAME = process.env.APP_NAME || 'Auth App';

export async function sendPasswordResetEmail(
  email: string, 
  resetUrl: string
) {
  try {
    const { data, error } = await resend.emails.send({
      from: `${APP_NAME} <${FROM_EMAIL}>`,
      to: email,
      subject: 'Restablecer contraseña',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Restablecer contraseña</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(to right, #3b82f6, #2563eb); padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0;">${APP_NAME}</h1>
            </div>
            <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
              <h2 style="color: #1f2937;">Restablecer contraseña</h2>
              <p>Has solicitado restablecer tu contraseña. Haz clic en el siguiente botón para crear una nueva:</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" style="background: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                  Restablecer contraseña
                </a>
              </div>
              <p style="color: #6b7280; font-size: 14px;">
                Este enlace expirará en 1 hora. Si no solicitaste este cambio, puedes ignorar este email.
              </p>
              <p style="color: #6b7280; font-size: 14px;">
                Si el botón no funciona, copia y pega este enlace en tu navegador:
              </p>
              <p style="color: #3b82f6; font-size: 12px; word-break: break-all;">
                ${resetUrl}
              </p>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error('Error sending email:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error };
  }
}

export async function sendVerificationEmail(
  email: string,
  verifyUrl: string
) {
  try {
    const { data, error } = await resend.emails.send({
      from: `${APP_NAME} <${FROM_EMAIL}>`,
      to: email,
      subject: 'Verifica tu email',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Verifica tu email</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(to right, #10b981, #059669); padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0;">${APP_NAME}</h1>
            </div>
            <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
              <h2 style="color: #1f2937;">¡Bienvenido!</h2>
              <p>Gracias por registrarte. Por favor verifica tu email haciendo clic en el siguiente botón:</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${verifyUrl}" style="background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                  Verificar email
                </a>
              </div>
              <p style="color: #6b7280; font-size: 14px;">
                Este enlace expirará en 24 horas.
              </p>
              <p style="color: #6b7280; font-size: 14px;">
                Si el botón no funciona, copia y pega este enlace en tu navegador:
              </p>
              <p style="color: #10b981; font-size: 12px; word-break: break-all;">
                ${verifyUrl}
              </p>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error('Error sending verification email:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error sending verification email:', error);
    return { success: false, error };
  }
}