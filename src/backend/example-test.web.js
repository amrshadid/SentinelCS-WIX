import { Permissions, webMethod } from 'wix-web-module';
import { formatPhoneNumber } from 'backend/personnel';

export const testPhoneFormatter = webMethod(Permissions.Anyone, () => {
  return { formatted: formatPhoneNumber('2025550123'), expected: '(202) 555-0123' };
});
