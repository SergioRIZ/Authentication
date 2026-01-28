import dns from "dns";
import { promisify } from "util";

const resolveMx = promisify(dns.resolveMx);

/**
 * List of known disposable/temporary email domains.
 * This blocks throwaway email services commonly used for spam.
 */
const DISPOSABLE_DOMAINS = new Set([
  // Popular disposable email services
  "mailinator.com",
  "guerrillamail.com",
  "guerrillamail.net",
  "guerrillamail.org",
  "guerrillamail.de",
  "grr.la",
  "guerrillamailblock.com",
  "tempmail.com",
  "temp-mail.org",
  "temp-mail.io",
  "throwaway.email",
  "throwaway.com",
  "yopmail.com",
  "yopmail.fr",
  "yopmail.net",
  "dispostable.com",
  "sharklasers.com",
  "guerrillamail.info",
  "spam4.me",
  "trashmail.com",
  "trashmail.me",
  "trashmail.net",
  "trashmail.org",
  "trashymail.com",
  "10minutemail.com",
  "10minutemail.net",
  "minutemail.com",
  "tempinbox.com",
  "tempr.email",
  "discard.email",
  "discardmail.com",
  "discardmail.de",
  "fakeinbox.com",
  "fakemail.fr",
  "fakemail.net",
  "mailnesia.com",
  "maildrop.cc",
  "mailexpire.com",
  "mailforspam.com",
  "mailnull.com",
  "mailcatch.com",
  "meltmail.com",
  "harakirimail.com",
  "mailscrap.com",
  "nospam.ze.tc",
  "getairmail.com",
  "filzmail.com",
  "inboxbear.com",
  "jetable.org",
  "mailmoat.com",
  "mytrashmail.com",
  "safetymail.info",
  "spambox.us",
  "spamcero.com",
  "spamgourmet.com",
  "tempomail.fr",
  "trashymail.net",
  "binkmail.com",
  "bobmail.info",
  "chammy.info",
  "devnullmail.com",
  "emailigo.de",
  "emailsensei.com",
  "emailtemporario.com.br",
  "ephemail.net",
  "gishpuppy.com",
  "hulapla.de",
  "incognitomail.org",
  "iPecMail.com",
  "kasmail.com",
  "mailblocks.com",
  "mailhazard.com",
  "mailimate.com",
  "mailmetrash.com",
  "mailzilla.com",
  "mezimages.net",
  "mintemail.com",
  "nobulk.com",
  "nowmymail.com",
  "pookmail.com",
  "shieldedmail.com",
  "spamavert.com",
  "spamfree24.org",
  "spamherelots.com",
  "spaml.de",
  "tempemail.net",
  "temporaryemail.net",
  "temporaryinbox.com",
  "thankyou2010.com",
  "trashemail.de",
  "trashmail.at",
  "wegwerfmail.de",
  "wegwerfmail.net",
  "wuzup.net",
  "wuzupmail.net",
  "zoemail.org",
  "mailnator.com",
  "boun.cr",
  "brefmail.com",
  "broadbandninja.com",
  "bugmenot.com",
  "deadaddress.com",
  "despam.it",
  "disposeamail.com",
  "dodgeit.com",
  "emailthe.net",
  "etranquil.com",
  "etranquil.net",
  "etranquil.org",
  "getnowmail.com",
  "hide.biz.st",
  "hidzz.com",
  "lhsdv.com",
  "lookugly.com",
  "mailin8r.com",
  "mailinator.net",
  "mailinator.org",
  "mailinator2.com",
  "mailme.ir",
  "mailme.lv",
  "nomail.xl.cx",
  "nomail2me.com",
  "nospamfor.us",
  "plasticemail.com",
  "rmqkr.net",
  "s0ny.net",
  "safersignup.de",
  "sogetthis.com",
  "spamhereplease.com",
  "supergreatmail.com",
  "teleworm.us",
  "tempe-mail.com",
  "tempemail.co.za",
  "temporarily.de",
  "temporarioemail.com.br",
  "temporaryforwarding.com",
  "thankdog.com",
  "thisisnotmyrealemail.com",
  "veryrealemail.com",
  "whyspam.me",
  "willhackforfood.biz",
  "willselfdestruct.com",
]);

/**
 * Check if an email domain is a known disposable email provider.
 */
export function isDisposableEmail(email: string): boolean {
  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain) return false;
  return DISPOSABLE_DOMAINS.has(domain);
}

/**
 * Verify that an email domain has valid MX records.
 * This confirms the domain can actually receive emails.
 */
export async function hasMxRecords(email: string): Promise<boolean> {
  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain) return false;

  try {
    const records = await resolveMx(domain);
    return records.length > 0;
  } catch {
    // DNS resolution failed — domain likely doesn't exist
    return false;
  }
}

/**
 * Validate an email address for registration.
 * Checks for disposable domains and MX record existence.
 */
export async function validateEmailForRegistration(
  email: string
): Promise<{ valid: boolean; reason?: string }> {
  // Check disposable email
  if (isDisposableEmail(email)) {
    return {
      valid: false,
      reason: "No se permiten emails temporales o desechables.",
    };
  }

  // Check MX records
  const hasMx = await hasMxRecords(email);
  if (!hasMx) {
    return {
      valid: false,
      reason:
        "El dominio del email no es válido o no puede recibir correos.",
    };
  }

  return { valid: true };
}
