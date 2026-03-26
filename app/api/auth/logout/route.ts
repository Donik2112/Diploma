import { ok } from '@/lib/api';

export async function POST() {
  const response = ok({ loggedOut: true });
  response.cookies.set('token', '', { expires: new Date(0), path: '/' });
  response.cookies.set('refresh_token', '', { expires: new Date(0), path: '/' });
  return response;
}
