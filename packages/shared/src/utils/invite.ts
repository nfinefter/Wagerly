import { INVITE_CODE_LENGTH } from '../constants';

const CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generateInviteCode(length = INVITE_CODE_LENGTH): string {
  let code = '';
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  for (let i = 0; i < length; i++) {
    code += CHARSET[bytes[i]! % CHARSET.length];
  }
  return code;
}
