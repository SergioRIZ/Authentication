import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`;

  try {
    const data = await resend.emails.send({
      from: 'Auth App <onboarding@resend.dev>',
      to: [email],
      subject: 'Restablecer tu contraseña',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(to right, #3b82f6, #6366f1); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0;">Restablecer contraseña</h1>
            </div>
            
            <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
              <p style="font-size: 16px;">Hola,</p>
              
              <p style="font-size: 16px;">
                Recibimos una solicitud para restablecer la contraseña de tu cuenta.
              </p>
              
              <p style="font-size: 16px;">
                Haz clic en el botón de abajo para crear una nueva contraseña:
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" 
                   style="background: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                  Restablecer contraseña
                </a>
              </div>
              
              <p style="font-size: 14px; color: #6b7280;">
                O copia y pega este enlace en tu navegador:
              </p>
              
              <p style="font-size: 14px; color: #3b82f6; word-break: break-all;">
                ${resetUrl}
              </p>
              
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
              
              <p style="font-size: 14px; color: #6b7280;">
                <strong>Este enlace expirará en 1 hora.</strong>
              </p>
              
              <p style="font-size: 14px; color: #6b7280;">
                Si no solicitaste restablecer tu contraseña, puedes ignorar este email de forma segura.
              </p>
            </div>
            
            <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
              <p>Auth App © 2025</p>
            </div>
          </body>
        </html>
      `,
    });

    return { success: true, data };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error };
  }
}